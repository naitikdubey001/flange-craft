export interface ProductSpecification {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  category: 'standard' | 'rotating';
  categoryLabel: string;
  shape: 'Round' | 'Square';
  size: '12 × 12 inches' | '18 × 18 inches' | '24 × 24 inches' | string;
  dimensions: string;
  sku: string;
  price: number | null;
  priceConfigured: boolean;
  inStock: boolean;
  inventory: number;
  featured: boolean;
  sortOrder: number;
  images: string[];
  summary: string;
  description: string;
  features: string[];
  specifications: ProductSpecification[];
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ShippingAddress {
  id?: string;
  label?: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  addresses: ShippingAddress[];
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  slug: string;
  name: string;
  shortName: string;
  category: string;
  shape: string;
  size: string;
  dimensions: string;
  sku: string;
  image: string;
  quantity: number;
  unitPrice: number | null;
  priceConfigured: boolean;
  lineTotal: number | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  subtotal: number | null;
  shippingFee: number;
  taxAmount: number;
  totalAmount: number | null;
  hasUnconfiguredPrice: boolean;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'price_pending_confirmation';
  paymentVerified: boolean;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  paymentMode: string;
  orderStatus: 'pending' | 'awaiting_price_quote' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingStatus: 'not_shipped' | 'preparing' | 'dispatched' | 'in_transit' | 'delivered';
  trackingNumber: string;
  trackingCarrier: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order?: number;
}

export interface SiteConfig {
  brandName: string;
  ownerName: string;
  industry: string;
  primaryProduct: string;
  tagline: string;
  heroSubtitle: string;
  introHeadline: string;
  introText: string;
  storyHeadline: string;
  storyText: string;
  aboutHeroHeadline: string;
  aboutIntroduction: string;
  aboutPhilosophy: string;
  contact: {
    phone: string;
    email: string;
    whatsapp: string;
    address: string;
    workingHours: string;
    instagram: string;
    facebook: string;
    linkedin: string;
  };
  commerce: {
    currency: string;
    currencySymbol: string;
    shippingFee: number;
    shippingConfigurableNote: string;
    taxPercentage: number;
    taxConfigurableNote: string;
    razorpayKeyId: string;
  };
  policies: {
    privacyPolicy: string;
    termsConditions: string;
    shippingPolicy: string;
    returnPolicy: string;
  };
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}
