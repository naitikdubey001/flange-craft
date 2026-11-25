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
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '5mb' }));

// Initialize SQLite database
const dbPath = path.join(__dirname, 'flange_craft.db');
const db = new DatabaseSync(dbPath);

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
    addresses_json TEXT DEFAULT '[]',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
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

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function seedDatabase() {
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

  // Seed default Admin user (Sunil Shukla and Team)
  const adminRow = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@flangecraft.com');
  if (!adminRow) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword('FlangeCraft@Admin', salt);
    db.prepare(`
      INSERT INTO users (id, name, email, phone, password_hash, salt, role, addresses_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'usr-admin-1',
      'Sunil Shukla (Admin)',
      'admin@flangecraft.com',
      '',
      hash,
      salt,
      'admin',
      '[]',
      new Date().toISOString()
    );
  }
}

seedDatabase();

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
    inStock: Boolean(row.in_stock),
    inventory: Number(row.inventory),
    featured: Boolean(row.featured),
    sortOrder: Number(row.sort_order),
    images: JSON.parse(row.images_json || '[]'),
    summary: row.summary,
    description: row.description,
    features: JSON.parse(row.features_json || '[]'),
    specifications: JSON.parse(row.specifications_json || '[]'),
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
    shippingAddress: JSON.parse(row.shipping_address_json || '{}'),
    items: JSON.parse(row.items_json || '[]'),
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

function getAuthenticatedUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;
  const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
  if (!session) return null;
  if (Date.now() > session.expires_at) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }
  const user = db.prepare('SELECT id, name, email, phone, role, addresses_json, created_at FROM users WHERE id = ?').get(session.user_id);
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    addresses: JSON.parse(user.addresses_json || '[]'),
    createdAt: user.created_at
  };
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
  const hasLiveRazorpay = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  res.json({
    status: 'ok',
    database: 'sqlite_connected',
    paymentGatewayMode: hasLiveRazorpay ? 'live_razorpay' : 'development_test_mode',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/bootstrap', (_req, res) => {
  const productRows = db.prepare('SELECT * FROM products ORDER BY sort_order ASC').all();
  const configRow = db.prepare('SELECT value_json FROM site_config WHERE key = ?').get('main');
  const faqRows = db.prepare('SELECT * FROM faqs ORDER BY sort_order ASC').all();
  const hasLiveRazorpay = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

  const siteConfig = configRow ? JSON.parse(configRow.value_json) : INITIAL_SITE_CONFIG;
  res.json({
    products: productRows.map(formatProductRow),
    siteConfig,
    faqs: faqRows,
    paymentGatewayStatus: {
      liveCredentialsConfigured: hasLiveRazorpay,
      keyId: process.env.RAZORPAY_KEY_ID || siteConfig?.commerce?.razorpayKeyId || '',
      mode: hasLiveRazorpay ? 'live' : 'development_test'
    }
  });
});

app.get('/api/products', (_req, res) => {
  const rows = db.prepare('SELECT * FROM products ORDER BY sort_order ASC').all();
  res.json({ products: rows.map(formatProductRow) });
});

app.get('/api/products/:slug', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE slug = ? OR id = ?').get(req.params.slug, req.params.slug);
  if (!row) {
    return res.status(404).json({ error: 'Product variant not found.' });
  }
  res.json({ product: formatProductRow(row) });
});

// --- AUTHENTICATION ENDPOINTS ---

app.post('/api/auth/register', (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  const cleanEmail = String(email).trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const userId = 'usr-' + crypto.randomUUID();
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(String(password), salt);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (id, name, email, phone, password_hash, salt, role, addresses_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'customer', '[]', ?)
  `).run(userId, String(name).trim(), cleanEmail, String(phone || '').trim(), hash, salt, now);

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7;
  db.prepare('INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)').run(
    token,
    userId,
    expiresAt,
    now
  );

  res.status(201).json({
    token,
    user: {
      id: userId,
      name: String(name).trim(),
      email: cleanEmail,
      phone: String(phone || '').trim(),
      role: 'customer',
      addresses: [],
      createdAt: now
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  const cleanEmail = String(email).trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  const candidateHash = hashPassword(String(password), user.salt);
  if (candidateHash !== user.password_hash) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date().toISOString();
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7;
  db.prepare('INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)').run(
    token,
    user.id,
    expiresAt,
    now
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      addresses: JSON.parse(user.addresses_json || '[]'),
      createdAt: user.created_at
    }
  });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }
  res.json({ success: true });
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { email, newPassword } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Please provide your registered email address.' });
  }
  const cleanEmail = String(email).trim().toLowerCase();
  const user = db.prepare('SELECT id, role FROM users WHERE email = ?').get(cleanEmail);
  if (!user) {
    return res.status(404).json({ error: 'No account found with that email address.' });
  }
  if (user.role === 'admin') {
    return res.status(403).json({ error: 'Admin password must be managed via administrator settings.' });
  }
  if (newPassword && String(newPassword).length >= 6) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(String(newPassword), salt);
    db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?').run(hash, salt, user.id);
    return res.json({
      success: true,
      message: 'Your password has been updated. You can now sign in with your new password.'
    });
  }
  return res.json({
    success: true,
    verifiedEmail: true,
    message: 'Account verified. Enter your new password to complete the reset.'
  });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.put('/api/auth/profile', requireAuth, (req, res) => {
  const { name, phone, addresses } = req.body;
  const updatedName = name ? String(name).trim() : req.user.name;
  const updatedPhone = phone !== undefined ? String(phone).trim() : req.user.phone;
  const updatedAddresses = Array.isArray(addresses) ? addresses : req.user.addresses;

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
});

// --- CONTACT / INQUIRY ENDPOINT ---

app.post('/api/contact', (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Name, email, subject, and message are required.' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(email).trim())) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }
  const id = 'inq-' + crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO inquiries (id, name, email, phone, subject, message, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'new', ?)
  `).run(
    id,
    String(name).trim(),
    String(email).trim(),
    String(phone || '').trim(),
    String(subject).trim(),
    String(message).trim(),
    now
  );

  res.status(201).json({
    success: true,
    inquiryId: id,
    message: 'Thank you for contacting Flange Craft. Sunil Shukla and Team have received your inquiry.'
  });
});

// --- ORDERS & RAZORPAY PAYMENT INTEGRATION ---

function getRazorpaySecret() {
  return process.env.RAZORPAY_KEY_SECRET || 'flange_craft_dev_test_secret_key_2026';
}

app.post('/api/orders/create', async (req, res) => {
  try {
    const user = getAuthenticatedUser(req);
    const { customer, shippingAddress, items, paymentMethod, notes } = req.body;

    if (!customer?.name || !customer?.email || !customer?.phone) {
      return res.status(400).json({ error: 'Customer full name, email, and phone number are required.' });
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
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Your cart cannot be empty.' });
    }

    // Verify all product variants against database
    const verifiedItems = [];
    let subtotal = 0;
    let hasUnconfiguredPrice = false;

    for (const item of items) {
      const dbProd = db.prepare('SELECT * FROM products WHERE id = ? OR slug = ?').get(item.productId || item.id, item.slug || item.productId);
      if (!dbProd) {
        return res.status(400).json({ error: `Product variant "${item.name || item.productId}" does not exist in the Flange Craft catalogue.` });
      }
      if (!dbProd.in_stock || dbProd.inventory < (Number(item.quantity) || 1)) {
        return res.status(400).json({ error: `${dbProd.name} does not have sufficient stock.` });
      }
      const qty = Math.max(1, Number(item.quantity) || 1);
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
        image: JSON.parse(dbProd.images_json || '[]')[0] || '',
        quantity: qty,
        unitPrice,
        priceConfigured: isPriceSet,
        lineTotal: unitPrice !== null ? unitPrice * qty : null
      });
    }

    const configRow = db.prepare('SELECT value_json FROM site_config WHERE key = ?').get('main');
    const siteConfig = configRow ? JSON.parse(configRow.value_json) : INITIAL_SITE_CONFIG;
    const shippingFee = hasUnconfiguredPrice ? 0 : Number(siteConfig?.commerce?.shippingFee || 0);
    const taxPct = Number(siteConfig?.commerce?.taxPercentage || 0);
    const taxAmount = hasUnconfiguredPrice ? 0 : Math.round((subtotal * taxPct) / 100);
    const totalAmount = hasUnconfiguredPrice ? null : subtotal + shippingFee + taxAmount;

    const orderId = 'ord-' + crypto.randomUUID();
    const orderNumber = 'FC-' + Date.now().toString().slice(-6) + '-' + Math.floor(100 + Math.random() * 900);
    const now = new Date().toISOString();

    const hasLiveRazorpay = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
    let razorpayOrderId = null;
    let paymentMode = hasLiveRazorpay ? 'live_razorpay' : 'development_test_mode';
    let initialPaymentStatus = 'pending';

    if (paymentMethod === 'razorpay' && !hasUnconfiguredPrice && totalAmount > 0) {
      if (hasLiveRazorpay) {
        // Create real order on Razorpay API
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
          const errData = await rpResponse.text();
          return res.status(502).json({ error: `Razorpay order creation failed: ${errData}` });
        }
        const rpOrder = await rpResponse.json();
        razorpayOrderId = rpOrder.id;
      } else {
        // Development/Test Mode backend-created order ID
        razorpayOrderId = 'order_test_' + crypto.randomBytes(8).toString('hex');
      }
    } else if (hasUnconfiguredPrice) {
      initialPaymentStatus = 'price_pending_confirmation';
      paymentMode = 'configurable_price_order';
    }

    db.prepare(`
      INSERT INTO orders (
        id, order_number, user_id, customer_name, customer_email, customer_phone,
        shipping_address_json, items_json, subtotal, shipping_fee, tax_amount, total_amount,
        has_unconfigured_price, payment_method, payment_status, payment_verified,
        razorpay_order_id, payment_mode, order_status, shipping_status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      paymentMethod || 'razorpay',
      initialPaymentStatus,
      0,
      razorpayOrderId,
      paymentMode,
      hasUnconfiguredPrice ? 'awaiting_price_quote' : 'pending',
      'not_shipped',
      String(notes || '').trim(),
      now,
      now
    );

    const createdRow = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    res.status(201).json({
      order: formatOrderRow(createdRow),
      razorpay: razorpayOrderId
        ? {
            orderId: razorpayOrderId,
            amountPaise: Math.round((totalAmount || 0) * 100),
            currency: 'INR',
            keyId: process.env.RAZORPAY_KEY_ID || siteConfig?.commerce?.razorpayKeyId || 'rzp_test_development_mode',
            mode: paymentMode
          }
        : null
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: 'Failed to create order.' });
  }
});

// Helper endpoint strictly for Development/Test Mode to generate a valid test payment payload signed with the backend's test secret
app.post('/api/payments/create-test-signature', (req, res) => {
  const hasLiveRazorpay = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  if (hasLiveRazorpay) {
    return res.status(403).json({ error: 'Test signature endpoint is disabled when live Razorpay credentials are active.' });
  }
  const { razorpayOrderId, outcome } = req.body;
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
    mode: 'development_test_mode'
  });
});

// Server-side cryptographic verification of Razorpay payment
app.post('/api/payments/verify', (req, res) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing required payment verification fields.' });
  }

  const orderRow = db.prepare('SELECT * FROM orders WHERE id = ? OR order_number = ?').get(orderId, orderId);
  if (!orderRow) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  // Duplicate transaction protection
  if (orderRow.payment_verified === 1 && orderRow.payment_status === 'paid') {
    return res.status(409).json({
      error: 'Duplicate transaction blocked: This order has already been paid and verified.',
      order: formatOrderRow(orderRow)
    });
  }

  const existingPay = db.prepare('SELECT id FROM orders WHERE razorpay_payment_id = ?').get(razorpay_payment_id);
  if (existingPay) {
    return res.status(409).json({
      error: 'Duplicate payment ID detected. Transaction already processed.'
    });
  }

  if (orderRow.razorpay_order_id !== razorpay_order_id) {
    return res.status(400).json({ error: 'Order ID mismatch during payment verification.' });
  }

  const secret = getRazorpaySecret();
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const now = new Date().toISOString();

  if (expectedSignature !== razorpay_signature) {
    db.prepare(`
      UPDATE orders
      SET payment_status = 'failed', payment_verified = 0, updated_at = ?
      WHERE id = ?
    `).run(now, orderRow.id);

    const failedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderRow.id);
    return res.status(400).json({
      verified: false,
      error: 'Cryptographic payment signature verification failed.',
      order: formatOrderRow(failedOrder)
    });
  }

  // Deduct inventory upon verified payment
  const items = JSON.parse(orderRow.items_json || '[]');
  for (const item of items) {
    db.prepare('UPDATE products SET inventory = MAX(0, inventory - ?) WHERE id = ?').run(
      Number(item.quantity) || 1,
      item.productId
    );
  }

  db.prepare(`
    UPDATE orders
    SET payment_status = 'paid',
        payment_verified = 1,
        razorpay_payment_id = ?,
        razorpay_signature = ?,
        order_status = 'confirmed',
        updated_at = ?
    WHERE id = ?
  `).run(razorpay_payment_id, razorpay_signature, now, orderRow.id);

  const verifiedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderRow.id);
  res.json({
    verified: true,
    order: formatOrderRow(verifiedOrder)
  });
});

// Razorpay Webhook verification endpoint
app.post('/api/payments/webhook', (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || getRazorpaySecret();
  if (!signature) {
    return res.status(400).json({ error: 'Missing x-razorpay-signature header.' });
  }
  const payloadString = JSON.stringify(req.body);
  const expected = crypto.createHmac('sha256', webhookSecret).update(payloadString).digest('hex');
  if (expected !== signature) {
    return res.status(400).json({ error: 'Invalid webhook signature.' });
  }

  const event = req.body?.event;
  const paymentEntity = req.body?.payload?.payment?.entity;
  if (event === 'payment.captured' && paymentEntity?.order_id) {
    const orderRow = db.prepare('SELECT * FROM orders WHERE razorpay_order_id = ?').get(paymentEntity.order_id);
    if (orderRow && !orderRow.payment_verified) {
      db.prepare(`
        UPDATE orders
        SET payment_status = 'paid',
            payment_verified = 1,
            razorpay_payment_id = ?,
            order_status = 'confirmed',
            updated_at = ?
        WHERE id = ?
      `).run(paymentEntity.id, new Date().toISOString(), orderRow.id);
    }
  } else if (event === 'payment.failed' && paymentEntity?.order_id) {
    db.prepare(`
      UPDATE orders SET payment_status = 'failed', updated_at = ? WHERE razorpay_order_id = ?
    `).run(new Date().toISOString(), paymentEntity.order_id);
  }

  res.json({ status: 'webhook_processed' });
});

app.get('/api/orders/my', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM orders WHERE user_id = ? OR LOWER(customer_email) = LOWER(?) ORDER BY created_at DESC')
    .all(req.user.id, req.user.email);
  res.json({ orders: rows.map(formatOrderRow) });
});

app.get('/api/orders/:orderNumber', (req, res) => {
  const row = db
    .prepare('SELECT * FROM orders WHERE order_number = ? OR id = ?')
    .get(req.params.orderNumber, req.params.orderNumber);
  if (!row) {
    return res.status(404).json({ error: 'Order not found.' });
  }
  res.json({ order: formatOrderRow(row) });
});

// --- SECURE ADMIN ENDPOINTS (Backend Authorized) ---

app.get('/api/admin/overview', requireAdmin, (_req, res) => {
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
      addresses: JSON.parse(u.addresses_json || '[]'),
      createdAt: u.created_at
    }));
  const inquiries = db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all();
  const faqs = db.prepare('SELECT * FROM faqs ORDER BY sort_order ASC').all();
  const configRow = db.prepare('SELECT value_json FROM site_config WHERE key = ?').get('main');
  const siteConfig = configRow ? JSON.parse(configRow.value_json) : INITIAL_SITE_CONFIG;

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
});

// Admin: Update or Add Product (with strict Rotating=Round validation)
app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
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
  const hasPrice = rawPrice !== null && rawPrice !== undefined && rawPrice !== '' && Number(rawPrice) > 0;
  const priceValue = hasPrice ? Number(rawPrice) : null;
  const priceConfigured = hasPrice ? 1 : 0;

  const name = req.body.name ?? existing.name;
  const shortName = req.body.shortName ?? existing.short_name;
  const size = req.body.size ?? existing.size;
  const dimensions = req.body.dimensions ?? existing.dimensions;
  const sku = req.body.sku ?? existing.sku;
  const inStock = req.body.inStock !== undefined ? (req.body.inStock ? 1 : 0) : existing.in_stock;
  const inventory = req.body.inventory !== undefined ? Number(req.body.inventory) : existing.inventory;
  const summary = req.body.summary ?? existing.summary;
  const description = req.body.description ?? existing.description;
  const images = Array.isArray(req.body.images) ? req.body.images : JSON.parse(existing.images_json);
  const features = Array.isArray(req.body.features) ? req.body.features : JSON.parse(existing.features_json);
  const specifications = Array.isArray(req.body.specifications)
    ? req.body.specifications
    : JSON.parse(existing.specifications_json);
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
});

app.post('/api/admin/products', requireAdmin, (req, res) => {
  const { name, shortName, slug, category, shape, size, dimensions, sku, price, inventory, images, summary, description, features, specifications } = req.body;
  if (!name || !category || !shape || !size) {
    return res.status(400).json({ error: 'Name, category, shape, and size are required.' });
  }
  const ruleError = validateProductVariantRule(category, shape);
  if (ruleError) {
    return res.status(400).json({ error: ruleError });
  }
  const id = 'prod-' + crypto.randomUUID().slice(0, 8);
  const cleanSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
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
    name,
    shortName || name,
    category,
    category === 'rotating' ? 'Rotating Lollipop Flange' : 'Standard Lollipop Flange',
    shape,
    size,
    dimensions || size,
    sku || 'FC-CUST-' + id.toUpperCase(),
    hasPrice ? Number(price) : null,
    hasPrice ? 1 : 0,
    Number(inventory ?? 15),
    JSON.stringify(Array.isArray(images) && images.length > 0 ? images : ['/images/product/standard/18x18/round/image-1.jpg']),
    summary || '',
    description || '',
    JSON.stringify(Array.isArray(features) ? features : []),
    JSON.stringify(Array.isArray(specifications) ? specifications : []),
    now
  );

  const created = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.status(201).json({ product: formatProductRow(created) });
});

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Admin: Reset catalog to strict 6 variants or apply/clear configurable test prices
app.post('/api/admin/pricing-preset', requireAdmin, (req, res) => {
  const { action } = req.body; // 'apply_sample_prices' | 'clear_prices'
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
});

// Admin: Update Order Status / Shipping / Tracking
app.put('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const { orderStatus, shippingStatus, trackingNumber, trackingCarrier, paymentStatus } = req.body;
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Order not found.' });
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
    trackingNumber !== undefined ? String(trackingNumber).trim() : existing.tracking_number,
    trackingCarrier !== undefined ? String(trackingCarrier).trim() : existing.tracking_carrier,
    paymentStatus ?? existing.payment_status,
    now,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  res.json({ order: formatOrderRow(updated) });
});

// Admin: Update Website Content & Configuration
app.put('/api/admin/site-config', requireAdmin, (req, res) => {
  const { siteConfig } = req.body;
  if (!siteConfig || typeof siteConfig !== 'object') {
    return res.status(400).json({ error: 'Valid siteConfig object is required.' });
  }
  const now = new Date().toISOString();
  db.prepare('INSERT OR REPLACE INTO site_config (key, value_json, updated_at) VALUES (?, ?, ?)').run(
    'main',
    JSON.stringify(siteConfig),
    now
  );
  res.json({ siteConfig });
});

// Admin: Update FAQs
app.put('/api/admin/faqs', requireAdmin, (req, res) => {
  const { faqs } = req.body;
  if (!Array.isArray(faqs)) {
    return res.status(400).json({ error: 'faqs array is required.' });
  }
  db.prepare('DELETE FROM faqs').run();
  const insert = db.prepare('INSERT INTO faqs (id, category, question, answer, sort_order) VALUES (?, ?, ?, ?, ?)');
  faqs.forEach((f, idx) => {
    insert.run(f.id || 'faq-' + (idx + 1), f.category || 'General', f.question, f.answer, idx + 1);
  });
  const updated = db.prepare('SELECT * FROM faqs ORDER BY sort_order ASC').all();
  res.json({ faqs: updated });
});

// Admin: Update Inquiry Status
app.put('/api/admin/inquiries/:id', requireAdmin, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run(status || 'reviewed', req.params.id);
  const inquiries = db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all();
  res.json({ inquiries });
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

app.listen(PORT, () => {
  console.log(`Flange Craft Backend API running on http://localhost:${PORT}`);
});
