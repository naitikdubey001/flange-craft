import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, CartItem, User, SiteConfig, FaqItem } from '../types';

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'prod-std-round-18',
    slug: 'standard-round-18x18',
    name: 'Standard Lollipop Flange — Round 18 × 18"',
    shortName: 'Standard Round 18 × 18"',
    category: 'standard',
    categoryLabel: 'Standard Lollipop Flange',
    shape: 'Round',
    size: '18 × 18 inches',
    dimensions: '18 × 18 inches',
    sku: 'FC-STD-RND-18',
    price: null,
    priceConfigured: false,
    inStock: true,
    inventory: 25,
    featured: true,
    sortOrder: 1,
    images: [
      '/images/product/standard/18x18/round/image-1.jpg',
      '/images/product/standard/18x18/round/image-2.jpg'
    ],
    summary: 'Compact projecting double-sided illuminated round flange sign built for clear two-way storefront visibility.',
    description: 'The Standard Round 18 × 18 inches Lollipop Flange sign is a projecting wall-mounted illuminated display engineered for commercial storefronts.',
    features: [
      'Projecting wall-mounted Lollipop Flange architecture',
      'Internal illumination for clear day and night storefront visibility',
      'Double-sided circular display surface (18 × 18 inches)',
      'Integrated heavy-duty wall mounting flange bracket'
    ],
    specifications: [
      { label: 'Product Line', value: 'Standard Lollipop Flange' },
      { label: 'Shape', value: 'Round' },
      { label: 'Dimensions', value: '18 × 18 inches' },
      { label: 'Mounting Type', value: 'Projecting Wall-Mounted Flange' },
      { label: 'Illumination', value: 'Internal Illuminated Display' }
    ]
  },
  {
    id: 'prod-std-round-24',
    slug: 'standard-round-24x24',
    name: 'Standard Lollipop Flange — Round 24 × 24"',
    shortName: 'Standard Round 24 × 24"',
    category: 'standard',
    categoryLabel: 'Standard Lollipop Flange',
    shape: 'Round',
    size: '24 × 24 inches',
    dimensions: '24 × 24 inches',
    sku: 'FC-STD-RND-24',
    price: null,
    priceConfigured: false,
    inStock: true,
    inventory: 20,
    featured: true,
    sortOrder: 2,
    images: [
      '/images/product/standard/24x24/round/image-1.jpg',
      '/images/product/standard/24x24/round/image-2.jpg'
    ],
    summary: 'Large-format 24 × 24 inches projecting round illuminated flange sign for high-impact street presence.',
    description: 'Designed for businesses requiring commanding street-level recognition, the Standard Round 24 × 24 inches Lollipop Flange sign delivers an expansive circular illuminated canvas.',
    features: [
      'Large-format 24 × 24 inches circular display face',
      'Internal illumination for vivid graphics representation',
      'Double-sided projecting storefront orientation',
      'Rigid formed perimeter frame and wall mounting flange'
    ],
    specifications: [
      { label: 'Product Line', value: 'Standard Lollipop Flange' },
      { label: 'Shape', value: 'Round' },
      { label: 'Dimensions', value: '24 × 24 inches' },
      { label: 'Mounting Type', value: 'Projecting Wall-Mounted Flange' },
      { label: 'Illumination', value: 'Internal Illuminated Display' }
    ]
  },
  {
    id: 'prod-std-square-18',
    slug: 'standard-square-18x18',
    name: 'Standard Lollipop Flange — Square 18 × 18"',
    shortName: 'Standard Square 18 × 18"',
    category: 'standard',
    categoryLabel: 'Standard Lollipop Flange',
    shape: 'Square',
    size: '18 × 18 inches',
    dimensions: '18 × 18 inches',
    sku: 'FC-STD-SQR-18',
    price: null,
    priceConfigured: false,
    inStock: true,
    inventory: 25,
    featured: true,
    sortOrder: 3,
    images: [
      '/images/product/standard/18x18/square/image-1.jpg',
      '/images/product/standard/18x18/square/image-2.jpg'
    ],
    summary: 'Geometric 18 × 18 inches square illuminated projecting sign with rounded architectural corners.',
    description: 'The Standard Square 18 × 18 inches Lollipop Flange sign provides a structured geometric canvas for modern brand identities, typography, and logos.',
    features: [
      '18 × 18 inches square display profile with refined corner radius',
      'Internal illumination for uniform graphic brightness',
      'Projecting double-sided wall-mounted configuration',
      'Integrated mounting flange for secure wall installation'
    ],
    specifications: [
      { label: 'Product Line', value: 'Standard Lollipop Flange' },
      { label: 'Shape', value: 'Square' },
      { label: 'Dimensions', value: '18 × 18 inches' },
      { label: 'Mounting Type', value: 'Projecting Wall-Mounted Flange' },
      { label: 'Illumination', value: 'Internal Illuminated Display' }
    ]
  },
  {
    id: 'prod-std-square-24',
    slug: 'standard-square-24x24',
    name: 'Standard Lollipop Flange — Square 24 × 24"',
    shortName: 'Standard Square 24 × 24"',
    category: 'standard',
    categoryLabel: 'Standard Lollipop Flange',
    shape: 'Square',
    size: '24 × 24 inches',
    dimensions: '24 × 24 inches',
    sku: 'FC-STD-SQR-24',
    price: null,
    priceConfigured: false,
    inStock: true,
    inventory: 18,
    featured: true,
    sortOrder: 4,
    images: [
      '/images/product/standard/24x24/square/image-1.jpg',
      '/images/product/standard/24x24/square/image-2.jpg'
    ],
    summary: 'Full-scale 24 × 24 inches square projecting illuminated signage for maximum graphic surface area.',
    description: 'Offering the largest display surface in the Standard Square lineup, the 24 × 24 inches Square Lollipop Flange sign combines bold architectural proportions with internal illumination.',
    features: [
      'Expansive 24 × 24 inches square illuminated display area',
      'Double-sided projecting orientation for two-way street visibility',
      'Internal illumination engineered for high-contrast branding',
      'Robust perimeter molding and structural mounting flange'
    ],
    specifications: [
      { label: 'Product Line', value: 'Standard Lollipop Flange' },
      { label: 'Shape', value: 'Square' },
      { label: 'Dimensions', value: '24 × 24 inches' },
      { label: 'Mounting Type', value: 'Projecting Wall-Mounted Flange' },
      { label: 'Illumination', value: 'Internal Illuminated Display' }
    ]
  },
  {
    id: 'prod-rot-round-12',
    slug: 'rotating-round-12x12',
    name: 'Rotating Lollipop Flange — Round 12 × 12"',
    shortName: 'Rotating Round 12 × 12"',
    category: 'rotating',
    categoryLabel: 'Rotating Lollipop Flange',
    shape: 'Round',
    size: '12 × 12 inches',
    dimensions: '12 × 12 inches',
    sku: 'FC-ROT-RND-12',
    price: null,
    priceConfigured: false,
    inStock: true,
    inventory: 15,
    featured: true,
    sortOrder: 5,
    images: [
      '/images/product/rotating/12x12/round/image-1.jpg'
    ],
    summary: 'Compact 12 × 12 inches rotating round illuminated projecting sign that draws attention through continuous motion.',
    description: 'The Rotating Round 12 × 12 inches Lollipop Flange sign pairs internal illumination with rotational movement in a compact circular profile.',
    features: [
      'Rotating round projecting signage format (12 × 12 inches)',
      'Internal illumination combined with rotational motion',
      'Double-sided circular display visible from multiple approach angles',
      'Round-only rotating architecture for balanced visual motion'
    ],
    specifications: [
      { label: 'Product Line', value: 'Rotating Lollipop Flange' },
      { label: 'Shape', value: 'Round (Rotating Exclusive)' },
      { label: 'Dimensions', value: '12 × 12 inches' },
      { label: 'Motion Type', value: 'Rotating Display' },
      { label: 'Illumination', value: 'Internal Illuminated Display' }
    ]
  },
  {
    id: 'prod-rot-round-24',
    slug: 'rotating-round-24x24',
    name: 'Rotating Lollipop Flange — Round 24 × 24"',
    shortName: 'Rotating Round 24 × 24"',
    category: 'rotating',
    categoryLabel: 'Rotating Lollipop Flange',
    shape: 'Round',
    size: '24 × 24 inches',
    dimensions: '24 × 24 inches',
    sku: 'FC-ROT-RND-24',
    price: null,
    priceConfigured: false,
    inStock: true,
    inventory: 12,
    featured: true,
    sortOrder: 6,
    images: [
      '/images/product/rotating/24x24/round/image-1.jpg'
    ],
    summary: 'Flagship 24 × 24 inches rotating round illuminated Lollipop Flange sign for maximum dynamic storefront presence.',
    description: 'Our premier large-format dynamic display, the Rotating Round 24 × 24 inches Lollipop Flange sign combines an expansive 24-inch circular illuminated face with rotational movement.',
    features: [
      'Large-scale 24 × 24 inches rotating round display',
      'Internal illumination for vibrant day and nighttime presence',
      'Dynamic rotating motion increases storefront noticeability',
      'Double-sided circular presentation'
    ],
    specifications: [
      { label: 'Product Line', value: 'Rotating Lollipop Flange' },
      { label: 'Shape', value: 'Round (Rotating Exclusive)' },
      { label: 'Dimensions', value: '24 × 24 inches' },
      { label: 'Motion Type', value: 'Rotating Display' },
      { label: 'Illumination', value: 'Internal Illuminated Display' }
    ]
  }
];

const DEFAULT_CONFIG: SiteConfig = {
  brandName: 'Flange Craft',
  ownerName: 'Sunil Shukla and Team',
  industry: 'Illuminated commercial signage / storefront signage',
  primaryProduct: 'Illuminated Lollipop Flange Signs',
  tagline: 'Your Store Deserves to Be Seen.',
  heroSubtitle: 'Premium illuminated projecting signage designed to make your storefront stand out.',
  introHeadline: 'Visibility. Designed Differently.',
  introText: 'Flange Craft specializes in illuminated projecting Lollipop Flange signage engineered for businesses that demand clear, unmistakable storefront presence from every direction.',
  storyHeadline: 'Built to Stand Out.',
  storyText: 'Led by Sunil Shukla and Team, Flange Craft focuses on precision-crafted illuminated Lollipop Flange signs that give commercial storefronts a clean, modern, and commanding architectural presence.',
  aboutHeroHeadline: 'Crafting Visibility for Modern Businesses.',
  aboutIntroduction: 'Flange Craft is a specialized commercial signage brand led by Sunil Shukla and Team, dedicated to illuminated Lollipop Flange projecting signs.',
  aboutPhilosophy: 'A storefront sign is the physical handshake of a business. When mounted perpendicular to the facade and internally illuminated, a Lollipop Flange sign transforms passive foot traffic into active walk-ins.',
  contact: {
    phone: '',
    email: '',
    whatsapp: '',
    address: '',
    workingHours: '',
    instagram: '',
    facebook: '',
    linkedin: ''
  },
  commerce: {
    currency: 'INR',
    currencySymbol: '₹',
    shippingFee: 0,
    shippingConfigurableNote: 'Calculated based on delivery pin code & order quantity',
    taxPercentage: 0,
    taxConfigurableNote: 'GST as applicable',
    razorpayKeyId: ''
  },
  policies: {
    privacyPolicy: `Flange Craft ("we", "our", or "us"), operated by Sunil Shukla and Team, respects your privacy and is committed to protecting the personal data you share when using our website or placing an order.

1. Information We Collect
We collect only the details necessary to process your signage orders, respond to inquiries, and manage your customer account—including your name, email address, phone number, and shipping address.

2. Payment Security
All online payment transactions are processed through Razorpay's secure payment gateway architecture with server-side signature verification. We do not store raw card numbers or sensitive banking credentials on our servers.

3. Contact & Privacy Requests
For questions regarding your account data or order records, please reach out to Sunil Shukla and Team through our Contact page.`,
    termsConditions: `Welcome to Flange Craft, owned and operated by Sunil Shukla and Team. By accessing this website or placing an order for our illuminated Lollipop Flange signage, you agree to the following terms:

1. Product Catalogue Accuracy
Flange Craft manufactures and supplies the following verified variants:
• Standard Lollipop Flange: Round (18 × 18 inches, 24 × 24 inches) and Square (18 × 18 inches, 24 × 24 inches)
• Rotating Lollipop Flange: Round only (12 × 12 inches, 24 × 24 inches)

2. Pricing & Order Confirmation
Product prices, taxes, and shipping charges are confirmed at checkout or via official quote. Orders paid online are confirmed only after cryptographic payment verification on our server.

3. Support & Inquiries
For commercial terms or custom branding inquiries, please contact Sunil Shukla and Team via the Contact page.`,
    shippingPolicy: `Flange Craft ships illuminated Lollipop Flange signage with protective commercial packaging designed to safeguard acrylic faces, frames, and mounting brackets during transit.

1. Order Processing & Dispatch
Orders are prepared and inspected prior to dispatch. Estimated dispatch timelines and courier partner details are shared once your order status is updated in your Customer Account.

2. Shipping Coverage & Charges
Shipping rates and regional delivery timelines are determined based on package dimensions (12 × 12", 18 × 18", or 24 × 24") and delivery destination.`,
    returnPolicy: `Flange Craft is committed to delivering quality illuminated signage that matches the exact variant and dimensions ordered.

1. Inspection Upon Delivery
Customers are advised to inspect packaging and signage upon delivery. In case of transit damage or a variant discrepancy, please reach out immediately through our Contact page with your Order ID.

2. Return & Replacement Support
Our support team will review your order details and guide you through the applicable replacement or resolution process.`
  }
};

interface ToastNotification {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'info' | 'error';
}

interface StoreContextValue {
  products: Product[];
  siteConfig: SiteConfig;
  faqs: FaqItem[];
  paymentGatewayStatus: {
    liveCredentialsConfigured: boolean;
    keyId: string;
    mode: string;
  };
  loading: boolean;
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number | null;
  hasUnconfiguredCartPrice: boolean;
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  user: User | null;
  token: string | null;
  setAuthSession: (token: string, user: User) => void;
  logout: () => Promise<void>;
  refreshStoreData: () => Promise<void>;
  toast: ToastNotification | null;
  showToast: (title: string, description?: string, type?: 'success' | 'info' | 'error') => void;
  formatPrice: (productOrPrice: Product | number | null, configured?: boolean) => string;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

const CART_STORAGE_KEY = 'flange_craft_cart_v1';
const AUTH_TOKEN_KEY = 'flange_craft_token_v1';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [paymentGatewayStatus, setPaymentGatewayStatus] = useState({
    liveCredentialsConfigured: false,
    keyId: '',
    mode: 'development_test'
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastNotification | null>(null);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);

  const showToast = useCallback((title: string, description?: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = String(Date.now());
    setToast({ id, title, description, type });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3600);
  }, []);

  const refreshStoreData = useCallback(async () => {
    try {
      const res = await fetch('/api/bootstrap');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
          // Sync cart items with latest product price/stock from DB
          setCart((prevCart) =>
            prevCart
              .map((item) => {
                const updatedProd = data.products.find((p: Product) => p.id === item.product.id || p.slug === item.product.slug);
                return updatedProd ? { ...item, product: updatedProd } : item;
              })
              .filter((item) => Boolean(item.product))
          );
        }
        if (data.siteConfig) setSiteConfig(data.siteConfig);
        if (Array.isArray(data.faqs)) setFaqs(data.faqs);
        if (data.paymentGatewayStatus) setPaymentGatewayStatus(data.paymentGatewayStatus);
      }
    } catch (err) {
      console.error('Bootstrap fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStoreData();
  }, [refreshStoreData]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage errors
    }
  }, [cart]);

  useEffect(() => {
    async function verifySession() {
      if (!token) {
        setUser(null);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          setToken(null);
          setUser(null);
        }
      } catch {
        // server unreachable
      }
    }
    verifySession();
  }, [token]);

  const setAuthSession = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch {
        // ignore
      }
    }
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setUser(null);
    showToast('Signed out', 'You have been logged out of your account.', 'info');
  }, [token, showToast]);

  const addToCart = useCallback(
    (product: Product, quantity = 1) => {
      setCart((prev) => {
        const existingIndex = prev.findIndex((i) => i.product.id === product.id);
        if (existingIndex > -1) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            product,
            quantity: Math.min(product.inventory || 50, updated[existingIndex].quantity + quantity)
          };
          return updated;
        }
        return [...prev, { product, quantity: Math.max(1, quantity) }];
      });
      showToast('Added to Cart', `${product.shortName} (${quantity}x) added to your bag.`);
    },
    [showToast]
  );

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.min(item.product.inventory || 50, Math.max(1, quantity)) }
          : item
      )
    );
  }, []);

  const removeFromCart = useCallback(
    (productId: string) => {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
      showToast('Item removed', 'Product removed from your shopping cart.', 'info');
    },
    [showToast]
  );

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const hasUnconfiguredCartPrice = cart.some((item) => !item.product.priceConfigured || item.product.price === null);
  const cartSubtotal = hasUnconfiguredCartPrice
    ? null
    : cart.reduce((acc, item) => acc + (Number(item.product.price) || 0) * item.quantity, 0);

  const formatPrice = useCallback(
    (productOrPrice: Product | number | null, configured = true) => {
      const symbol = siteConfig?.commerce?.currencySymbol || '₹';
      if (typeof productOrPrice === 'object' && productOrPrice !== null) {
        if (!productOrPrice.priceConfigured || productOrPrice.price === null || productOrPrice.price <= 0) {
          return 'Price Configurable';
        }
        return `${symbol}${Number(productOrPrice.price).toLocaleString('en-IN')}`;
      }
      if (!configured || productOrPrice === null || productOrPrice === undefined || Number(productOrPrice) <= 0) {
        return 'Price Configurable';
      }
      return `${symbol}${Number(productOrPrice).toLocaleString('en-IN')}`;
    },
    [siteConfig]
  );

  return (
    <StoreContext.Provider
      value={{
        products,
        siteConfig,
        faqs,
        paymentGatewayStatus,
        loading,
        cart,
        cartCount,
        cartSubtotal,
        hasUnconfiguredCartPrice,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        user,
        token,
        setAuthSession,
        logout,
        refreshStoreData,
        toast,
        showToast,
        formatPrice
      }}
    >
      {children}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] max-w-sm rounded-xl bg-[#1A1C22] border border-white/15 px-5 py-4 shadow-2xl shadow-black/80 flex items-start gap-3.5 transition-all duration-300">
          <div
            className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${
              toast.type === 'error'
                ? 'bg-red-400 shadow-[0_0_10px_#f87171]'
                : toast.type === 'info'
                ? 'bg-[#38BDF8] shadow-[0_0_10px_#38BDF8]'
                : 'bg-[#8B5CF6] shadow-[0_0_10px_#8B5CF6]'
            }`}
          />
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#F5F5F7]">{toast.title}</p>
            {toast.description && <p className="text-xs text-[#A1A1AA] mt-0.5 leading-relaxed">{toast.description}</p>}
          </div>
        </div>
      )}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
