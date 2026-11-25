import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  User as UserIcon,
  Package,
  MapPin,
  LogOut,
  Shield,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Search
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Order, ShippingAddress } from '../types';
import { SEO } from '../components/SEO';

export function AuthAndAccountPage() {
  const { user, token, setAuthSession, logout, formatPrice, showToast } = useStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [authTab, setAuthTab] = useState<'login' | 'register' | 'forgot'>(
    location.pathname === '/register' ? 'register' : 'login'
  );
  const [accountTab, setAccountTab] = useState<'orders' | 'profile' | 'addresses'>(
    location.pathname === '/orders' ? 'orders' : 'orders'
  );

  // Auth form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Account data
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [lookupOrderNumber, setLookupOrderNumber] = useState('');
  const [lookedUpOrder, setLookedUpOrder] = useState<Order | null>(null);

  // Profile & Address edit
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [addresses, setAddresses] = useState<ShippingAddress[]>(user?.addresses || []);
  const [newAddr, setNewAddr] = useState<ShippingAddress>({
    label: 'Storefront',
    fullName: user?.name || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  });

  useEffect(() => {
    if (location.pathname === '/register') setAuthTab('register');
    else if (location.pathname === '/login') setAuthTab('login');
  }, [location.pathname]);

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfilePhone(user.phone || '');
      setAddresses(user.addresses || []);
    }
  }, [user]);

  useEffect(() => {
    async function fetchMyOrders() {
      if (!token) return;
      setOrdersLoading(true);
      try {
        const res = await fetch('/api/orders/my', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch {
        // ignore
      } finally {
        setOrdersLoading(false);
      }
    }
    fetchMyOrders();
  }, [token]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setAuthLoading(true);

    try {
      if (authTab === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) {
          setAuthError(data.error || 'Login failed.');
        } else {
          setAuthSession(data.token, data.user);
          showToast('Welcome back', `Signed in as ${data.user.name}`);
          navigate(data.user.role === 'admin' ? '/admin' : '/account');
        }
      } else if (authTab === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, password })
        });
        const data = await res.json();
        if (!res.ok) {
          setAuthError(data.error || 'Registration failed.');
        } else {
          setAuthSession(data.token, data.user);
          showToast('Account Created', `Welcome to Flange Craft, ${data.user.name}`);
          navigate('/account');
        }
      } else if (authTab === 'forgot') {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, newPassword })
        });
        const data = await res.json();
        if (!res.ok) {
          setAuthError(data.error || 'Could not reset password.');
        } else {
          setAuthSuccess(data.message);
          if (newPassword) {
            setTimeout(() => setAuthTab('login'), 1500);
          }
        }
      }
    } catch {
      setAuthError('Network error. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveProfile = async (updatedAddrs?: ShippingAddress[]) => {
    if (!token) return;
    const targetAddresses = updatedAddrs ?? addresses;
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: profileName,
        phone: profilePhone,
        addresses: targetAddresses
      })
    });
    if (res.ok) {
      const data = await res.json();
      setAuthSession(token, data.user);
      showToast('Profile Updated', 'Your customer account settings have been saved.');
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.address || !newAddr.city || !newAddr.state || !newAddr.postalCode) return;
    const next = [...addresses, { ...newAddr, id: 'addr-' + Date.now() }];
    setAddresses(next);
    await handleSaveProfile(next);
    setNewAddr({
      label: 'Branch / Storefront',
      fullName: user?.name || '',
      phone: user?.phone || '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India'
    });
  };

  const handleLookupOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupOrderNumber.trim()) return;
    const res = await fetch(`/api/orders/${encodeURIComponent(lookupOrderNumber.trim())}`);
    if (res.ok) {
      const data = await res.json();
      setLookedUpOrder(data.order);
    } else {
      showToast('Order Not Found', `No order found matching ${lookupOrderNumber}`, 'error');
    }
  };

  // Not Logged In -> Render Login / Register / Forgot Password + Guest Order Lookup
  if (!user) {
    return (
      <div className="bg-[#08090B] min-h-screen pt-28 pb-24">
        <SEO
          title={authTab === 'register' ? 'Create Account — Flange Craft' : 'Customer Login — Flange Craft'}
          description="Sign in or create a Flange Craft customer account to manage orders, saved addresses, and storefront signage inquiries."
          canonicalPath={location.pathname}
        />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left: Auth Card (7 cols) */}
          <div className="lg:col-span-7 rounded-3xl bg-[#111318] border border-white/10 p-7 sm:p-10 space-y-6">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('login');
                  setAuthError(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  authTab === 'login' ? 'bg-[#F5F5F7] text-[#08090B]' : 'text-[#A1A1AA] hover:text-[#F5F5F7]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('register');
                  setAuthError(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  authTab === 'register' ? 'bg-[#F5F5F7] text-[#08090B]' : 'text-[#A1A1AA] hover:text-[#F5F5F7]'
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('forgot');
                  setAuthError(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  authTab === 'forgot' ? 'bg-[#F5F5F7] text-[#08090B]' : 'text-[#A1A1AA] hover:text-[#F5F5F7]'
                }`}
              >
                Forgot Password
              </button>
            </div>

            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F5F5F7]">
                {authTab === 'login'
                  ? 'Sign In to Flange Craft'
                  : authTab === 'register'
                  ? 'Create Your Customer Account'
                  : 'Reset Your Account Password'}
              </h1>
              <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1">
                {authTab === 'login'
                  ? 'Access your order history, saved shipping addresses, or administrator portal.'
                  : authTab === 'register'
                  ? 'Register for faster checkout and real-time order tracking.'
                  : 'Enter your registered email address and choose a new password.'}
              </p>
            </div>

            {authError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                {authError}
              </div>
            )}
            {authSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
                {authSuccess}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authTab === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name or Business Name"
                    className="w-full px-4 py-3 rounded-xl bg-[#1A1C22] border border-white/10 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-[#1A1C22] border border-white/10 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#38BDF8]"
                />
              </div>

              {authTab === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-xl bg-[#1A1C22] border border-white/10 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>
              )}

              {authTab !== 'forgot' ? (
                <div>
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">Password *</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-4 py-3 rounded-xl bg-[#1A1C22] border border-white/10 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">New Password *</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 chars)"
                    className="w-full px-4 py-3 rounded-xl bg-[#1A1C22] border border-white/10 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 px-6 rounded-xl bg-[#F5F5F7] hover:bg-white text-[#08090B] font-display text-sm font-bold transition-all"
              >
                {authLoading
                  ? 'Please wait...'
                  : authTab === 'login'
                  ? 'Sign In'
                  : authTab === 'register'
                  ? 'Create Account'
                  : 'Update Password'}
              </button>
            </form>

            {/* Quick Admin Credentials Info for Testing & Evaluation */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3 text-xs text-[#A1A1AA]">
              <span>Administrator Access (Sunil Shukla &amp; Team):</span>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('login');
                  setEmail('admin@flangecraft.com');
                  setPassword('FlangeCraft@Admin');
                }}
                className="px-3 py-1.5 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#F5F5F7] font-medium hover:bg-[#8B5CF6]/30"
              >
                Fill Admin Credentials
              </button>
            </div>
          </div>

          {/* Right: Guest Order Tracking Lookup (5 cols) */}
          <div className="lg:col-span-5 rounded-3xl bg-[#111318] border border-white/10 p-7 space-y-5">
            <h2 className="font-display text-lg font-bold text-[#F5F5F7]">Track a Guest Order</h2>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Checked out as a guest? Enter your Flange Craft Order Number (e.g., <code className="text-[#F5F5F7]">FC-...</code>) to check live status.
            </p>
            <form onSubmit={handleLookupOrder} className="flex gap-2">
              <input
                type="text"
                value={lookupOrderNumber}
                onChange={(e) => setLookupOrderNumber(e.target.value)}
                placeholder="Order Number (FC-...)"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7] focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[#1A1C22] hover:bg-[#252934] border border-white/15 text-xs font-semibold text-[#F5F5F7] inline-flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5 text-[#38BDF8]" />
                Track
              </button>
            </form>

            {lookedUpOrder && (
              <div className="p-4 rounded-2xl bg-[#1A1C22] border border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#F5F5F7]">{lookedUpOrder.orderNumber}</span>
                  <span className="px-2 py-0.5 rounded bg-[#8B5CF6]/20 text-[#38BDF8] capitalize">
                    {lookedUpOrder.orderStatus.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-[#A1A1AA]">Customer: {lookedUpOrder.customerName}</div>
                <div className="text-[#A1A1AA]">
                  Payment: {lookedUpOrder.paymentVerified ? 'Paid & Verified' : lookedUpOrder.paymentStatus}
                </div>
                <Link
                  to={`/checkout/success?order=${encodeURIComponent(lookedUpOrder.orderNumber)}`}
                  className="inline-block text-[#38BDF8] underline pt-1"
                >
                  View Full Order Receipt →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN CUSTOMER ACCOUNT DASHBOARD
  return (
    <div className="bg-[#08090B] min-h-screen pt-28 pb-24">
      <SEO
        title="Customer Account & Order History — Flange Craft"
        description="Manage your Flange Craft customer profile, saved addresses, and illuminated signage orders."
        canonicalPath="/account"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pb-8 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#38BDF8] mb-1">
              Customer Portal
            </div>
            <h1 className="font-display text-3xl font-bold text-[#F5F5F7]">
              Welcome, {user.name}
            </h1>
            <p className="text-xs text-[#A1A1AA] mt-0.5">{user.email}</p>
          </div>

          <div className="flex items-center gap-3">
            {user.role === 'admin' && (
              <Link
                to="/admin"
                className="px-4 py-2.5 rounded-xl bg-[#8B5CF6] text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Shield className="w-4 h-4" />
                Open Admin Dashboard
              </Link>
            )}
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2.5 rounded-xl bg-[#111318] hover:bg-[#1A1C22] border border-white/10 text-xs font-semibold text-[#F5F5F7] inline-flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              Logout
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation (3 cols) */}
          <div className="lg:col-span-3 space-y-2">
            <button
              type="button"
              onClick={() => setAccountTab('orders')}
              className={`w-full px-4 py-3 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition-colors ${
                accountTab === 'orders'
                  ? 'bg-[#F5F5F7] text-[#08090B]'
                  : 'bg-[#111318] text-[#A1A1AA] hover:text-[#F5F5F7]'
              }`}
            >
              <Package className="w-4 h-4" />
              Order History ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setAccountTab('addresses')}
              className={`w-full px-4 py-3 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition-colors ${
                accountTab === 'addresses'
                  ? 'bg-[#F5F5F7] text-[#08090B]'
                  : 'bg-[#111318] text-[#A1A1AA] hover:text-[#F5F5F7]'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Saved Shipping Addresses ({addresses.length})
            </button>
            <button
              type="button"
              onClick={() => setAccountTab('profile')}
              className={`w-full px-4 py-3 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition-colors ${
                accountTab === 'profile'
                  ? 'bg-[#F5F5F7] text-[#08090B]'
                  : 'bg-[#111318] text-[#A1A1AA] hover:text-[#F5F5F7]'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              Profile &amp; Account Settings
            </button>
          </div>

          {/* Content Area (9 cols) */}
          <div className="lg:col-span-9">
            {accountTab === 'orders' && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-bold text-[#F5F5F7]">Your Order History</h2>
                {ordersLoading ? (
                  <div className="p-8 rounded-2xl bg-[#111318] border border-white/10 text-xs text-[#A1A1AA]">
                    Loading orders from database...
                  </div>
                ) : orders.length === 0 ? (
                  <div className="p-12 rounded-3xl bg-[#111318] border border-white/10 text-center space-y-4">
                    <p className="text-sm text-[#A1A1AA]">You have not placed any signage orders yet.</p>
                    <Link
                      to="/products"
                      className="inline-block px-6 py-3 rounded-xl bg-[#F5F5F7] text-[#08090B] text-xs font-bold"
                    >
                      Explore Products
                    </Link>
                  </div>
                ) : (
                  orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-6 rounded-2xl bg-[#111318] border border-white/10 space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.07]">
                        <div>
                          <span className="font-mono text-sm font-bold text-[#F5F5F7]">{ord.orderNumber}</span>
                          <span className="text-xs text-[#A1A1AA] ml-3">
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {ord.paymentVerified ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" /> Paid &amp; Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[11px] font-semibold text-[#38BDF8]">
                              <Clock className="w-3 h-3" /> {ord.paymentStatus.replace(/_/g, ' ')}
                            </span>
                          )}
                          <span className="px-2.5 py-1 rounded-full bg-[#1A1C22] border border-white/10 text-[11px] font-medium text-[#F5F5F7] capitalize">
                            Order: {ord.orderStatus.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {ord.items.map((item) => (
                          <div key={item.productId} className="flex items-center justify-between text-xs">
                            <span className="text-[#F5F5F7]">
                              {item.name} × {item.quantity}
                            </span>
                            <span className="text-[#A1A1AA]">
                              {item.priceConfigured && item.lineTotal
                                ? formatPrice(item.lineTotal, true)
                                : 'Configurable Price'}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 border-t border-white/[0.07] flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="text-[#A1A1AA]">
                          Shipping Status:{' '}
                          <strong className="text-[#F5F5F7] capitalize">
                            {ord.shippingStatus.replace(/_/g, ' ')}
                          </strong>
                          {ord.trackingNumber && (
                            <span className="ml-2 text-[#38BDF8]">
                              (Tracking: {ord.trackingCarrier} {ord.trackingNumber})
                            </span>
                          )}
                        </div>
                        <Link
                          to={`/checkout/success?order=${encodeURIComponent(ord.orderNumber)}`}
                          className="text-[#38BDF8] hover:underline font-medium"
                        >
                          View Confirmation Details →
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {accountTab === 'addresses' && (
              <div className="space-y-6">
                <h2 className="font-display text-xl font-bold text-[#F5F5F7]">Saved Shipping Addresses</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr, idx) => (
                    <div
                      key={addr.id || idx}
                      className="p-5 rounded-2xl bg-[#111318] border border-white/10 flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1 text-xs">
                        <span className="px-2 py-0.5 rounded bg-[#1A1C22] text-[#38BDF8] font-semibold">
                          {addr.label || 'Address'}
                        </span>
                        <div className="font-semibold text-[#F5F5F7] pt-1">{addr.fullName}</div>
                        <div className="text-[#A1A1AA]">{addr.address}</div>
                        <div className="text-[#A1A1AA]">
                          {addr.city}, {addr.state} {addr.postalCode}, {addr.country}
                        </div>
                        <div className="text-[#A1A1AA]">Phone: {addr.phone}</div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const next = addresses.filter((_, i) => i !== idx);
                          setAddresses(next);
                          await handleSaveProfile(next);
                        }}
                        className="self-start inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={handleAddAddress}
                  className="p-6 rounded-2xl bg-[#111318] border border-white/10 space-y-4"
                >
                  <h3 className="font-display text-sm font-bold text-[#F5F5F7] flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#38BDF8]" /> Add New Shipping Address
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Label (e.g. Main Storefront)"
                      value={newAddr.label}
                      onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
                      className="px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Recipient Full Name"
                      value={newAddr.fullName}
                      onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })}
                      className="px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Street Address"
                      value={newAddr.address}
                      onChange={(e) => setNewAddr({ ...newAddr, address: e.target.value })}
                      className="sm:col-span-2 px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                    />
                    <input
                      type="text"
                      required
                      placeholder="City"
                      value={newAddr.city}
                      onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                      className="px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                    />
                    <input
                      type="text"
                      required
                      placeholder="State"
                      value={newAddr.state}
                      onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                      className="px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                    />
                    <input
                      type="text"
                      required
                      placeholder="PIN Code"
                      value={newAddr.postalCode}
                      onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value })}
                      className="px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Phone"
                      value={newAddr.phone}
                      onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                      className="px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#F5F5F7] text-[#08090B] text-xs font-bold"
                  >
                    Save Address
                  </button>
                </form>
              </div>
            )}

            {accountTab === 'profile' && (
              <div className="p-7 rounded-2xl bg-[#111318] border border-white/10 space-y-5 max-w-xl">
                <h2 className="font-display text-xl font-bold text-[#F5F5F7]">Profile Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-[#A1A1AA] mb-1">Full Name</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-sm text-[#F5F5F7]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#A1A1AA] mb-1">Email Address (Read-only)</label>
                    <input
                      type="email"
                      disabled
                      value={user.email}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#1A1C22]/50 border border-white/10 text-sm text-[#A1A1AA]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#A1A1AA] mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-sm text-[#F5F5F7]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveProfile()}
                    className="px-6 py-3 rounded-xl bg-[#F5F5F7] text-[#08090B] text-xs font-bold"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
