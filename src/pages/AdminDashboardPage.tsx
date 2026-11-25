import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Package,
  ShoppingBag,
  Users,
  Settings,
  BarChart3,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product, Order, User, SiteConfig, FaqItem, Inquiry } from '../types';
import { SEO } from '../components/SEO';

interface AdminStats {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  verifiedRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  configuredPriceCount: number;
  newInquiries: number;
}

export function AdminDashboardPage() {
  const { user, token, setAuthSession, refreshStoreData, showToast, formatPrice } = useStore();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'customers' | 'content'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Admin Login Gate state if not authenticated as admin
  const [adminEmail, setAdminEmail] = useState('admin@flangecraft.com');
  const [adminPassword, setAdminPassword] = useState('');

  // Admin Backend Data
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [configDraft, setConfigDraft] = useState<SiteConfig | null>(null);

  // Product Editor state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [editInventory, setEditInventory] = useState<string>('20');
  const [editSku, setEditSku] = useState<string>('');
  const [editInStock, setEditInStock] = useState<boolean>(true);
  const [editSummary, setEditSummary] = useState<string>('');
  const [editImages, setEditImages] = useState<string>('');

  // New Product Modal state
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProd, setNewProd] = useState({
    name: '',
    shortName: '',
    category: 'standard' as 'standard' | 'rotating',
    shape: 'Round' as 'Round' | 'Square',
    size: '18 × 18 inches',
    sku: '',
    price: '',
    inventory: '15',
    summary: '',
    images: '/images/product/standard/18x18/round/image-1.jpg'
  });

  // Order Filter state
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  const fetchAdminOverview = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        setAuthError('Backend Authorization Denied: Administrator privileges required.');
        setLoading(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setProducts(data.products || []);
        setOrders(data.orders || []);
        setCustomers(data.customers || []);
        setInquiries(data.inquiries || []);
        setFaqs(data.faqs || []);
        setConfigDraft(data.siteConfig || null);
      }
    } catch {
      setAuthError('Unable to reach backend admin API.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && user?.role === 'admin') {
      fetchAdminOverview();
    }
  }, [token, user, fetchAdminOverview]);

  // Enforce Rotating = Round only in New Product form
  useEffect(() => {
    if (newProd.category === 'rotating' && newProd.shape !== 'Round') {
      setNewProd((prev) => ({ ...prev, shape: 'Round', size: '12 × 12 inches' }));
    }
  }, [newProd.category, newProd.shape]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Admin login failed.');
        return;
      }
      if (data.user.role !== 'admin') {
        setAuthError('This account does not have administrator permissions.');
        return;
      }
      setAuthSession(data.token, data.user);
      showToast('Admin Authorized', 'Signed in to Flange Craft Admin Dashboard.');
    } catch {
      setAuthError('Network error during admin authentication.');
    }
  };

  const handlePricingPreset = async (action: 'apply_sample_prices' | 'clear_prices') => {
    if (!token) return;
    const res = await fetch('/api/admin/pricing-preset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ action })
    });
    if (res.ok) {
      await fetchAdminOverview();
      await refreshStoreData();
      showToast(
        action === 'apply_sample_prices' ? 'Store Prices Configured' : 'Prices Reset to Configurable State',
        action === 'apply_sample_prices'
          ? 'Sample INR prices applied to all 6 variants for checkout & Razorpay testing.'
          : 'All variants set to Configurable Price state.'
      );
    }
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setEditPrice(p.priceConfigured && p.price ? String(p.price) : '');
    setEditInventory(String(p.inventory));
    setEditSku(p.sku);
    setEditInStock(p.inStock);
    setEditSummary(p.summary);
    setEditImages(p.images.join(', '));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !token) return;
    const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        price: editPrice.trim() === '' ? null : Number(editPrice),
        inventory: Number(editInventory),
        sku: editSku.trim(),
        inStock: editInStock,
        summary: editSummary.trim(),
        images: editImages
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      })
    });
    const data = await res.json();
    if (!res.ok) {
      showToast('Update Error', data.error || 'Failed to update product', 'error');
      return;
    }
    setEditingProduct(null);
    await fetchAdminOverview();
    await refreshStoreData();
    showToast('Product Updated', `${data.product.shortName} saved.`);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...newProd,
        price: newProd.price.trim() === '' ? null : Number(newProd.price),
        inventory: Number(newProd.inventory),
        images: newProd.images
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      })
    });
    const data = await res.json();
    if (!res.ok) {
      showToast('Validation Error', data.error || 'Could not create product', 'error');
      return;
    }
    setShowAddProduct(false);
    await fetchAdminOverview();
    await refreshStoreData();
    showToast('Product Added', `${data.product.name} added to catalogue.`);
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!token) return;
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      await fetchAdminOverview();
      await refreshStoreData();
      showToast('Product Deleted', `${name} removed.`, 'info');
    }
  };

  const handleUpdateOrder = async (
    orderId: string,
    updates: { orderStatus?: string; shippingStatus?: string; trackingNumber?: string; trackingCarrier?: string }
  ) => {
    if (!token) return;
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      await fetchAdminOverview();
      showToast('Order Updated', 'Order status and tracking synchronized.');
    }
  };

  const handleSaveSiteConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !configDraft) return;
    const res = await fetch('/api/admin/site-config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ siteConfig: configDraft })
    });
    if (res.ok) {
      await fetchAdminOverview();
      await refreshStoreData();
      showToast('Configuration Saved', 'Website content, contact details, and policies updated.');
    }
  };

  // Backend Authorization Gate
  if (!user || user.role !== 'admin') {
    return (
      <div className="bg-[#08090B] min-h-screen pt-32 pb-24 px-4">
        <SEO title="Admin Authorization Required — Flange Craft" canonicalPath="/admin" />
        <div className="max-w-md mx-auto rounded-3xl bg-[#111318] border border-white/15 p-8 space-y-6 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#8B5CF6]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-[#F5F5F7]">Admin Portal Authorization</h1>
              <p className="text-xs text-[#A1A1AA]">Secured by backend session verification</p>
            </div>
          </div>

          {authError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-[#A1A1AA] mb-1">Administrator Email</label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#1A1C22] border border-white/10 text-sm text-[#F5F5F7]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#A1A1AA] mb-1">Administrator Password</label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 rounded-xl bg-[#1A1C22] border border-white/10 text-sm text-[#F5F5F7]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-xl bg-[#F5F5F7] hover:bg-white text-[#08090B] font-display text-xs font-bold"
            >
              Authenticate Administrator
            </button>
          </form>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#A1A1AA]">
            <span>Default Admin (Sunil Shukla &amp; Team):</span>
            <button
              type="button"
              onClick={() => {
                setAdminEmail('admin@flangecraft.com');
                setAdminPassword('FlangeCraft@Admin');
              }}
              className="px-3 py-1.5 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#F5F5F7] font-medium"
            >
              Auto-Fill Admin Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter !== 'all' && o.orderStatus !== orderStatusFilter) return false;
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="bg-[#08090B] min-h-screen pt-28 pb-24">
      <SEO title="Admin Dashboard — Flange Craft" canonicalPath="/admin" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Admin Header */}
        <div className="pb-6 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#8B5CF6]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F5F5F7]">
                Flange Craft Admin Dashboard
              </h1>
              <p className="text-xs text-[#A1A1AA]">
                Authorized as {user.name} ({user.email}) • Owned by Sunil Shukla and Team
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchAdminOverview}
            className="px-4 py-2.5 rounded-xl bg-[#111318] hover:bg-[#1A1C22] border border-white/10 text-xs font-semibold text-[#F5F5F7] inline-flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#38BDF8] ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'dashboard', label: 'Overview & Pricing', icon: BarChart3 },
            { id: 'products', label: `Products (${products.length})`, icon: Package },
            { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingBag },
            { id: 'customers', label: `Customers & Inquiries (${inquiries.length})`, icon: Users },
            { id: 'content', label: 'Website Content & Policies', icon: Settings }
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as typeof activeTab)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-colors ${
                  activeTab === t.id
                    ? 'bg-[#F5F5F7] text-[#08090B]'
                    : 'bg-[#111318] border border-white/10 text-[#A1A1AA] hover:text-[#F5F5F7]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-6 rounded-2xl bg-[#111318] border border-white/10">
                <div className="text-xs text-[#A1A1AA]">Total Orders</div>
                <div className="font-display text-3xl font-bold text-[#F5F5F7] mt-1">{stats.totalOrders}</div>
                <div className="text-xs text-[#38BDF8] mt-1">{stats.paidOrders} cryptographically paid</div>
              </div>
              <div className="p-6 rounded-2xl bg-[#111318] border border-white/10">
                <div className="text-xs text-[#A1A1AA]">Verified Paid Revenue</div>
                <div className="font-display text-3xl font-bold text-emerald-400 mt-1">
                  ₹{stats.verifiedRevenue.toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-[#A1A1AA] mt-1">Excludes unverified / pending</div>
              </div>
              <div className="p-6 rounded-2xl bg-[#111318] border border-white/10">
                <div className="text-xs text-[#A1A1AA]">Configured Product Prices</div>
                <div className="font-display text-3xl font-bold text-[#F5F5F7] mt-1">
                  {stats.configuredPriceCount} / {stats.totalProducts}
                </div>
                <div className="text-xs text-[#8B5CF6] mt-1">
                  {stats.configuredPriceCount === 0 ? 'Default Configurable State' : 'Active Store Pricing'}
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-[#111318] border border-white/10">
                <div className="text-xs text-[#A1A1AA]">Customer Inquiries</div>
                <div className="font-display text-3xl font-bold text-[#F5F5F7] mt-1">{inquiries.length}</div>
                <div className="text-xs text-[#38BDF8] mt-1">{stats.newInquiries} new messages</div>
              </div>
            </div>

            {/* Quick Pricing Configuration Controller */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#111318] border border-white/10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-1.5 max-w-2xl">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#38BDF8]">
                  Catalogue Price Configuration Mode
                </div>
                <h2 className="font-display text-xl font-bold text-[#F5F5F7]">
                  Manage Product Pricing State
                </h2>
                <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                  Per strict requirements, product prices are configurable rather than permanently invented. You can set individual INR prices per variant in the Products tab, or use these presets to test instant Razorpay online payment vs. Configurable Price state.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => handlePricingPreset('apply_sample_prices')}
                  className="px-5 py-3 rounded-xl bg-[#F5F5F7] hover:bg-white text-[#08090B] text-xs font-bold transition-colors"
                >
                  Enable Sample Store Prices (INR)
                </button>
                <button
                  type="button"
                  onClick={() => handlePricingPreset('clear_prices')}
                  className="px-5 py-3 rounded-xl bg-[#1A1C22] hover:bg-[#242832] border border-white/15 text-xs font-semibold text-[#F5F5F7] transition-colors"
                >
                  Reset to Unconfigured Price State
                </button>
              </div>
            </div>

            {/* Recent Orders Summary */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#111318] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-[#F5F5F7]">Recent Orders</h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-[#38BDF8] hover:underline"
                >
                  Manage All Orders →
                </button>
              </div>
              {orders.length === 0 ? (
                <p className="text-xs text-[#A1A1AA]">No orders placed yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-[#A1A1AA]">
                        <th className="py-3 pr-4">Order #</th>
                        <th className="py-3 pr-4">Customer</th>
                        <th className="py-3 pr-4">Total</th>
                        <th className="py-3 pr-4">Payment</th>
                        <th className="py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06]">
                      {orders.slice(0, 6).map((o) => (
                        <tr key={o.id}>
                          <td className="py-3 pr-4 font-mono font-bold text-[#F5F5F7]">{o.orderNumber}</td>
                          <td className="py-3 pr-4 text-[#F5F5F7]">{o.customerName}</td>
                          <td className="py-3 pr-4 text-[#38BDF8]">
                            {o.hasUnconfiguredPrice || o.totalAmount === null
                              ? 'Configurable'
                              : formatPrice(o.totalAmount, true)}
                          </td>
                          <td className="py-3 pr-4">
                            {o.paymentVerified ? (
                              <span className="text-emerald-400 font-semibold">Paid &amp; Verified</span>
                            ) : (
                              <span className="text-[#A1A1AA]">{o.paymentStatus}</span>
                            )}
                          </td>
                          <td className="py-3 capitalize text-[#F5F5F7]">{o.orderStatus.replace(/_/g, ' ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS MANAGER */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold text-[#F5F5F7]">
                  Product Catalogue &amp; Price Configuration
                </h2>
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  Strict rule enforced: Rotating Lollipop Flange signs can only be Round. Square rotating products are blocked.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddProduct((v) => !v)}
                className="px-4 py-2.5 rounded-xl bg-[#F5F5F7] text-[#08090B] text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Variant
              </button>
            </div>

            {showAddProduct && (
              <form
                onSubmit={handleCreateProduct}
                className="p-6 rounded-2xl bg-[#111318] border border-white/15 space-y-4"
              >
                <h3 className="font-display text-base font-bold text-[#F5F5F7]">Add New Signage Variant</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input
                    type="text"
                    required
                    placeholder="Product Name"
                    value={newProd.name}
                    onChange={(e) => setNewProd({ ...newProd, name: e.target.value, shortName: e.target.value })}
                    className="px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                  />
                  <select
                    value={newProd.category}
                    onChange={(e) =>
                      setNewProd({ ...newProd, category: e.target.value as 'standard' | 'rotating' })
                    }
                    className="px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                  >
                    <option value="standard">Standard Lollipop Flange</option>
                    <option value="rotating">Rotating Lollipop Flange (Round Only)</option>
                  </select>
                  <select
                    value={newProd.shape}
                    onChange={(e) => setNewProd({ ...newProd, shape: e.target.value as 'Round' | 'Square' })}
                    className="px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                  >
                    <option value="Round">Round</option>
                    {newProd.category !== 'rotating' && <option value="Square">Square</option>}
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="Dimensions (e.g. 18 × 18 inches)"
                    value={newProd.size}
                    onChange={(e) => setNewProd({ ...newProd, size: e.target.value })}
                    className="px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                  />
                  <input
                    type="number"
                    placeholder="Price in INR (Leave blank for Configurable)"
                    value={newProd.price}
                    onChange={(e) => setNewProd({ ...newProd, price: e.target.value })}
                    className="px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                  />
                  <input
                    type="number"
                    placeholder="Inventory Qty"
                    value={newProd.inventory}
                    onChange={(e) => setNewProd({ ...newProd, inventory: e.target.value })}
                    className="px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#F5F5F7] text-[#08090B] text-xs font-bold"
                  >
                    Create Variant
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddProduct(false)}
                    className="px-4 py-2.5 rounded-xl bg-[#1A1C22] text-xs text-[#A1A1AA]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {editingProduct && (
              <form
                onSubmit={handleSaveProduct}
                className="p-6 rounded-2xl bg-[#111318] border border-[#38BDF8]/40 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-bold text-[#F5F5F7]">
                    Editing: {editingProduct.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="text-xs text-[#A1A1AA] hover:text-[#F5F5F7]"
                  >
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] text-[#A1A1AA] mb-1">
                      Price in INR (Leave blank for Configurable)
                    </label>
                    <input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      placeholder="Configurable (null)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#A1A1AA] mb-1">Inventory Stock</label>
                    <input
                      type="number"
                      value={editInventory}
                      onChange={(e) => setEditInventory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#A1A1AA] mb-1">SKU Code</label>
                    <input
                      type="text"
                      value={editSku}
                      onChange={(e) => setEditSku(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                    />
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 text-xs text-[#F5F5F7] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editInStock}
                        onChange={(e) => setEditInStock(e.target.checked)}
                      />
                      Available In Stock
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-[#A1A1AA] mb-1">Product Summary</label>
                  <input
                    type="text"
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#A1A1AA] mb-1">
                    Product Image Paths (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editImages}
                    onChange={(e) => setEditImages(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#38BDF8] text-[#08090B] text-xs font-bold"
                >
                  Save Product Changes
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl bg-[#111318] border border-white/10 flex items-center gap-4"
                >
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    className="w-20 h-20 rounded-xl object-cover bg-[#1A1C22] border border-white/10 shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="text-xs text-[#38BDF8] font-medium">
                      {p.categoryLabel} • {p.shape} • {p.size}
                    </div>
                    <div className="font-display text-sm font-bold text-[#F5F5F7] truncate">{p.name}</div>
                    <div className="text-xs text-[#A1A1AA]">
                      Price:{' '}
                      <strong className="text-[#F5F5F7]">
                        {p.priceConfigured && p.price ? `₹${p.price.toLocaleString('en-IN')}` : 'Configurable'}
                      </strong>{' '}
                      • Stock: <strong className="text-[#F5F5F7]">{p.inventory}</strong>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => openEditProduct(p)}
                      className="p-2 rounded-lg bg-[#1A1C22] hover:bg-[#252934] border border-white/10 text-[#F5F5F7]"
                      title="Edit Product"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(p.id, p.shortName)}
                      className="p-2 rounded-lg bg-[#1A1C22] hover:bg-red-500/20 border border-white/10 text-red-400"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ORDERS MANAGER */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search order number, customer name, email..."
                className="w-full sm:w-80 px-4 py-2.5 rounded-xl bg-[#111318] border border-white/10 text-xs text-[#F5F5F7]"
              />
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-[#111318] border border-white/10 text-xs text-[#F5F5F7]"
              >
                <option value="all">All Order Statuses</option>
                <option value="pending">Pending</option>
                <option value="awaiting_price_quote">Awaiting Price Quote</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="p-12 rounded-2xl bg-[#111318] border border-white/10 text-center text-xs text-[#A1A1AA]">
                No orders match the current filter.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-6 rounded-2xl bg-[#111318] border border-white/10 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-white/10">
                      <div>
                        <span className="font-mono text-sm font-bold text-[#F5F5F7]">{ord.orderNumber}</span>
                        <span className="text-xs text-[#A1A1AA] ml-3">
                          {ord.customerName} ({ord.customerEmail} • {ord.customerPhone})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {ord.paymentVerified ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Paid &amp; Verified
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-white/10 text-[#A1A1AA]">
                            Payment: {ord.paymentStatus}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="text-[#A1A1AA] font-semibold">Ordered Variants:</div>
                        {ord.items.map((item) => (
                          <div key={item.productId} className="text-[#F5F5F7]">
                            • {item.name} ({item.dimensions}) × {item.quantity}
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1">
                        <div className="text-[#A1A1AA] font-semibold">Delivery Address:</div>
                        <div className="text-[#F5F5F7]">
                          {ord.shippingAddress.address}, {ord.shippingAddress.city}, {ord.shippingAddress.state}{' '}
                          {ord.shippingAddress.postalCode}, {ord.shippingAddress.country}
                        </div>
                      </div>
                    </div>

                    {/* Admin Controls for Order & Shipping Status */}
                    <div className="pt-3 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                      <div>
                        <label className="block text-[10px] uppercase text-[#A1A1AA] mb-1">Order Status</label>
                        <select
                          value={ord.orderStatus}
                          onChange={(e) => handleUpdateOrder(ord.id, { orderStatus: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                        >
                          <option value="pending">Pending</option>
                          <option value="awaiting_price_quote">Awaiting Price Quote</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase text-[#A1A1AA] mb-1">Shipping Status</label>
                        <select
                          value={ord.shippingStatus}
                          onChange={(e) => handleUpdateOrder(ord.id, { shippingStatus: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                        >
                          <option value="not_shipped">Not Shipped</option>
                          <option value="preparing">Preparing</option>
                          <option value="dispatched">Dispatched</option>
                          <option value="in_transit">In Transit</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase text-[#A1A1AA] mb-1">Courier Carrier</label>
                        <input
                          type="text"
                          defaultValue={ord.trackingCarrier}
                          placeholder="e.g. BlueDart / Delhivery"
                          onBlur={(e) => handleUpdateOrder(ord.id, { trackingCarrier: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase text-[#A1A1AA] mb-1">Tracking Number</label>
                        <input
                          type="text"
                          defaultValue={ord.trackingNumber}
                          placeholder="AWB / Tracking ID"
                          onBlur={(e) => handleUpdateOrder(ord.id, { trackingNumber: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CUSTOMERS & INQUIRIES */}
        {activeTab === 'customers' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-6 rounded-3xl bg-[#111318] border border-white/10 space-y-4">
              <h2 className="font-display text-lg font-bold text-[#F5F5F7]">
                Registered Users ({customers.length})
              </h2>
              <div className="divide-y divide-white/[0.06]">
                {customers.map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-[#F5F5F7]">{c.name}</div>
                      <div className="text-[#A1A1AA]">
                        {c.email} {c.phone ? `• ${c.phone}` : ''}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#1A1C22] text-[#38BDF8] capitalize">
                      {c.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-[#111318] border border-white/10 space-y-4">
              <h2 className="font-display text-lg font-bold text-[#F5F5F7]">
                Contact Form Inquiries ({inquiries.length})
              </h2>
              {inquiries.length === 0 ? (
                <p className="text-xs text-[#A1A1AA]">No contact inquiries received yet.</p>
              ) : (
                <div className="space-y-3">
                  {inquiries.map((inq) => (
                    <div key={inq.id} className="p-4 rounded-2xl bg-[#1A1C22] border border-white/[0.06] space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#F5F5F7]">{inq.subject}</span>
                        <span className="text-[11px] text-[#38BDF8]">{inq.status}</span>
                      </div>
                      <div className="text-[#A1A1AA]">
                        From: {inq.name} ({inq.email} {inq.phone ? `• ${inq.phone}` : ''})
                      </div>
                      <p className="text-[#F5F5F7] pt-1 leading-relaxed">{inq.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: WEBSITE CONTENT, CONTACT & POLICIES */}
        {activeTab === 'content' && configDraft && (
          <form onSubmit={handleSaveSiteConfig} className="space-y-8">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#111318] border border-white/10 space-y-5">
              <h2 className="font-display text-lg font-bold text-[#F5F5F7]">
                1. Configurable Contact &amp; Business Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1">Business Phone</label>
                  <input
                    type="text"
                    value={configDraft.contact.phone}
                    onChange={(e) =>
                      setConfigDraft({
                        ...configDraft,
                        contact: { ...configDraft.contact, phone: e.target.value }
                      })
                    }
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1">WhatsApp Number</label>
                  <input
                    type="text"
                    value={configDraft.contact.whatsapp}
                    onChange={(e) =>
                      setConfigDraft({
                        ...configDraft,
                        contact: { ...configDraft.contact, whatsapp: e.target.value }
                      })
                    }
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1">Support Email</label>
                  <input
                    type="email"
                    value={configDraft.contact.email}
                    onChange={(e) =>
                      setConfigDraft({
                        ...configDraft,
                        contact: { ...configDraft.contact, email: e.target.value }
                      })
                    }
                    placeholder="contact@flangecraft.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1">Business Address</label>
                  <input
                    type="text"
                    value={configDraft.contact.address}
                    onChange={(e) =>
                      setConfigDraft({
                        ...configDraft,
                        contact: { ...configDraft.contact, address: e.target.value }
                      })
                    }
                    placeholder="Enter business address"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-[#111318] border border-white/10 space-y-5">
              <h2 className="font-display text-lg font-bold text-[#F5F5F7]">
                2. Homepage &amp; Brand Editorial Content
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1">Hero Headline</label>
                  <input
                    type="text"
                    value={configDraft.tagline}
                    onChange={(e) => setConfigDraft({ ...configDraft, tagline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1">Shipping Fee (INR)</label>
                  <input
                    type="number"
                    value={configDraft.commerce.shippingFee}
                    onChange={(e) =>
                      setConfigDraft({
                        ...configDraft,
                        commerce: { ...configDraft.commerce, shippingFee: Number(e.target.value) }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-[#111318] border border-white/10 space-y-5">
              <h2 className="font-display text-lg font-bold text-[#F5F5F7]">
                3. Configurable Store Policies
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1">Privacy Policy</label>
                  <textarea
                    rows={5}
                    value={configDraft.policies.privacyPolicy}
                    onChange={(e) =>
                      setConfigDraft({
                        ...configDraft,
                        policies: { ...configDraft.policies, privacyPolicy: e.target.value }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1">Terms &amp; Conditions</label>
                  <textarea
                    rows={5}
                    value={configDraft.policies.termsConditions}
                    onChange={(e) =>
                      setConfigDraft({
                        ...configDraft,
                        policies: { ...configDraft.policies, termsConditions: e.target.value }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1">Shipping Policy</label>
                  <textarea
                    rows={5}
                    value={configDraft.policies.shippingPolicy}
                    onChange={(e) =>
                      setConfigDraft({
                        ...configDraft,
                        policies: { ...configDraft.policies, shippingPolicy: e.target.value }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1">Return Policy</label>
                  <textarea
                    rows={5}
                    value={configDraft.policies.returnPolicy}
                    onChange={(e) =>
                      setConfigDraft({
                        ...configDraft,
                        policies: { ...configDraft.policies, returnPolicy: e.target.value }
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="px-8 py-4 rounded-xl bg-[#F5F5F7] hover:bg-white text-[#08090B] font-display text-sm font-bold"
            >
              Save All Content &amp; Policy Configurations
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
