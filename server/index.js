import express from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { INITIAL_PRODUCTS, INITIAL_SITE_CONFIG, INITIAL_FAQS } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Configure reverse proxy trust safely for Render / Railway single-hop load balancers
const trustProxySetting =
  process.env.TRUST_PROXY !== undefined
    ? process.env.TRUST_PROXY === 'false'
      ? false
      : Number(process.env.TRUST_PROXY) || 1
    : 1;
app.set('trust proxy', trustProxySetting);
app.disable('x-powered-by');

// --- SECURITY HEADERS & NORMALIZED CORS CONFIGURATION ---

function getAllowedOrigins() {
  const configured = [
    process.env.ALLOWED_ORIGINS,
    process.env.CORS_ORIGIN,
    process.env.FRONTEND_URL
  ]
    .filter(Boolean)
    .flatMap((val) => String(val).split(','))
    .map((o) => o.trim().replace(/\/+$/, '').toLowerCase())
    .filter(Boolean);

  if (!IS_PRODUCTION) {
    configured.push(
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:4173',
      'http://127.0.0.1:4173',
      `http://localhost:${PORT}`,
      `http://127.0.0.1:${PORT}`
    );
  }

  return new Set(configured);
}

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  const originHeader = req.headers.origin;
  if (!originHeader) {
    return next();
  }

  const rawOrigin = String(originHeader).trim().replace(/\/+$/, '');
  const normalizedOrigin = rawOrigin.toLowerCase();
  const allowedOrigins = getAllowedOrigins();

  const hostHeader = req.headers.host;
  const protocol = req.protocol || 'http';
  const selfOrigin = hostHeader ? `${protocol}://${hostHeader}`.toLowerCase() : '';

  const isAllowed =
    allowedOrigins.has(normalizedOrigin) ||
    (selfOrigin && normalizedOrigin === selfOrigin);

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', rawOrigin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Razorpay-Signature, X-Webhook-Event-Id, Accept'
    );
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    return next();
  }

  if (req.method === 'OPTIONS') {
    return res.status(403).json({ error: 'Origin not allowed by CORS policy.' });
  }

  if (req.path.startsWith('/api')) {
    return res.status(403).json({ error: 'Origin not allowed by CORS policy.' });
  }

  return next();
});

// Capture exact raw HTTP request bytes on req.rawBody for cryptographic webhook verification
// while preserving standard JSON parsing for all endpoints.
app.use(
  express.json({
    limit: '5mb',
    verify: (req, _res, buf) => {
      if (buf && buf.length > 0) {
        req.rawBody = Buffer.from(buf);
      } else {
        req.rawBody = Buffer.alloc(0);
      }
    }
  })
);

// Handle malformed JSON request bodies cleanly
app.use((err, _req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON request payload.' });
  }
  return next(err);
});

// --- BOUNDED IN-PROCESS RATE LIMITER ---

const rateLimitBuckets = new Map();
const MAX_RATE_LIMIT_BUCKETS = 10000;

function pruneRateLimitBuckets(now = Date.now()) {
  for (const [key, entry] of rateLimitBuckets.entries()) {
    if (now > entry.resetAt) {
      rateLimitBuckets.delete(key);
    }
  }
  while (rateLimitBuckets.size >= MAX_RATE_LIMIT_BUCKETS) {
    const oldestKey = rateLimitBuckets.keys().next().value;
    if (!oldestKey) break;
    rateLimitBuckets.delete(oldestKey);
  }
}

function createRateLimiter({ windowMs, maxRequests, keyPrefix, message }) {
  return (req, res, next) => {
    const now = Date.now();
    const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
    const bucketKey = `${keyPrefix}:${clientIp}`;

    let entry = rateLimitBuckets.get(bucketKey);
    if (!entry || now > entry.resetAt) {
      if (rateLimitBuckets.size >= MAX_RATE_LIMIT_BUCKETS) {
        pruneRateLimitBuckets(now);
      }
      entry = { count: 0, resetAt: now + windowMs };
      rateLimitBuckets.set(bucketKey, entry);
    }

    entry.count += 1;

    const remaining = Math.max(0, maxRequests - entry.count);
    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(remaining));

    if (entry.count > maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({
        error: message || 'Too many requests. Please wait a few minutes before trying again.'
      });
    }

    return next();
  };
}

const rateLimitCleanupTimer = setInterval(() => {
  pruneRateLimitBuckets(Date.now());
}, 60 * 1000);
rateLimitCleanupTimer.unref?.();

const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
  keyPrefix: 'auth',
  message: 'Too many authentication attempts. Please wait 15 minutes and try again.'
});

const passwordResetRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 8,
  keyPrefix: 'pwd-reset',
  message: 'Too many password reset requests. Please wait 15 minutes and try again.'
});

const contactRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  keyPrefix: 'contact',
  message: 'Too many inquiries submitted from this address. Please try again later.'
});

const orderCreateRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
  keyPrefix: 'order-create',
  message: 'Too many order creation requests. Please wait a few minutes and try again.'
});

const orderLookupRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 30,
  keyPrefix: 'order-lookup',
  message: 'Too many order lookup attempts. Please wait a few minutes and try again.'
});

const paymentVerifyRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 15,
  keyPrefix: 'payment-verify',
  message: 'Too many payment verification attempts. Please wait a few minutes and try again.'
});

// --- CONFIGURABLE SQLITE DATABASE INITIALIZATION ---

const configuredDbPath = process.env.DATABASE_PATH || process.env.SQLITE_DB_PATH;
const dbPath = configuredDbPath
  ? path.resolve(configuredDbPath)
  : path.join(__dirname, 'flange_craft.db');

let db;
try {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA busy_timeout = 5000;');
} catch (dbInitErr) {
  console.error('CRITICAL: Failed to initialize SQLite database:', dbInitErr);
  process.exit(1);
}

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      category TEXT NOT NULL,
      category_label TEXT NOT NULL,
      shape TEXT NOT NULL,
      size TEXT NOT NULL,
      dimensions TEXT NOT NULL,
      sku TEXT NOT NULL,
      price REAL,
      price_configured INTEGER DEFAULT 0,
      in_stock INTEGER DEFAULT 1,
      inventory INTEGER DEFAULT 20,
      featured INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 1,
      images_json TEXT NOT NULL,
      summary TEXT NOT NULL,
      description TEXT NOT NULL,
      features_json TEXT NOT NULL,
      specifications_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT DEFAULT '',
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT DEFAULT 'customer',
      email_verified INTEGER DEFAULT 0,
      addresses_json TEXT DEFAULT '[]',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT UNIQUE NOT NULL,
      expires_at INTEGER NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      user_id TEXT,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      shipping_address_json TEXT NOT NULL,
      items_json TEXT NOT NULL,
      subtotal REAL,
      shipping_fee REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      total_amount REAL,
      has_unconfigured_price INTEGER DEFAULT 0,
      payment_method TEXT NOT NULL,
      payment_status TEXT DEFAULT 'pending',
      payment_verified INTEGER DEFAULT 0,
      inventory_deducted INTEGER DEFAULT 0,
      razorpay_order_id TEXT,
      razorpay_payment_id TEXT UNIQUE,
      razorpay_signature TEXT,
      payment_mode TEXT DEFAULT 'test_unconfigured',
      order_status TEXT DEFAULT 'pending',
      shipping_status TEXT DEFAULT 'not_shipped',
      tracking_number TEXT DEFAULT '',
      tracking_carrier TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS processed_webhooks (
      event_id TEXT PRIMARY KEY,
      order_id TEXT,
      event_type TEXT NOT NULL,
      processed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT DEFAULT '',
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'new',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS faqs (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      sort_order INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS site_config (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Non-destructive column migrations for existing databases
  const userCols = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
  if (!userCols.includes('email_verified')) {
    db.exec('ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0;');
  }

  const orderCols = db.prepare('PRAGMA table_info(orders)').all().map((c) => c.name);
  if (!orderCols.includes('inventory_deducted')) {
    db.exec('ALTER TABLE orders ADD COLUMN inventory_deducted INTEGER DEFAULT 0;');
    db.exec('UPDATE orders SET inventory_deducted = 1 WHERE payment_verified = 1;');
  }
} catch (schemaErr) {
  console.error('CRITICAL: Failed to initialize database schema:', schemaErr);
  process.exit(1);
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(String(password), String(salt), 10000, 64, 'sha512').toString('hex');
}

function verifyPasswordHash(candidatePassword, salt, expectedHashHex) {
  if (!salt || !expectedHashHex) return false;
  try {
    const candidateHex = hashPassword(candidatePassword, salt);
    const candidateBuf = Buffer.from(candidateHex, 'hex');
    const expectedBuf = Buffer.from(String(expectedHashHex), 'hex');
    if (candidateBuf.length !== expectedBuf.length || candidateBuf.length === 0) {
      return false;
    }
    return crypto.timingSafeEqual(candidateBuf, expectedBuf);
  } catch {
    return false;
  }
}

function hashTokenSha256(rawToken) {
  return crypto.createHash('sha256').update(String(rawToken)).digest('hex');
}

function parseJsonSafe(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// --- PHASE 4: LEGACY ADMIN REVOCATION & ENVIRONMENT ADMIN PROVISIONING ---

function provisionAdminFromEnv() {
  const envAdminEmail = process.env.ADMIN_EMAIL ? String(process.env.ADMIN_EMAIL).trim().toLowerCase() : '';
  const envAdminPassword = process.env.ADMIN_PASSWORD ? String(process.env.ADMIN_PASSWORD) : '';

  // Revoke any legacy seeded admin account ('usr-admin-1') regardless of created_at timestamp.
  // The original seed always created id = 'usr-admin-1' with email = 'admin@flangecraft.com'.
  const legacyById = db
    .prepare('SELECT id, email FROM users WHERE id = ? AND role = ?')
    .get('usr-admin-1', 'admin');

  if (legacyById) {
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(legacyById.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(legacyById.id);
    console.warn('Security remediation: Revoked legacy seeded administrator account (usr-admin-1).');
  }

  // Also revoke any leftover admin account using the legacy default email 'admin@flangecraft.com'
  // unless the operator explicitly configured ADMIN_EMAIL='admin@flangecraft.com' with a valid new password
  // and that account was already re-provisioned with a non-legacy id.
  const legacyByEmail = db
    .prepare('SELECT id, email FROM users WHERE LOWER(email) = ? AND role = ?')
    .get('admin@flangecraft.com', 'admin');

  if (legacyByEmail && envAdminEmail !== 'admin@flangecraft.com') {
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(legacyByEmail.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(legacyByEmail.id);
    console.warn('Security remediation: Revoked legacy default administrator email record.');
  }

  // Do not overwrite or reset an existing legitimate admin account on every server restart
  const existingAdmin = db.prepare('SELECT id, email FROM users WHERE role = ? LIMIT 1').get('admin');
  if (existingAdmin) {
    return;
  }

  if (!envAdminEmail || !envAdminPassword) {
    console.warn(
      'Admin provisioning notice: No admin user exists in the database and ADMIN_EMAIL / ADMIN_PASSWORD are not set. Skipping initial admin creation.'
    );
    return;
  }

  if (!EMAIL_REGEX.test(envAdminEmail)) {
    console.error('Admin provisioning error: ADMIN_EMAIL is not a valid email address. Skipping initial admin creation.');
    return;
  }

  if (envAdminPassword.length < 8) {
    console.error('Admin provisioning error: ADMIN_PASSWORD must be at least 8 characters long. Skipping initial admin creation.');
    return;
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(envAdminPassword, salt);
  const now = new Date().toISOString();

  const existingUserByEmail = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(envAdminEmail);
  if (existingUserByEmail) {
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(existingUserByEmail.id);
    db.prepare('UPDATE users SET password_hash = ?, salt = ?, role = ?, email_verified = 1 WHERE id = ?').run(
      hash,
      salt,
      'admin',
      existingUserByEmail.id
    );
  } else {
    const adminId = 'usr-admin-' + crypto.randomUUID().slice(0, 8);
    db.prepare(`
      INSERT INTO users (id, name, email, phone, password_hash, salt, role, email_verified, addresses_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'admin', 1, '[]', ?)
    `).run(adminId, 'Sunil Shukla (Admin)', envAdminEmail, '', hash, salt, now);
  }

  console.log('Initial administrator account provisioned from environment variables.');
}

function seedDatabase() {
  try {
    const countRow = db.prepare('SELECT COUNT(*) as count FROM products').get();
    if (!countRow || countRow.count === 0) {
      const insertProduct = db.prepare(`
        INSERT INTO products (
          id, slug, name, short_name, category, category_label, shape, size, dimensions,
          sku, price, price_configured, in_stock, inventory, featured, sort_order,
          images_json, summary, description, features_json, specifications_json, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const now = new Date().toISOString();
      for (const p of INITIAL_PRODUCTS) {
        insertProduct.run(
          p.id,
          p.slug,
          p.name,
          p.shortName,
          p.category,
          p.categoryLabel,
          p.shape,
          p.size,
          p.dimensions,
          p.sku,
          p.price,
          p.priceConfigured,
          p.inStock,
          p.inventory,
          p.featured,
          p.sortOrder,
          JSON.stringify(p.images),
          p.summary,
          p.description,
          JSON.stringify(p.features),
          JSON.stringify(p.specifications),
          now
        );
      }
    }

    const configRow = db.prepare('SELECT key FROM site_config WHERE key = ?').get('main');
    if (!configRow) {
      db.prepare('INSERT INTO site_config (key, value_json, updated_at) VALUES (?, ?, ?)').run(
        'main',
        JSON.stringify(INITIAL_SITE_CONFIG),
        new Date().toISOString()
      );
    }

    const faqCount = db.prepare('SELECT COUNT(*) as count FROM faqs').get();
    if (!faqCount || faqCount.count === 0) {
      const insertFaq = db.prepare('INSERT INTO faqs (id, category, question, answer, sort_order) VALUES (?, ?, ?, ?, ?)');
      INITIAL_FAQS.forEach((f, idx) => {
        insertFaq.run(f.id, f.category, f.question, f.answer, idx + 1);
      });
    }

    provisionAdminFromEnv();

    // Clean up expired sessions & password reset tokens on startup
    const nowMs = Date.now();
    db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(nowMs);
    db.prepare('DELETE FROM password_resets WHERE expires_at < ? OR used = 1').run(nowMs);
  } catch (seedErr) {
    console.error('Database seed / startup maintenance error:', seedErr);
  }
}

seedDatabase();

// --- PAYMENT GATEWAY STATUS HELPERS (PHASE 2: RAZORPAY IS NOT CONFIGURED BY DEFAULT) ---

function hasLiveRazorpayCredentials() {
  return Boolean(
    process.env.RAZORPAY_KEY_ID &&
      String(process.env.RAZORPAY_KEY_ID).trim() &&
      process.env.RAZORPAY_KEY_SECRET &&
      String(process.env.RAZORPAY_KEY_SECRET).trim()
  );
}

function isNonProdPaymentSandboxEnabled() {
  // Strictly disabled in production, and disabled by default in development unless explicitly enabled for automated test fixtures
  return !IS_PRODUCTION && process.env.ENABLE_RAZORPAY_SANDBOX === 'true';
}

function getPaymentGatewayMode() {
  if (hasLiveRazorpayCredentials()) return 'live_razorpay';
  if (isNonProdPaymentSandboxEnabled()) return 'test_sandbox';
  return 'disabled';
}

function isOnlinePaymentAvailable() {
  return hasLiveRazorpayCredentials() || isNonProdPaymentSandboxEnabled();
}

function formatProductRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortName: row.short_name,
    category: row.category,
    categoryLabel: row.category_label,
    shape: row.shape,
    size: row.size,
    dimensions: row.dimensions,
    sku: row.sku,
    price: row.price !== null && row.price !== undefined ? Number(row.price) : null,
    priceConfigured: Boolean(row.price_configured && row.price !== null && row.price > 0),
    inStock: Boolean(row.in_stock && Number(row.inventory) > 0),
    inventory: Number(row.inventory),
    featured: Boolean(row.featured),
    sortOrder: Number(row.sort_order),
    images: parseJsonSafe(row.images_json, []),
    summary: row.summary,
    description: row.description,
    features: parseJsonSafe(row.features_json, []),
    specifications: parseJsonSafe(row.specifications_json, []),
    updatedAt: row.updated_at
  };
}

function formatOrderRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    shippingAddress: parseJsonSafe(row.shipping_address_json, {}),
    items: parseJsonSafe(row.items_json, []),
    subtotal: row.subtotal !== null ? Number(row.subtotal) : null,
    shippingFee: Number(row.shipping_fee || 0),
    taxAmount: Number(row.tax_amount || 0),
    totalAmount: row.total_amount !== null ? Number(row.total_amount) : null,
    hasUnconfiguredPrice: Boolean(row.has_unconfigured_price),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    paymentVerified: Boolean(row.payment_verified),
    razorpayOrderId: row.razorpay_order_id,
    razorpayPaymentId: row.razorpay_payment_id,
    paymentMode: row.payment_mode,
    orderStatus: row.order_status,
    shippingStatus: row.shipping_status,
    trackingNumber: row.tracking_number,
    trackingCarrier: row.tracking_carrier,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function maskName(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'Customer';
  return parts
    .map((part) => (part.length <= 1 ? part : `${part[0]}${'*'.repeat(Math.min(4, part.length - 1))}`))
    .join(' ');
}

function maskEmail(email) {
  const str = String(email || '').trim();
  const atIndex = str.indexOf('@');
  if (atIndex <= 0) return '***';
  const local = str.slice(0, atIndex);
  const domain = str.slice(atIndex + 1);
  const maskedLocal = local.length <= 2 ? `${local[0] || '*'}***` : `${local.slice(0, 2)}***`;
  return `${maskedLocal}@${domain}`;
}

function maskPhone(phone) {
  const digits = String(phone || '').replace(/\s+/g, '');
  if (digits.length <= 4) return '****';
  return `${'*'.repeat(Math.max(4, digits.length - 4))}${digits.slice(-4)}`;
}

// Privacy-safe order representation for unauthenticated order-number lookup
function formatPublicOrderTrackingRow(row) {
  if (!row) return null;
  const fullAddr = parseJsonSafe(row.shipping_address_json, {});
  const rawItems = parseJsonSafe(row.items_json, []);
  return {
    id: row.order_number,
    orderNumber: row.order_number,
    userId: null,
    customerName: maskName(row.customer_name),
    customerEmail: maskEmail(row.customer_email),
    customerPhone: maskPhone(row.customer_phone),
    shippingAddress: {
      fullName: maskName(fullAddr.fullName || row.customer_name),
      phone: '',
      address: 'Protected for customer privacy',
      city: fullAddr.city || '',
      state: fullAddr.state || '',
      postalCode: fullAddr.postalCode ? `${String(fullAddr.postalCode).slice(0, 2)}****` : '',
      country: fullAddr.country || 'India'
    },
    items: rawItems,
    subtotal: row.subtotal !== null ? Number(row.subtotal) : null,
    shippingFee: Number(row.shipping_fee || 0),
    taxAmount: Number(row.tax_amount || 0),
    totalAmount: row.total_amount !== null ? Number(row.total_amount) : null,
    hasUnconfiguredPrice: Boolean(row.has_unconfigured_price),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    paymentVerified: Boolean(row.payment_verified),
    razorpayOrderId: null,
    razorpayPaymentId: null,
    paymentMode: row.payment_mode,
    orderStatus: row.order_status,
    shippingStatus: row.shipping_status,
    trackingNumber: row.tracking_number,
    trackingCarrier: row.tracking_carrier,
    notes: '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// --- PHASE 7: HASHED SESSION TOKEN STORAGE & LOOKUP ---

function createSessionForUser(userId) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashTokenSha256(rawToken);
  const now = new Date().toISOString();
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7;

  db.prepare('INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)').run(
    tokenHash,
    userId,
    expiresAt,
    now
  );

  return rawToken;
}

function getAuthenticatedUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const rawToken = authHeader.slice(7).trim();
  if (!rawToken) return null;

  const tokenHash = hashTokenSha256(rawToken);
  const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(tokenHash);
  if (!session) return null;

  if (Date.now() > session.expires_at) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(tokenHash);
    return null;
  }

  const user = db
    .prepare('SELECT id, name, email, phone, role, email_verified, addresses_json, created_at FROM users WHERE id = ?')
    .get(session.user_id);
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    emailVerified: Boolean(user.email_verified),
    addresses: parseJsonSafe(user.addresses_json, []),
    createdAt: user.created_at
  };
}

function isUserAuthorizedForOrder(user, orderRow) {
  if (!user || !orderRow) return false;
  if (user.role === 'admin') return true;
  if (orderRow.user_id && user.id === orderRow.user_id) return true;
  // Guest orders (user_id IS NULL) are NEVER automatically accessible to unverified accounts
  if (!orderRow.user_id && user.emailVerified && orderRow.customer_email) {
    return user.email.toLowerCase() === String(orderRow.customer_email).toLowerCase();
  }
  return false;
}

function requireAuth(req, res, next) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Administrator authorization required.' });
  }
  req.user = user;
  next();
}

// Validate strict product catalogue accuracy rule: Rotating products are round only!
function validateProductVariantRule(category, shape) {
  if (String(category).toLowerCase() === 'rotating' && String(shape).toLowerCase() !== 'round') {
    return 'Product accuracy violation: Rotating Lollipop Flange signs are available in Round shape only. Square rotating variants are prohibited.';
  }
  return null;
}

// --- PUBLIC ENDPOINTS ---

app.get('/api/health', (_req, res) => {
  try {
    const dbCheck = db.prepare('SELECT 1 as ok').get();
    if (!dbCheck || dbCheck.ok !== 1) {
      return res.status(503).json({
        status: 'error',
        database: 'sqlite_unavailable',
        timestamp: new Date().toISOString()
      });
    }
    res.json({
      status: 'ok',
      database: 'sqlite_connected',
      paymentGatewayMode: getPaymentGatewayMode(),
      timestamp: new Date().toISOString()
    });
  } catch {
    res.status(503).json({
      status: 'error',
      database: 'sqlite_error',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/bootstrap', (_req, res) => {
  try {
    const productRows = db.prepare('SELECT * FROM products ORDER BY sort_order ASC').all();
    const configRow = db.prepare('SELECT value_json FROM site_config WHERE key = ?').get('main');
    const faqRows = db.prepare('SELECT * FROM faqs ORDER BY sort_order ASC').all();
    const hasLiveRazorpay = hasLiveRazorpayCredentials();
    const gatewayMode = getPaymentGatewayMode();

    const siteConfig = configRow ? parseJsonSafe(configRow.value_json, INITIAL_SITE_CONFIG) : INITIAL_SITE_CONFIG;
    res.json({
      products: productRows.map(formatProductRow),
      siteConfig,
      faqs: faqRows,
      paymentGatewayStatus: {
        liveCredentialsConfigured: hasLiveRazorpay,
        onlinePaymentsEnabled: isOnlinePaymentAvailable(),
        keyId: hasLiveRazorpay ? process.env.RAZORPAY_KEY_ID : '',
        mode: gatewayMode
      }
    });
  } catch (err) {
    console.error('Bootstrap error:', err);
    res.status(500).json({ error: 'Failed to load store configuration.' });
  }
});

app.get('/api/products', (_req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM products ORDER BY sort_order ASC').all();
    res.json({ products: rows.map(formatProductRow) });
  } catch (err) {
    console.error('Products list error:', err);
    res.status(500).json({ error: 'Failed to load products.' });
  }
});

app.get('/api/products/:slug', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM products WHERE slug = ? OR id = ?').get(req.params.slug, req.params.slug);
    if (!row) {
      return res.status(404).json({ error: 'Product variant not found.' });
    }
    res.json({ product: formatProductRow(row) });
  } catch (err) {
    console.error('Product detail error:', err);
    res.status(500).json({ error: 'Failed to load product details.' });
  }
});

// --- AUTHENTICATION ENDPOINTS ---

app.post('/api/auth/register', authRateLimiter, (req, res) => {
  try {
    const { name, email, phone, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPhone = String(phone || '').trim();
    const rawPassword = String(password);

    if (cleanName.length < 2 || cleanName.length > 120) {
      return res.status(400).json({ error: 'Name must be between 2 and 120 characters.' });
    }
    if (!EMAIL_REGEX.test(cleanEmail) || cleanEmail.length > 254) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (rawPassword.length < 6 || rawPassword.length > 128) {
      return res.status(400).json({ error: 'Password must be between 6 and 128 characters.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const userId = 'usr-' + crypto.randomUUID();
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(rawPassword, salt);
    const now = new Date().toISOString();

    // Newly registered accounts start with email_verified = 0 so they cannot hijack prior guest orders
    db.prepare(`
      INSERT INTO users (id, name, email, phone, password_hash, salt, role, email_verified, addresses_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'customer', 0, '[]', ?)
    `).run(userId, cleanName, cleanEmail, cleanPhone, hash, salt, now);

    const token = createSessionForUser(userId);

    res.status(201).json({
      token,
      user: {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        role: 'customer',
        addresses: [],
        createdAt: now
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Unable to complete registration at this time.' });
  }
});

app.post('/api/auth/login', authRateLimiter, (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    if (!user || !verifyPasswordHash(String(password), user.salt, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Opportunistically clean expired sessions
    db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());

    const token = createSessionForUser(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: parseJsonSafe(user.addresses_json, []),
        createdAt: user.created_at
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Unable to process sign-in request.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const rawToken = authHeader.slice(7).trim();
      if (rawToken) {
        const tokenHash = hashTokenSha256(rawToken);
        db.prepare('DELETE FROM sessions WHERE token = ?').run(tokenHash);
      }
    }
    res.json({ success: true });
  } catch {
    res.json({ success: true });
  }
});

// --- PHASE 5: SECURE PASSWORD RESET ARCHITECTURE ---

function isResetEmailProviderConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

async function sendPasswordResetEmail({ toEmail, toName, resetToken }) {
  const frontendBase = (
    process.env.FRONTEND_URL ||
    (process.env.ALLOWED_ORIGINS ? String(process.env.ALLOWED_ORIGINS).split(',')[0] : '') ||
    'http://localhost:5173'
  )
    .trim()
    .replace(/\/+$/, '');

  const resetUrl = `${frontendBase}/login?resetToken=${encodeURIComponent(resetToken)}`;
  const emailApiUrl = process.env.RESEND_API_URL || 'https://api.resend.com/emails';

  const response = await fetch(emailApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [toEmail],
      subject: 'Flange Craft — Password Reset Request',
      text: `Hello ${toName || 'Customer'},\n\nWe received a request to reset your Flange Craft account password.\n\nUse the following single-use link within 15 minutes to reset your password:\n${resetUrl}\n\nIf you did not request this change, you can safely ignore this email.`
    })
  });

  if (!response.ok) {
    throw new Error(`Email provider responded with status ${response.status}`);
  }
}

app.post('/api/auth/forgot-password', passwordResetRateLimiter, async (req, res) => {
  const startTime = Date.now();
  const minResponseTimeMs = Number(process.env.RESET_MIN_RESPONSE_MS) || 120;
  const { email, newPassword } = req.body || {};

  // Reject any attempt to directly modify a password through forgot-password
  if (newPassword !== undefined) {
    return res.status(403).json({
      error: 'Direct password modification without a verified reset token is prohibited.'
    });
  }

  if (!email || !EMAIL_REGEX.test(String(email).trim())) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  if (!isResetEmailProviderConfigured()) {
    return res.status(503).json({
      error:
        'Automated password reset is temporarily unavailable because email verification delivery is not configured. Please contact Flange Craft support via the Contact page for assistance.'
    });
  }

  const genericMessage =
    'If an eligible account is registered with that email address, a password reset link has been sent.';

  let resetRecordId = null;

  try {
    const cleanEmail = String(email).trim().toLowerCase();
    const user = db.prepare('SELECT id, name, email, role FROM users WHERE LOWER(email) = ?').get(cleanEmail);

    // Always generate a token & hash even for nonexistent/admin users to normalize CPU work
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashTokenSha256(rawToken);

    if (user && user.role !== 'admin') {
      db.prepare('DELETE FROM password_resets WHERE user_id = ? OR expires_at < ?').run(user.id, Date.now());

      resetRecordId = 'rst-' + crypto.randomUUID();
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO password_resets (id, user_id, token_hash, expires_at, used, created_at)
        VALUES (?, ?, ?, ?, 0, ?)
      `).run(resetRecordId, user.id, tokenHash, expiresAt, now);

      try {
        await sendPasswordResetEmail({
          toEmail: user.email,
          toName: user.name,
          resetToken: rawToken
        });
      } catch (emailErr) {
        // Invalidate/delete the generated token immediately if email delivery fails so no orphaned token remains
        db.prepare('DELETE FROM password_resets WHERE id = ?').run(resetRecordId);
        resetRecordId = null;
        console.error('Password reset email delivery failed (token revoked):', emailErr.message || emailErr);
      }
    }
  } catch (err) {
    if (resetRecordId) {
      try {
        db.prepare('DELETE FROM password_resets WHERE id = ?').run(resetRecordId);
      } catch {
        // ignore cleanup error
      }
    }
    console.error('Password reset processing error:', err);
  }

  // Pad response timing to reduce timing side-channels between existing and nonexistent emails
  const elapsed = Date.now() - startTime;
  if (elapsed < minResponseTimeMs) {
    await new Promise((resolve) => setTimeout(resolve, minResponseTimeMs - elapsed));
  }

  return res.json({
    success: true,
    message: genericMessage
  });
});

app.post('/api/auth/reset-password', passwordResetRateLimiter, (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || typeof token !== 'string' || token.trim().length < 32) {
      return res.status(400).json({ error: 'A valid password reset token is required.' });
    }
    if (!newPassword || String(newPassword).length < 6 || String(newPassword).length > 128) {
      return res.status(400).json({ error: 'New password must be between 6 and 128 characters.' });
    }

    const tokenHash = hashTokenSha256(token.trim());
    const resetRecord = db
      .prepare('SELECT * FROM password_resets WHERE token_hash = ? AND used = 0')
      .get(tokenHash);

    if (!resetRecord || Date.now() > resetRecord.expires_at) {
      if (resetRecord) {
        db.prepare('DELETE FROM password_resets WHERE id = ?').run(resetRecord.id);
      }
      return res.status(400).json({
        error: 'This password reset link is invalid or has expired. Please request a new reset link.'
      });
    }

    const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(resetRecord.user_id);
    if (!user || user.role === 'admin') {
      db.prepare('DELETE FROM password_resets WHERE id = ?').run(resetRecord.id);
      return res.status(400).json({
        error: 'This password reset link is invalid or has expired.'
      });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(String(newPassword), salt);

    db.exec('BEGIN IMMEDIATE TRANSACTION');
    try {
      // Verify inside transaction that token has not been consumed concurrently
      const freshRecord = db
        .prepare('SELECT id, used, expires_at FROM password_resets WHERE id = ? AND used = 0')
        .get(resetRecord.id);
      if (!freshRecord || Date.now() > freshRecord.expires_at) {
        db.exec('ROLLBACK');
        return res.status(400).json({
          error: 'This password reset link has already been used or has expired.'
        });
      }

      // Mark token single-use
      db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(resetRecord.id);
      // Update user password and mark email verified (since token was delivered via email)
      db.prepare('UPDATE users SET password_hash = ?, salt = ?, email_verified = 1 WHERE id = ?').run(
        hash,
        salt,
        user.id
      );
      // Invalidate all existing sessions for this user
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    res.json({
      success: true,
      message: 'Your password has been reset and existing sessions have been signed out. You can now sign in.'
    });
  } catch (err) {
    console.error('Reset password confirmation error:', err);
    res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.put('/api/auth/profile', requireAuth, (req, res) => {
  try {
    const { name, phone, addresses } = req.body || {};
    const updatedName = name ? String(name).trim() : req.user.name;
    if (updatedName.length < 2 || updatedName.length > 120) {
      return res.status(400).json({ error: 'Name must be between 2 and 120 characters.' });
    }
    const updatedPhone = phone !== undefined ? String(phone).trim().slice(0, 40) : req.user.phone;
    const updatedAddresses = Array.isArray(addresses) ? addresses.slice(0, 20) : req.user.addresses;

    db.prepare('UPDATE users SET name = ?, phone = ?, addresses_json = ? WHERE id = ?').run(
      updatedName,
      updatedPhone,
      JSON.stringify(updatedAddresses),
      req.user.id
    );

    res.json({
      user: {
        ...req.user,
        name: updatedName,
        phone: updatedPhone,
        addresses: updatedAddresses
      }
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// --- CONTACT / INQUIRY ENDPOINT ---

app.post('/api/contact', contactRateLimiter, (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body || {};
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Name, email, subject, and message are required.' });
    }
    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim();
    const cleanPhone = String(phone || '').trim();
    const cleanSubject = String(subject).trim();
    const cleanMessage = String(message).trim();

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (cleanName.length > 120 || cleanSubject.length > 200 || cleanMessage.length > 5000) {
      return res.status(400).json({ error: 'One or more fields exceed maximum allowed length.' });
    }

    const id = 'inq-' + crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO inquiries (id, name, email, phone, subject, message, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'new', ?)
    `).run(id, cleanName, cleanEmail, cleanPhone, cleanSubject, cleanMessage, now);

    res.status(201).json({
      success: true,
      inquiryId: id,
      message: 'Thank you for contacting Flange Craft. Sunil Shukla and Team have received your inquiry.'
    });
  } catch (err) {
    console.error('Contact inquiry error:', err);
    res.status(500).json({ error: 'Failed to submit inquiry. Please try again.' });
  }
});

// --- ORDERS & RAZORPAY PAYMENT INTEGRATION (PHASES 1, 2, 3, 6, 7) ---

const EPHEMERAL_SANDBOX_SECRET = crypto.randomBytes(32).toString('hex');

function getRazorpaySecret() {
  if (hasLiveRazorpayCredentials()) {
    return String(process.env.RAZORPAY_KEY_SECRET).trim();
  }
  if (isNonProdPaymentSandboxEnabled()) {
    return process.env.RAZORPAY_SANDBOX_SECRET || EPHEMERAL_SANDBOX_SECRET;
  }
  return null;
}

function generateUniqueOrderNumber() {
  for (let attempt = 0; attempt < 8; attempt++) {
    const timePart = String(Date.now()).slice(-6);
    const randPart = String(crypto.randomInt(100, 1000));
    const candidate = `FC-${timePart}-${randPart}`;
    const exists = db.prepare('SELECT id FROM orders WHERE order_number = ?').get(candidate);
    if (!exists) {
      return candidate;
    }
  }
  return `FC-${crypto.randomInt(100000, 1000000)}-${crypto.randomInt(100, 1000)}`;
}

// Atomic payment confirmation + single inventory deduction shared by /api/payments/verify and /api/payments/webhook
function confirmOrderPaymentAndDeductInventory({
  orderId,
  razorpayPaymentId,
  razorpaySignature,
  webhookEventId,
  webhookEventType
}) {
  const now = new Date().toISOString();
  db.exec('BEGIN IMMEDIATE TRANSACTION');
  try {
    if (webhookEventId) {
      const existingEvent = db
        .prepare('SELECT event_id FROM processed_webhooks WHERE event_id = ?')
        .get(webhookEventId);
      if (existingEvent) {
        db.exec('COMMIT');
        const currentOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
        return { status: 'duplicate_webhook', orderRow: currentOrder };
      }
    }

    const orderRow = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!orderRow) {
      db.exec('ROLLBACK');
      return { status: 'not_found' };
    }

    // If order is already paid & verified, never deduct inventory a second time
    if (orderRow.payment_verified === 1 && orderRow.payment_status === 'paid') {
      if (webhookEventId) {
        db.prepare(
          'INSERT OR IGNORE INTO processed_webhooks (event_id, order_id, event_type, processed_at) VALUES (?, ?, ?, ?)'
        ).run(webhookEventId, orderRow.id, webhookEventType || 'payment.captured', now);
        db.exec('COMMIT');
        return { status: 'already_paid_idempotent', orderRow };
      }
      db.exec('ROLLBACK');
      return { status: 'already_paid', orderRow };
    }

    // Check for duplicate razorpay_payment_id on any other order
    if (razorpayPaymentId) {
      const existingPay = db
        .prepare('SELECT id FROM orders WHERE razorpay_payment_id = ? AND id != ?')
        .get(razorpayPaymentId, orderRow.id);
      if (existingPay) {
        db.exec('ROLLBACK');
        return { status: 'duplicate_payment_id' };
      }
    }

    // Deduct inventory atomically if not yet deducted for this order
    if (!orderRow.inventory_deducted) {
      const items = parseJsonSafe(orderRow.items_json, []);
      for (const item of items) {
        const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
        const prodRow = db
          .prepare('SELECT id, name, inventory, in_stock FROM products WHERE id = ?')
          .get(item.productId);
        if (!prodRow || !prodRow.in_stock || Number(prodRow.inventory) < qty) {
          db.exec('ROLLBACK');
          return {
            status: 'insufficient_stock',
            productName: prodRow?.name || item.name || item.productId
          };
        }

        const deductResult = db
          .prepare(`
            UPDATE products
            SET inventory = inventory - ?,
                in_stock = CASE WHEN (inventory - ?) > 0 THEN in_stock ELSE 0 END,
                updated_at = ?
            WHERE id = ? AND inventory >= ?
          `)
          .run(qty, qty, now, item.productId, qty);

        if (!deductResult || deductResult.changes !== 1) {
          db.exec('ROLLBACK');
          return {
            status: 'insufficient_stock',
            productName: prodRow.name
          };
        }
      }
    }

    db.prepare(`
      UPDATE orders
      SET payment_status = 'paid',
          payment_verified = 1,
          inventory_deducted = 1,
          razorpay_payment_id = COALESCE(?, razorpay_payment_id),
          razorpay_signature = COALESCE(?, razorpay_signature),
          order_status = 'confirmed',
          updated_at = ?
      WHERE id = ?
    `).run(razorpayPaymentId || null, razorpaySignature || null, now, orderRow.id);

    if (webhookEventId) {
      db.prepare(
        'INSERT INTO processed_webhooks (event_id, order_id, event_type, processed_at) VALUES (?, ?, ?, ?)'
      ).run(webhookEventId, orderRow.id, webhookEventType || 'payment.captured', now);
    }

    db.exec('COMMIT');
    const updatedRow = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderRow.id);
    return { status: 'paid', orderRow: updatedRow };
  } catch (err) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // ignore rollback error
    }
    throw err;
  }
}

app.post('/api/orders/create', orderCreateRateLimiter, async (req, res) => {
  try {
    const user = getAuthenticatedUser(req);
    const { customer, shippingAddress, items, paymentMethod, notes } = req.body || {};

    if (!customer?.name || !customer?.email || !customer?.phone) {
      return res.status(400).json({ error: 'Customer full name, email, and phone number are required.' });
    }
    if (!EMAIL_REGEX.test(String(customer.email).trim())) {
      return res.status(400).json({ error: 'Please provide a valid customer email address.' });
    }
    if (
      !shippingAddress?.address ||
      !shippingAddress?.city ||
      !shippingAddress?.state ||
      !shippingAddress?.postalCode ||
      !shippingAddress?.country
    ) {
      return res.status(400).json({ error: 'Complete shipping address (street, city, state, postal code, country) is required.' });
    }
    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return res.status(400).json({ error: 'Your cart cannot be empty.' });
    }

    // Aggregate quantities per product to prevent multi-line cart bypass of stock limits
    const requestedTotalsByProductId = new Map();
    const verifiedItems = [];
    let subtotal = 0;
    let hasUnconfiguredPrice = false;

    for (const item of items) {
      const dbProd = db
        .prepare('SELECT * FROM products WHERE id = ? OR slug = ?')
        .get(item.productId || item.id || '', item.slug || item.productId || '');
      if (!dbProd) {
        return res.status(400).json({ error: `Product variant "${item.name || item.productId}" does not exist in the Flange Craft catalogue.` });
      }
      const rawQty = Number(item.quantity);
      if (!Number.isInteger(rawQty) || rawQty < 1 || rawQty > 100) {
        return res.status(400).json({ error: `Invalid quantity specified for ${dbProd.name}.` });
      }
      const cumulativeQty = (requestedTotalsByProductId.get(dbProd.id) || 0) + rawQty;
      requestedTotalsByProductId.set(dbProd.id, cumulativeQty);

      if (!dbProd.in_stock || dbProd.inventory < cumulativeQty) {
        return res.status(400).json({ error: `${dbProd.name} does not have sufficient stock.` });
      }
      const qty = rawQty;
      const isPriceSet = Boolean(dbProd.price_configured && dbProd.price !== null && Number(dbProd.price) > 0);
      const unitPrice = isPriceSet ? Number(dbProd.price) : null;

      if (!isPriceSet) {
        hasUnconfiguredPrice = true;
      } else {
        subtotal += unitPrice * qty;
      }

      verifiedItems.push({
        productId: dbProd.id,
        slug: dbProd.slug,
        name: dbProd.name,
        shortName: dbProd.short_name,
        category: dbProd.category,
        shape: dbProd.shape,
        size: dbProd.size,
        dimensions: dbProd.dimensions,
        sku: dbProd.sku,
        image: parseJsonSafe(dbProd.images_json, [])[0] || '',
        quantity: qty,
        unitPrice,
        priceConfigured: isPriceSet,
        lineTotal: unitPrice !== null ? unitPrice * qty : null
      });
    }

    const configRow = db.prepare('SELECT value_json FROM site_config WHERE key = ?').get('main');
    const siteConfig = configRow ? parseJsonSafe(configRow.value_json, INITIAL_SITE_CONFIG) : INITIAL_SITE_CONFIG;
    const shippingFee = hasUnconfiguredPrice ? 0 : Number(siteConfig?.commerce?.shippingFee || 0);
    const taxPct = Number(siteConfig?.commerce?.taxPercentage || 0);
    const taxAmount = hasUnconfiguredPrice ? 0 : Math.round((subtotal * taxPct) / 100);
    const totalAmount = hasUnconfiguredPrice ? null : subtotal + shippingFee + taxAmount;

    const hasLiveRazorpay = hasLiveRazorpayCredentials();
    const isSandbox = isNonProdPaymentSandboxEnabled();
    const onlinePaymentEnabled = hasLiveRazorpay || isSandbox;

    const orderId = 'ord-' + crypto.randomUUID();
    const orderNumber = generateUniqueOrderNumber();
    const now = new Date().toISOString();

    let razorpayOrderId = null;
    let paymentMode = 'configurable_price_order';
    let initialPaymentStatus = 'pending';
    let resolvedPaymentMethod = paymentMethod === 'configurable_quote' ? 'configurable_quote' : 'razorpay';

    if (hasUnconfiguredPrice) {
      initialPaymentStatus = 'price_pending_confirmation';
      paymentMode = 'configurable_price_order';
      resolvedPaymentMethod = 'configurable_quote';
    } else if (resolvedPaymentMethod === 'razorpay' && totalAmount > 0) {
      if (hasLiveRazorpay) {
        const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
        const rpResponse = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${auth}`
          },
          body: JSON.stringify({
            amount: Math.round(totalAmount * 100),
            currency: 'INR',
            receipt: orderNumber
          })
        });
        if (!rpResponse.ok) {
          return res.status(502).json({ error: 'Payment gateway could not initialize order. Please try again.' });
        }
        const rpOrder = await rpResponse.json();
        razorpayOrderId = rpOrder.id;
        paymentMode = 'live_razorpay';
      } else if (isSandbox) {
        razorpayOrderId = 'order_test_' + crypto.randomBytes(8).toString('hex');
        paymentMode = 'test_sandbox';
      } else {
        // Phase 2: Razorpay is NOT configured. Never invent fake payment orders or simulate payments.
        // Record the order safely with payment_verified = 0 and payment_status = 'pending'
        razorpayOrderId = null;
        paymentMode = 'gateway_unconfigured';
        initialPaymentStatus = 'pending';
      }
    } else {
      paymentMode = onlinePaymentEnabled ? getPaymentGatewayMode() : 'gateway_unconfigured';
      initialPaymentStatus = 'pending';
    }

    db.exec('BEGIN IMMEDIATE TRANSACTION');
    try {
      // Re-verify stock inside transaction lock
      for (const [prodId, reqQty] of requestedTotalsByProductId.entries()) {
        const freshProd = db.prepare('SELECT name, in_stock, inventory FROM products WHERE id = ?').get(prodId);
        if (!freshProd || !freshProd.in_stock || Number(freshProd.inventory) < reqQty) {
          db.exec('ROLLBACK');
          return res.status(400).json({
            error: `${freshProd?.name || 'Selected product'} does not have sufficient stock.`
          });
        }
      }

      db.prepare(`
        INSERT INTO orders (
          id, order_number, user_id, customer_name, customer_email, customer_phone,
          shipping_address_json, items_json, subtotal, shipping_fee, tax_amount, total_amount,
          has_unconfigured_price, payment_method, payment_status, payment_verified, inventory_deducted,
          razorpay_order_id, payment_mode, order_status, shipping_status, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderId,
        orderNumber,
        user ? user.id : null,
        String(customer.name).trim(),
        String(customer.email).trim(),
        String(customer.phone).trim(),
        JSON.stringify(shippingAddress),
        JSON.stringify(verifiedItems),
        hasUnconfiguredPrice ? null : subtotal,
        shippingFee,
        taxAmount,
        totalAmount,
        hasUnconfiguredPrice ? 1 : 0,
        resolvedPaymentMethod,
        initialPaymentStatus,
        razorpayOrderId,
        paymentMode,
        hasUnconfiguredPrice ? 'awaiting_price_quote' : 'pending',
        'not_shipped',
        String(notes || '').trim().slice(0, 2000),
        now,
        now
      );
      db.exec('COMMIT');
    } catch (txErr) {
      try {
        db.exec('ROLLBACK');
      } catch {
        // ignore
      }
      throw txErr;
    }

    const createdRow = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    res.status(201).json({
      order: formatOrderRow(createdRow),
      paymentGatewayAvailable: onlinePaymentEnabled,
      razorpay: razorpayOrderId
        ? {
            orderId: razorpayOrderId,
            amountPaise: Math.round((totalAmount || 0) * 100),
            currency: 'INR',
            keyId: hasLiveRazorpay ? process.env.RAZORPAY_KEY_ID : 'rzp_test_sandbox',
            mode: paymentMode
          }
        : null
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: 'Failed to create order.' });
  }
});

// Explicit payment order initialization endpoint — returns 503 when Razorpay is not configured
app.post('/api/payments/create', paymentVerifyRateLimiter, (_req, res) => {
  if (!isOnlinePaymentAvailable()) {
    return res.status(503).json({
      error:
        'Online payment processing is currently unavailable because Razorpay merchant credentials are not configured.'
    });
  }
  return res.status(400).json({
    error: 'Payment orders must be initialized through POST /api/orders/create.'
  });
});

// Helper endpoint strictly for non-production automated test fixtures when ENABLE_RAZORPAY_SANDBOX === 'true'
app.post('/api/payments/create-test-signature', paymentVerifyRateLimiter, (req, res) => {
  if (IS_PRODUCTION || hasLiveRazorpayCredentials() || !isNonProdPaymentSandboxEnabled()) {
    return res.status(403).json({
      error: 'Test signature generation is disabled. Online payment gateway is not in sandbox mode.'
    });
  }
  const { razorpayOrderId, outcome } = req.body || {};
  if (!razorpayOrderId) {
    return res.status(400).json({ error: 'razorpayOrderId is required.' });
  }
  const razorpayPaymentId = 'pay_test_' + crypto.randomBytes(8).toString('hex');
  if (outcome === 'failure') {
    return res.json({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature: 'invalid_signature_for_failure_test'
    });
  }
  const secret = getRazorpaySecret();
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
  const signature = hmac.digest('hex');

  res.json({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature: signature,
    mode: 'test_sandbox'
  });
});

// --- PHASE 1: CRITICAL PAYMENT VERIFICATION SECURITY (NO PII LEAK, RATE LIMITED, SAFE STATE TRANSITIONS) ---

app.post('/api/payments/verify', paymentVerifyRateLimiter, (req, res) => {
  try {
    const secret = getRazorpaySecret();
    if (!secret || !isOnlinePaymentAvailable()) {
      return res.status(503).json({
        verified: false,
        error: 'Online payment verification is currently disabled because Razorpay credentials are not configured.'
      });
    }

    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        verified: false,
        error: 'Missing required payment verification fields.'
      });
    }

    const orderRow = db
      .prepare('SELECT * FROM orders WHERE id = ? OR UPPER(order_number) = UPPER(?)')
      .get(String(orderId).trim(), String(orderId).trim());

    if (!orderRow) {
      return res.status(404).json({
        verified: false,
        error: 'Order not found.'
      });
    }

    // 1. Verify that the order actually has a gateway order ID matching razorpay_order_id
    if (!orderRow.razorpay_order_id || orderRow.razorpay_order_id !== String(razorpay_order_id).trim()) {
      return res.status(400).json({
        verified: false,
        error: 'Payment verification failed: Invalid payment order reference.'
      });
    }

    // 2. Verify cryptographic HMAC-SHA256 signature BEFORE checking or revealing duplicate payment status
    //    and BEFORE modifying any order record!
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const providedBuf = Buffer.from(String(razorpay_signature), 'utf8');
    const signatureValid =
      expectedBuf.length === providedBuf.length && crypto.timingSafeEqual(expectedBuf, providedBuf);

    if (!signatureValid) {
      // Never damage an already-paid order when an invalid signature request arrives,
      // and NEVER return order/customer PII in error responses!
      if (orderRow.payment_verified !== 1 && orderRow.payment_status !== 'paid') {
        db.prepare(`
          UPDATE orders
          SET payment_status = 'failed', payment_verified = 0, updated_at = ?
          WHERE id = ? AND payment_verified = 0
        `).run(new Date().toISOString(), orderRow.id);
      }

      return res.status(400).json({
        verified: false,
        error: 'Cryptographic payment signature verification failed.'
      });
    }

    // 3. Signature is cryptographically valid. Now execute atomic confirmation & single inventory deduction.
    const txResult = confirmOrderPaymentAndDeductInventory({
      orderId: orderRow.id,
      razorpayPaymentId: String(razorpay_payment_id).trim(),
      razorpaySignature: String(razorpay_signature).trim()
    });

    if (txResult.status === 'already_paid') {
      // Never leak customer PII on duplicate transaction responses
      return res.status(409).json({
        verified: false,
        error: 'Duplicate transaction blocked: This order has already been paid and verified.',
        orderNumber: orderRow.order_number
      });
    }

    if (txResult.status === 'duplicate_payment_id') {
      return res.status(409).json({
        verified: false,
        error: 'Duplicate payment ID detected. Transaction already processed.'
      });
    }

    if (txResult.status === 'insufficient_stock') {
      return res.status(409).json({
        verified: false,
        error: `Inventory exhausted for ${txResult.productName}. Payment could not be applied to stock.`
      });
    }

    const user = getAuthenticatedUser(req);
    const safeOrder = isUserAuthorizedForOrder(user, txResult.orderRow)
      ? formatOrderRow(txResult.orderRow)
      : formatPublicOrderTrackingRow(txResult.orderRow);

    return res.json({
      verified: true,
      order: safeOrder
    });
  } catch (err) {
    console.error('Payment verification error:', err);
    return res.status(500).json({
      verified: false,
      error: 'Server error while verifying payment.'
    });
  }
});

// --- PHASE 3: RAZORPAY WEBHOOK SECURITY (RAW BODY SIGNATURE, IDEMPOTENT, ATOMIC STOCK DEDUCTION) ---

app.post('/api/payments/webhook', (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || getRazorpaySecret();
    if (!webhookSecret) {
      return res.status(503).json({ error: 'Webhook secret is not configured.' });
    }

    const signature = req.headers['x-razorpay-signature'];
    if (!signature || typeof signature !== 'string') {
      return res.status(400).json({ error: 'Missing x-razorpay-signature header.' });
    }

    // Verify signature against exact raw HTTP request bytes (req.rawBody) BEFORE trusting req.body
    const rawBodyBuffer = Buffer.isBuffer(req.rawBody) ? req.rawBody : Buffer.alloc(0);
    if (rawBodyBuffer.length === 0) {
      return res.status(400).json({ error: 'Empty webhook payload.' });
    }

    const expected = crypto.createHmac('sha256', webhookSecret).update(rawBodyBuffer).digest('hex');
    const expectedBuf = Buffer.from(expected, 'utf8');
    const providedBuf = Buffer.from(signature.trim(), 'utf8');

    if (expectedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(expectedBuf, providedBuf)) {
      return res.status(400).json({ error: 'Invalid webhook signature.' });
    }

    const event = req.body?.event;
    const paymentEntity = req.body?.payload?.payment?.entity;
    const headerEventId = req.headers['x-razorpay-event-id'] || req.headers['x-webhook-event-id'];
    const rawBodyHash = crypto.createHash('sha256').update(rawBodyBuffer).digest('hex');
    const webhookEventId = String(headerEventId || req.body?.event_id || `${event || 'unknown'}:${paymentEntity?.id || rawBodyHash}`);

    if (event === 'payment.captured' && paymentEntity?.order_id) {
      const orderRow = db.prepare('SELECT * FROM orders WHERE razorpay_order_id = ?').get(paymentEntity.order_id);
      if (!orderRow) {
        return res.json({ status: 'webhook_ignored_order_not_found' });
      }

      const txResult = confirmOrderPaymentAndDeductInventory({
        orderId: orderRow.id,
        razorpayPaymentId: paymentEntity.id ? String(paymentEntity.id) : null,
        razorpaySignature: null,
        webhookEventId,
        webhookEventType: event
      });

      if (txResult.status === 'duplicate_webhook' || txResult.status === 'already_paid_idempotent') {
        return res.json({ status: 'webhook_already_processed', idempotent: true });
      }
      if (txResult.status === 'insufficient_stock') {
        return res.status(409).json({ error: 'Insufficient stock during webhook capture.' });
      }

      return res.json({ status: 'webhook_processed', idempotent: false });
    }

    if (event === 'payment.failed' && paymentEntity?.order_id) {
      const now = new Date().toISOString();
      db.exec('BEGIN IMMEDIATE TRANSACTION');
      try {
        const existingEvent = db
          .prepare('SELECT event_id FROM processed_webhooks WHERE event_id = ?')
          .get(webhookEventId);
        if (existingEvent) {
          db.exec('COMMIT');
          return res.json({ status: 'webhook_already_processed', idempotent: true });
        }

        // Only mark failed if the order is NOT already paid & verified
        db.prepare(`
          UPDATE orders
          SET payment_status = 'failed', updated_at = ?
          WHERE razorpay_order_id = ? AND payment_verified = 0
        `).run(now, paymentEntity.order_id);

        db.prepare(
          'INSERT INTO processed_webhooks (event_id, order_id, event_type, processed_at) VALUES (?, ?, ?, ?)'
        ).run(webhookEventId, paymentEntity.order_id, event, now);

        db.exec('COMMIT');
      } catch (txErr) {
        try {
          db.exec('ROLLBACK');
        } catch {
          // ignore
        }
        throw txErr;
      }
      return res.json({ status: 'webhook_processed', idempotent: false });
    }

    return res.json({ status: 'webhook_processed' });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return res.status(500).json({ error: 'Failed to process webhook.' });
  }
});

// --- PHASE 6: CUSTOMER ORDER HISTORY, GUEST ORDER CLAIMING & PRIVACY-SAFE GUEST TRACKING ---

app.get('/api/orders/my', requireAuth, (req, res) => {
  try {
    // Only return orders explicitly linked to req.user.id, OR guest orders matching email ONLY if req.user.emailVerified is true
    const rows = db
      .prepare(`
        SELECT * FROM orders
        WHERE user_id = ?
           OR (user_id IS NULL AND ? = 1 AND LOWER(customer_email) = LOWER(?))
        ORDER BY created_at DESC
      `)
      .all(req.user.id, req.user.emailVerified ? 1 : 0, req.user.email);
    res.json({ orders: rows.map(formatOrderRow) });
  } catch (err) {
    console.error('Fetch user orders error:', err);
    res.status(500).json({ error: 'Failed to load order history.' });
  }
});

const ORDER_NUMBER_REGEX = /^FC-\d{6}-\d{3}$/i;

// Secure guest order claim endpoint: requires authenticated user + matching order email + exact orderNumber + exact phone + exact postalCode
app.post('/api/orders/claim', orderLookupRateLimiter, requireAuth, (req, res) => {
  try {
    const { orderNumber, phone, postalCode } = req.body || {};
    const cleanOrderNo = String(orderNumber || '').trim().toUpperCase();
    if (!ORDER_NUMBER_REGEX.test(cleanOrderNo)) {
      return res.status(400).json({ error: 'Valid Flange Craft Order Number (e.g. FC-123456-789) is required.' });
    }
    const cleanPhoneDigits = String(phone || '').replace(/\D+/g, '');
    const cleanPostal = String(postalCode || '').trim().toLowerCase();

    if (cleanPhoneDigits.length < 7 || cleanPostal.length < 4) {
      return res.status(400).json({
        error: 'Order verification requires the phone number and postal code used during checkout.'
      });
    }

    const row = db.prepare('SELECT * FROM orders WHERE UPPER(order_number) = ?').get(cleanOrderNo);
    if (!row || row.user_id !== null) {
      return res.status(404).json({ error: 'Eligible unclaimed guest order not found.' });
    }

    const orderEmail = String(row.customer_email || '').trim().toLowerCase();
    const orderPhoneDigits = String(row.customer_phone || '').replace(/\D+/g, '');
    const addr = parseJsonSafe(row.shipping_address_json, {});
    const orderPostal = String(addr.postalCode || '').trim().toLowerCase();

    if (
      orderEmail !== req.user.email.toLowerCase() ||
      orderPhoneDigits !== cleanPhoneDigits ||
      orderPostal !== cleanPostal
    ) {
      return res.status(403).json({
        error: 'Verification details do not match this guest order.'
      });
    }

    db.prepare('UPDATE orders SET user_id = ?, updated_at = ? WHERE id = ? AND user_id IS NULL').run(
      req.user.id,
      new Date().toISOString(),
      row.id
    );

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(row.id);
    return res.json({ order: formatOrderRow(updated) });
  } catch (err) {
    console.error('Claim guest order error:', err);
    return res.status(500).json({ error: 'Unable to claim guest order.' });
  }
});

app.get('/api/orders/:orderNumber', orderLookupRateLimiter, (req, res) => {
  try {
    const rawParam = String(req.params.orderNumber || '').trim();
    if (!ORDER_NUMBER_REGEX.test(rawParam)) {
      return res.status(400).json({
        error: 'Invalid Order Number format. Please enter a valid Flange Craft order ID (e.g. FC-123456-789).'
      });
    }

    const normalizedOrderNo = rawParam.toUpperCase();
    const row = db.prepare('SELECT * FROM orders WHERE UPPER(order_number) = ?').get(normalizedOrderNo);
    if (!row) {
      return res.status(404).json({ error: 'No order found matching that Order Number.' });
    }

    const user = getAuthenticatedUser(req);
    if (isUserAuthorizedForOrder(user, row)) {
      return res.json({ order: formatOrderRow(row) });
    }

    // Return privacy-safe order status without exposing full customer PII on order-number-only lookup
    return res.json({ order: formatPublicOrderTrackingRow(row) });
  } catch (err) {
    console.error('Order lookup error:', err);
    res.status(500).json({ error: 'Unable to look up order status at this time.' });
  }
});

// --- SECURE ADMIN ENDPOINTS (Backend Authorized) ---

app.get('/api/admin/overview', requireAdmin, (_req, res) => {
  try {
    const products = db.prepare('SELECT * FROM products ORDER BY sort_order ASC').all().map(formatProductRow);
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all().map(formatOrderRow);
    const users = db
      .prepare('SELECT id, name, email, phone, role, addresses_json, created_at FROM users ORDER BY created_at DESC')
      .all()
      .map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        addresses: parseJsonSafe(u.addresses_json, []),
        createdAt: u.created_at
      }));
    const inquiries = db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all();
    const faqs = db.prepare('SELECT * FROM faqs ORDER BY sort_order ASC').all();
    const configRow = db.prepare('SELECT value_json FROM site_config WHERE key = ?').get('main');
    const siteConfig = configRow ? parseJsonSafe(configRow.value_json, INITIAL_SITE_CONFIG) : INITIAL_SITE_CONFIG;

    const verifiedRevenue = orders
      .filter((o) => o.paymentVerified && o.paymentStatus === 'paid' && o.totalAmount)
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    res.json({
      stats: {
        totalOrders: orders.length,
        paidOrders: orders.filter((o) => o.paymentVerified).length,
        pendingOrders: orders.filter((o) => o.orderStatus === 'pending' || o.orderStatus === 'awaiting_price_quote').length,
        verifiedRevenue,
        totalCustomers: users.filter((u) => u.role === 'customer').length,
        totalProducts: products.length,
        configuredPriceCount: products.filter((p) => p.priceConfigured).length,
        newInquiries: inquiries.filter((i) => i.status === 'new').length
      },
      products,
      orders,
      customers: users,
      inquiries,
      faqs,
      siteConfig
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    res.status(500).json({ error: 'Failed to load admin overview.' });
  }
});

// Admin: Update Product (with strict Rotating=Round validation)
app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const category = req.body.category ?? existing.category;
    const shape = req.body.shape ?? existing.shape;
    const ruleError = validateProductVariantRule(category, shape);
    if (ruleError) {
      return res.status(400).json({ error: ruleError });
    }

    const rawPrice = req.body.price;
    if (rawPrice !== null && rawPrice !== undefined && rawPrice !== '' && (Number.isNaN(Number(rawPrice)) || Number(rawPrice) < 0)) {
      return res.status(400).json({ error: 'Product price must be a non-negative number.' });
    }
    const hasPrice = rawPrice !== null && rawPrice !== undefined && rawPrice !== '' && Number(rawPrice) > 0;
    const priceValue = hasPrice ? Number(rawPrice) : null;
    const priceConfigured = hasPrice ? 1 : 0;

    if (req.body.inventory !== undefined && (Number.isNaN(Number(req.body.inventory)) || Number(req.body.inventory) < 0)) {
      return res.status(400).json({ error: 'Inventory must be a non-negative number.' });
    }

    const name = req.body.name ? String(req.body.name).trim() : existing.name;
    const shortName = req.body.shortName ? String(req.body.shortName).trim() : existing.short_name;
    const size = req.body.size ? String(req.body.size).trim() : existing.size;
    const dimensions = req.body.dimensions ? String(req.body.dimensions).trim() : existing.dimensions;
    const sku = req.body.sku ? String(req.body.sku).trim() : existing.sku;
    const inStock = req.body.inStock !== undefined ? (req.body.inStock ? 1 : 0) : existing.in_stock;
    const inventory = req.body.inventory !== undefined ? Math.floor(Number(req.body.inventory)) : existing.inventory;
    const summary = req.body.summary !== undefined ? String(req.body.summary).trim() : existing.summary;
    const description = req.body.description !== undefined ? String(req.body.description).trim() : existing.description;
    const images = Array.isArray(req.body.images) ? req.body.images : parseJsonSafe(existing.images_json, []);
    const features = Array.isArray(req.body.features) ? req.body.features : parseJsonSafe(existing.features_json, []);
    const specifications = Array.isArray(req.body.specifications)
      ? req.body.specifications
      : parseJsonSafe(existing.specifications_json, []);
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE products
      SET name = ?, short_name = ?, category = ?, shape = ?, size = ?, dimensions = ?,
          sku = ?, price = ?, price_configured = ?, in_stock = ?, inventory = ?,
          images_json = ?, summary = ?, description = ?, features_json = ?, specifications_json = ?, updated_at = ?
      WHERE id = ?
    `).run(
      name,
      shortName,
      category,
      shape,
      size,
      dimensions,
      sku,
      priceValue,
      priceConfigured,
      inStock,
      inventory,
      JSON.stringify(images),
      summary,
      description,
      JSON.stringify(features),
      JSON.stringify(specifications),
      now,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json({ product: formatProductRow(updated) });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Failed to update product.' });
  }
});

app.post('/api/admin/products', requireAdmin, (req, res) => {
  try {
    const {
      name,
      shortName,
      slug,
      category,
      shape,
      size,
      dimensions,
      sku,
      price,
      inventory,
      images,
      summary,
      description,
      features,
      specifications
    } = req.body || {};

    if (!name || !category || !shape || !size) {
      return res.status(400).json({ error: 'Name, category, shape, and size are required.' });
    }
    const ruleError = validateProductVariantRule(category, shape);
    if (ruleError) {
      return res.status(400).json({ error: ruleError });
    }
    if (price !== null && price !== undefined && price !== '' && (Number.isNaN(Number(price)) || Number(price) < 0)) {
      return res.status(400).json({ error: 'Price must be a non-negative number.' });
    }
    if (inventory !== undefined && (Number.isNaN(Number(inventory)) || Number(inventory) < 0)) {
      return res.status(400).json({ error: 'Inventory must be a non-negative number.' });
    }

    const id = 'prod-' + crypto.randomUUID().slice(0, 8);
    let cleanSlug = (slug || String(name))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!cleanSlug) cleanSlug = id;

    const existingSlug = db.prepare('SELECT id FROM products WHERE slug = ?').get(cleanSlug);
    if (existingSlug) {
      cleanSlug = `${cleanSlug}-${id.slice(-4)}`;
    }

    const hasPrice = price !== null && price !== undefined && price !== '' && Number(price) > 0;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO products (
        id, slug, name, short_name, category, category_label, shape, size, dimensions,
        sku, price, price_configured, in_stock, inventory, featured, sort_order,
        images_json, summary, description, features_json, specifications_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 1, 10, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      cleanSlug,
      String(name).trim(),
      String(shortName || name).trim(),
      category,
      category === 'rotating' ? 'Rotating Lollipop Flange' : 'Standard Lollipop Flange',
      shape,
      String(size).trim(),
      String(dimensions || size).trim(),
      String(sku || 'FC-CUST-' + id.toUpperCase()).trim(),
      hasPrice ? Number(price) : null,
      hasPrice ? 1 : 0,
      Math.floor(Number(inventory ?? 15)),
      JSON.stringify(
        Array.isArray(images) && images.length > 0 ? images : ['/images/product/standard/18x18/round/image-1.jpg']
      ),
      String(summary || '').trim(),
      String(description || '').trim(),
      JSON.stringify(Array.isArray(features) ? features : []),
      JSON.stringify(Array.isArray(specifications) ? specifications : []),
      now
    );

    const created = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.status(201).json({ product: formatProductRow(created) });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Failed to create product variant.' });
  }
});

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Failed to delete product.' });
  }
});

// Admin: Reset catalog to strict 6 variants or apply/clear configurable test prices
app.post('/api/admin/pricing-preset', requireAdmin, (req, res) => {
  try {
    const { action } = req.body || {}; // 'apply_sample_prices' | 'clear_prices'
    if (action !== 'apply_sample_prices' && action !== 'clear_prices') {
      return res.status(400).json({ error: 'Invalid pricing preset action.' });
    }
    const samplePrices = {
      'standard-round-18x18': 3800,
      'standard-round-24x24': 5200,
      'standard-square-18x18': 3950,
      'standard-square-24x24': 5400,
      'rotating-round-12x12': 4600,
      'rotating-round-24x24': 6800
    };
    const now = new Date().toISOString();
    if (action === 'apply_sample_prices') {
      const stmt = db.prepare('UPDATE products SET price = ?, price_configured = 1, updated_at = ? WHERE slug = ?');
      for (const [slug, price] of Object.entries(samplePrices)) {
        stmt.run(price, now, slug);
      }
    } else if (action === 'clear_prices') {
      db.prepare('UPDATE products SET price = NULL, price_configured = 0, updated_at = ?').run(now);
    }
    const products = db.prepare('SELECT * FROM products ORDER BY sort_order ASC').all().map(formatProductRow);
    res.json({ products });
  } catch (err) {
    console.error('Pricing preset error:', err);
    res.status(500).json({ error: 'Failed to update pricing preset.' });
  }
});

const ALLOWED_ORDER_STATUSES = new Set([
  'pending',
  'awaiting_price_quote',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled'
]);

const ALLOWED_SHIPPING_STATUSES = new Set([
  'not_shipped',
  'preparing',
  'dispatched',
  'in_transit',
  'delivered'
]);

const ALLOWED_PAYMENT_STATUSES = new Set([
  'pending',
  'paid',
  'failed',
  'price_pending_confirmation'
]);

// Admin: Update Order Status / Shipping / Tracking
app.put('/api/admin/orders/:id', requireAdmin, (req, res) => {
  try {
    const { orderStatus, shippingStatus, trackingNumber, trackingCarrier, paymentStatus } = req.body || {};
    const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    if (orderStatus !== undefined && !ALLOWED_ORDER_STATUSES.has(orderStatus)) {
      return res.status(400).json({ error: 'Invalid order status value.' });
    }
    if (shippingStatus !== undefined && !ALLOWED_SHIPPING_STATUSES.has(shippingStatus)) {
      return res.status(400).json({ error: 'Invalid shipping status value.' });
    }
    if (paymentStatus !== undefined && !ALLOWED_PAYMENT_STATUSES.has(paymentStatus)) {
      return res.status(400).json({ error: 'Invalid payment status value.' });
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE orders
      SET order_status = ?,
          shipping_status = ?,
          tracking_number = ?,
          tracking_carrier = ?,
          payment_status = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      orderStatus ?? existing.order_status,
      shippingStatus ?? existing.shipping_status,
      trackingNumber !== undefined ? String(trackingNumber).trim().slice(0, 120) : existing.tracking_number,
      trackingCarrier !== undefined ? String(trackingCarrier).trim().slice(0, 120) : existing.tracking_carrier,
      paymentStatus ?? existing.payment_status,
      now,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    res.json({ order: formatOrderRow(updated) });
  } catch (err) {
    console.error('Update order error:', err);
    res.status(500).json({ error: 'Failed to update order.' });
  }
});

// Admin: Update Website Content & Configuration
app.put('/api/admin/site-config', requireAdmin, (req, res) => {
  try {
    const { siteConfig } = req.body || {};
    if (!siteConfig || typeof siteConfig !== 'object' || Array.isArray(siteConfig)) {
      return res.status(400).json({ error: 'Valid siteConfig object is required.' });
    }
    const now = new Date().toISOString();
    db.prepare('INSERT OR REPLACE INTO site_config (key, value_json, updated_at) VALUES (?, ?, ?)').run(
      'main',
      JSON.stringify(siteConfig),
      now
    );
    res.json({ siteConfig });
  } catch (err) {
    console.error('Update site-config error:', err);
    res.status(500).json({ error: 'Failed to save site configuration.' });
  }
});

// Admin: Update FAQs
app.put('/api/admin/faqs', requireAdmin, (req, res) => {
  try {
    const { faqs } = req.body || {};
    if (!Array.isArray(faqs)) {
      return res.status(400).json({ error: 'faqs array is required.' });
    }
    for (const f of faqs) {
      if (!f || !String(f.question || '').trim() || !String(f.answer || '').trim()) {
        return res.status(400).json({ error: 'Each FAQ item must include a non-empty question and answer.' });
      }
    }

    db.exec('BEGIN IMMEDIATE TRANSACTION');
    try {
      db.prepare('DELETE FROM faqs').run();
      const insert = db.prepare('INSERT INTO faqs (id, category, question, answer, sort_order) VALUES (?, ?, ?, ?, ?)');
      faqs.forEach((f, idx) => {
        insert.run(
          f.id || 'faq-' + (idx + 1),
          String(f.category || 'General').trim(),
          String(f.question).trim(),
          String(f.answer).trim(),
          idx + 1
        );
      });
      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    const updated = db.prepare('SELECT * FROM faqs ORDER BY sort_order ASC').all();
    res.json({ faqs: updated });
  } catch (err) {
    console.error('Update FAQs error:', err);
    res.status(500).json({ error: 'Failed to update FAQs.' });
  }
});

// Admin: Update Inquiry Status
app.put('/api/admin/inquiries/:id', requireAdmin, (req, res) => {
  try {
    const { status } = req.body || {};
    const existing = db.prepare('SELECT id FROM inquiries WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Inquiry not found.' });
    }
    const cleanStatus = String(status || 'reviewed').trim();
    db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run(cleanStatus, req.params.id);
    const inquiries = db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all();
    res.json({ inquiries });
  } catch (err) {
    console.error('Update inquiry error:', err);
    res.status(500).json({ error: 'Failed to update inquiry status.' });
  }
});

// Catch-all JSON 404 handler for any unmatched /api/* route
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Requested API endpoint does not exist.' });
});

// Serve production frontend if dist exists
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global Express error handler — ensures no stack traces are leaked to clients
app.use((err, _req, res, _next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'An internal server error occurred.' });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`Flange Craft Backend API running on http://${HOST}:${PORT}`);
});

server.on('error', (err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});

function gracefulShutdown(signal) {
  console.log(`Received ${signal}. Closing Flange Craft server...`);
  server.close(() => {
    try {
      db?.close();
    } catch {
      // ignore close errors
    }
    process.exit(0);
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
