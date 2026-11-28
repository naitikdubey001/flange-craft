import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
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
  Search,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Order, ShippingAddress, User } from '../types';
import { SEO } from '../components/SEO';
import { apiRequest, getErrorMessage } from '../utils/api';

const ORDER_NUMBER_FORMAT_REGEX = /^FC-\d{6}-\d{3}$/i;

export function AuthAndAccountPage() {
  const { user, token, setAuthSession, logout, formatPrice, showToast } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlResetToken = searchParams.get('resetToken') || '';

  const [authTab, setAuthTab] = useState<'login' | 'register' | 'forgot'>(
    urlResetToken ? 'forgot' : location.pathname === '/register' ? 'register' : 'login'
  );
  const [accountTab, setAccountTab] = useState<'orders' | 'profile' | 'addresses'>(
    location.pathname === '/orders' ? 'orders' : 'orders'
  );

  // Auth form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState(urlResetToken);
  const [newPassword, setNewPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Account data
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Guest Order Tracking state
  const [lookupOrderNumber, setLookupOrderNumber] = useState('');
  const [lookedUpOrder, setLookedUpOrder] = useState<Order | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Guest Order Claim state (for logged-in users claiming a prior guest order)
  const [claimOrderNo, setClaimOrderNo] = useState('');
  const [claimPhone, setClaimPhone] = useState('');
  const [claimPostalCode, setClaimPostalCode] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const handleClearResetTokenMode = () => {
    setResetToken('');
    setNewPassword('');
    setAuthError(null);
    setAuthSuccess(null);
    if (searchParams.has('resetToken')) {
      setSearchParams({}, { replace: true });
    }
  };

  // Profile & Address edit
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileSaving, setProfileSaving] = useState(false);
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
    if (urlResetToken) {
      setResetToken(urlResetToken);
      setAuthTab('forgot');
    } else if (location.pathname === '/register') {
      setAuthTab('register');
    } else if (location.pathname === '/login') {
      setAuthTab('login');
    }
  }, [location.pathname, urlResetToken]);

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
      setOrdersError(null);
      try {
        const { data } = await apiRequest<{ orders?: Order[] }>('/api/orders/my', {
          token
        });
        setOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch (err) {
        setOrdersError(getErrorMessage(err, 'Unable to load order history.'));
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
        const { status, data } = await apiRequest<{ token?: string; user?: User }>('/api/auth/login', {
          method: 'POST',
          body: { email: email.trim(), password }
        });
        if (status < 200 || status >= 300 || !data?.token || !data?.user) {
          setAuthError('Invalid sign-in response from server.');
          return;
        }
        setAuthSession(data.token, data.user);
        showToast('Welcome back', `Signed in as ${data.user.name}`);
        navigate(data.user.role === 'admin' ? '/admin' : '/account');
      } else if (authTab === 'register') {
        const { status, data } = await apiRequest<{ token?: string; user?: User }>('/api/auth/register', {
          method: 'POST',
          body: { name: name.trim(), email: email.trim(), phone: phone.trim(), password }
        });
        if (status < 200 || status >= 300 || !data?.token || !data?.user) {
          setAuthError('Invalid registration response from server.');
          return;
        }
        setAuthSession(data.token, data.user);
        showToast('Account Created', `Welcome to Flange Craft, ${data.user.name}`);
        navigate('/account');
      } else if (authTab === 'forgot') {
        // Step 2 of Reset: user has a verified reset token from email link
        if (resetToken.trim()) {
          const { data } = await apiRequest<{ success?: boolean; message?: string }>('/api/auth/reset-password', {
            method: 'POST',
            body: { token: resetToken.trim(), newPassword }
          });
          setAuthSuccess(
            data.message || 'Your password has been reset. You can now sign in with your new password.'
          );
          setResetToken('');
          setNewPassword('');
          if (searchParams.has('resetToken')) {
            setSearchParams({}, { replace: true });
          }
          setTimeout(() => setAuthTab('login'), 1800);
        } else {
          // Step 1 of Reset: request email verification reset link
          const { data } = await apiRequest<{ success?: boolean; message?: string }>('/api/auth/forgot-password', {
            method: 'POST',
            body: { email: email.trim() }
          });
          setAuthSuccess(
            data.message ||
              'If an eligible account is registered with that email address, password reset instructions have been sent.'
          );
        }
      }
    } catch (err) {
      setAuthError(getErrorMessage(err, 'Unable to complete authentication request. Please try again.'));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveProfile = async (updatedAddrs?: ShippingAddress[]) => {
    if (!token) return;
    const targetAddresses = updatedAddrs ?? addresses;
    setProfileSaving(true);
    try {
      const { data } = await apiRequest<{ user?: User }>('/api/auth/profile', {
        method: 'PUT',
        token,
        body: {
          name: profileName.trim(),
          phone: profilePhone.trim(),
          addresses: targetAddresses
        }
      });
      if (data?.user) {
        setAuthSession(token, data.user);
        showToast('Profile Updated', 'Your customer account settings have been saved.');
      }
    } catch (err) {
      showToast('Update Error', getErrorMessage(err, 'Unable to save profile settings.'), 'error');
    } finally {
      setProfileSaving(false);
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

  const handleClaimGuestOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setClaimError(null);
    const cleanedNo = claimOrderNo.trim().toUpperCase();
    if (!ORDER_NUMBER_FORMAT_REGEX.test(cleanedNo)) {
      setClaimError('Please enter a valid Flange Craft Order Number (e.g., FC-123456-789).');
      return;
    }
    if (!claimPhone.trim() || !claimPostalCode.trim()) {
      setClaimError('Please provide the phone number and postal code used on the guest order.');
      return;
    }
    setClaimLoading(true);
    try {
      const { data } = await apiRequest<{ order?: Order }>('/api/orders/claim', {
        method: 'POST',
        token,
        body: {
          orderNumber: cleanedNo,
          phone: claimPhone.trim(),
          postalCode: claimPostalCode.trim()
        }
      });
      if (data?.order) {
        setOrders((prev) => [data.order!, ...prev.filter((o) => o.id !== data.order!.id)]);
        setClaimOrderNo('');
        setClaimPhone('');
        setClaimPostalCode('');
        showToast('Guest Order Linked', `Order ${data.order.orderNumber} has been linked to your account.`);
      }
    } catch (err) {
      setClaimError(getErrorMessage(err, 'Unable to verify and link that guest order.'));
    } finally {
      setClaimLoading(false);
    }
  };

  const handleLookupOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = lookupOrderNumber.trim().toUpperCase();
    // Always clear previous lookup results when initiating a new request
    setLookedUpOrder(null);
    setLookupError(null);

    if (!cleaned) {
      setLookupError('Please enter your Flange Craft Order Number (e.g., FC-123456-789).');
      return;
    }

    if (!ORDER_NUMBER_FORMAT_REGEX.test(cleaned)) {
      setLookupError(
        'Invalid Order Number format. Flange Craft order numbers follow the format FC-123456-789.'
      );
      return;
    }

    setLookupLoading(true);
    try {
      const { data } = await apiRequest<{ order?: Order }>(`/api/orders/${encodeURIComponent(cleaned)}`, {
        token
      });
      if (!data?.order || !data.order.orderNumber) {
        setLookedUpOrder(null);
        setLookupError(`No order found matching ${cleaned}.`);
        return;
      }
      setLookedUpOrder(data.order);
    } catch (err) {
      setLookedUpOrder(null);
      const errMsg = getErrorMessage(err, `No order found matching ${cleaned}.`);
      setLookupError(errMsg);
    } finally {
      setLookupLoading(false);
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
                  setAuthSuccess(null);
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
                  setAuthSuccess(null);
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
                  setAuthSuccess(null);
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
                  ? 'Access your order history and saved shipping addresses.'
                  : authTab === 'register'
                  ? 'Register for faster checkout and real-time order tracking.'
                  : resetToken
                  ? 'Enter your new password below to complete your verified password reset.'
                  : 'Enter your registered email address to request a verified password reset link.'}
              </p>
            </div>

            {authError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
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
                    disabled={authLoading}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name or Business Name"
                    className="w-full px-4 py-3 rounded-xl bg-[#1A1C22] border border-white/10 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#38BDF8] disabled:opacity-60"
                  />
                </div>
              )}

              {(authTab !== 'forgot' || !resetToken) && (
                <div>
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    required
                    disabled={authLoading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-[#1A1C22] border border-white/10 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#38BDF8] disabled:opacity-60"
                  />
                </div>
              )}

              {authTab === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    disabled={authLoading}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-xl bg-[#1A1C22] border border-white/10 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#38BDF8] disabled:opacity-60"
                  />
                </div>
              )}

              {authTab !== 'forgot' && (
                <div>
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">Password *</label>
                  <input
                    type="password"
                    required
                    disabled={authLoading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-4 py-3 rounded-xl bg-[#1A1C22] border border-white/10 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#38BDF8] disabled:opacity-60"
                  />
                </div>
              )}

              {authTab === 'forgot' && resetToken && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">New Password *</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      disabled={authLoading}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 chars)"
                      className="w-full px-4 py-3 rounded-xl bg-[#1A1C22] border border-white/10 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#38BDF8] disabled:opacity-60"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[#A1A1AA]">Link expired or not working?</span>
                    <button
                      type="button"
                      onClick={handleClearResetTokenMode}
                      className="text-[#38BDF8] hover:underline font-semibold"
                    >
                      Request a new reset link
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 px-6 rounded-xl bg-[#F5F5F7] hover:bg-white disabled:opacity-50 text-[#08090B] font-display text-sm font-bold transition-all"
              >
                {authLoading
                  ? 'Please wait...'
                  : authTab === 'login'
                  ? 'Sign In'
                  : authTab === 'register'
                  ? 'Create Account'
                  : resetToken
                  ? 'Confirm New Password'
                  : 'Request Password Reset'}
              </button>

              {authTab === 'forgot' && (
                <p className="text-xs text-[#A1A1AA] leading-relaxed pt-1">
                  Need immediate assistance with your account?{' '}
                  <Link to="/contact" className="text-[#38BDF8] underline">
                    Contact Flange Craft Support
                  </Link>
                  .
                </p>
              )}
            </form>
          </div>

          {/* Right: Guest Order Tracking Lookup (5 cols) */}
          <div className="lg:col-span-5 rounded-3xl bg-[#111318] border border-white/10 p-7 space-y-5">
            <h2 className="font-display text-lg font-bold text-[#F5F5F7]">Track a Guest Order</h2>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Checked out as a guest? Enter your Flange Craft Order Number (e.g., <code className="text-[#F5F5F7]">FC-123456-789</code>) to check live status.
            </p>
            <form onSubmit={handleLookupOrder} className="flex gap-2">
              <input
                type="text"
                disabled={lookupLoading}
                value={lookupOrderNumber}
                onChange={(e) => {
                  setLookupOrderNumber(e.target.value);
                  if (lookupError) setLookupError(null);
                }}
                placeholder="Order Number (FC-...)"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7] focus:outline-none focus:border-[#38BDF8] disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={lookupLoading}
                className="px-4 py-2.5 rounded-xl bg-[#1A1C22] hover:bg-[#252934] disabled:opacity-50 border border-white/15 text-xs font-semibold text-[#F5F5F7] inline-flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5 text-[#38BDF8]" />
                {lookupLoading ? 'Checking...' : 'Track'}
              </button>
            </form>

            {lookupError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{lookupError}</span>
              </div>
            )}

            {lookedUpOrder && (
              <div className="p-4 rounded-2xl bg-[#1A1C22] border border-white/10 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#F5F5F7]">{lookedUpOrder.orderNumber}</span>
                  <span className="px-2 py-0.5 rounded bg-[#8B5CF6]/20 text-[#38BDF8] capitalize">
                    {lookedUpOrder.orderStatus.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-[#A1A1AA]">
                  Payment:{' '}
                  <strong className="text-[#F5F5F7]">
                    {lookedUpOrder.paymentVerified
                      ? 'Paid & Verified'
                      : lookedUpOrder.paymentStatus.replace(/_/g, ' ')}
                  </strong>
                </div>
                <div className="text-[#A1A1AA]">
                  Shipping:{' '}
                  <strong className="text-[#F5F5F7] capitalize">
                    {lookedUpOrder.shippingStatus.replace(/_/g, ' ')}
                  </strong>
                  {lookedUpOrder.shippingAddress?.city && (
                    <span>
                      {' '}
                      ({lookedUpOrder.shippingAddress.city}
                      {lookedUpOrder.shippingAddress.state ? `, ${lookedUpOrder.shippingAddress.state}` : ''})
                    </span>
                  )}
                </div>
                {lookedUpOrder.trackingNumber && (
                  <div className="text-[#38BDF8]">
                    Tracking: {lookedUpOrder.trackingCarrier} {lookedUpOrder.trackingNumber}
                  </div>
                )}
                <Link
                  to={`/checkout/success?order=${encodeURIComponent(lookedUpOrder.orderNumber)}`}
                  className="inline-block text-[#38BDF8] underline pt-1"
                >
                  View Order Status Summary →
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
                {ordersError && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{ordersError}</span>
                  </div>
                )}
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

                {/* Verified Guest Order Claim Section */}
                <form
                  onSubmit={handleClaimGuestOrder}
                  className="p-6 rounded-2xl bg-[#111318] border border-white/10 space-y-4 mt-6"
                >
                  <div>
                    <h3 className="font-display text-sm font-bold text-[#F5F5F7]">
                      Link a Previous Guest Order
                    </h3>
                    <p className="text-xs text-[#A1A1AA] mt-0.5">
                      Placed an order as a guest using <strong className="text-[#F5F5F7]">{user.email}</strong>? Verify the Order Number, checkout phone number, and delivery PIN code to link it to your account.
                    </p>
                  </div>
                  {claimError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{claimError}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      disabled={claimLoading}
                      value={claimOrderNo}
                      onChange={(e) => setClaimOrderNo(e.target.value)}
                      placeholder="Order Number (FC-...)"
                      className="px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                    />
                    <input
                      type="tel"
                      required
                      disabled={claimLoading}
                      value={claimPhone}
                      onChange={(e) => setClaimPhone(e.target.value)}
                      placeholder="Checkout Phone Number"
                      className="px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                    />
                    <input
                      type="text"
                      required
                      disabled={claimLoading}
                      value={claimPostalCode}
                      onChange={(e) => setClaimPostalCode(e.target.value)}
                      placeholder="Delivery PIN / Postal Code"
                      className="px-3.5 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={claimLoading}
                    className="px-5 py-2.5 rounded-xl bg-[#1A1C22] hover:bg-[#252934] disabled:opacity-50 border border-white/15 text-xs font-semibold text-[#F5F5F7]"
                  >
                    {claimLoading ? 'Verifying Order...' : 'Verify & Link Guest Order'}
                  </button>
                </form>
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
                        disabled={profileSaving}
                        onClick={async () => {
                          const next = addresses.filter((_, i) => i !== idx);
                          setAddresses(next);
                          await handleSaveProfile(next);
                        }}
                        className="self-start inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
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
                    disabled={profileSaving}
                    className="px-5 py-2.5 rounded-xl bg-[#F5F5F7] disabled:opacity-50 text-[#08090B] text-xs font-bold"
                  >
                    {profileSaving ? 'Saving...' : 'Save Address'}
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
                    disabled={profileSaving}
                    onClick={() => handleSaveProfile()}
                    className="px-6 py-3 rounded-xl bg-[#F5F5F7] disabled:opacity-50 text-[#08090B] text-xs font-bold"
                  >
                    {profileSaving ? 'Saving...' : 'Save Changes'}
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
