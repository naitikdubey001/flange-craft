import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  CreditCard,
  FileText
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { SEO } from '../components/SEO';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

export function CheckoutPage() {
  const {
    cart,
    cartCount,
    cartSubtotal,
    hasUnconfiguredCartPrice,
    user,
    token,
    clearCart,
    formatPrice,
    siteConfig,
    paymentGatewayStatus,
    showToast
  } = useStore();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'configurable_quote'>(
    hasUnconfiguredCartPrice ? 'configurable_quote' : 'razorpay'
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Development/Test Mode Razorpay Modal state
  const [testGatewayModal, setTestGatewayModal] = useState<{
    orderId: string;
    orderNumber: string;
    razorpayOrderId: string;
    amountPaise: number;
    customerName: string;
  } | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  useEffect(() => {
    if (user) {
      if (!fullName) setFullName(user.name);
      if (!email) setEmail(user.email);
      if (!phone && user.phone) setPhone(user.phone);
      if (user.addresses && user.addresses.length > 0 && !address) {
        const addr = user.addresses[0];
        setAddress(addr.address || '');
        setCity(addr.city || '');
        setStateName(addr.state || '');
        setPostalCode(addr.postalCode || '');
        setCountry(addr.country || 'India');
      }
    }
  }, [user]);

  useEffect(() => {
    setPaymentMethod(hasUnconfiguredCartPrice ? 'configurable_quote' : 'razorpay');
  }, [hasUnconfiguredCartPrice]);

  const shippingFee = hasUnconfiguredCartPrice ? 0 : Number(siteConfig?.commerce?.shippingFee || 0);
  const taxPct = Number(siteConfig?.commerce?.taxPercentage || 0);
  const taxAmount =
    hasUnconfiguredCartPrice || cartSubtotal === null ? 0 : Math.round((cartSubtotal * taxPct) / 100);
  const totalAmount =
    hasUnconfiguredCartPrice || cartSubtotal === null ? null : cartSubtotal + shippingFee + taxAmount;

  if (cart.length === 0 && !testGatewayModal) {
    return (
      <div className="bg-[#08090B] min-h-screen pt-32 pb-24 px-4 text-center">
        <div className="max-w-lg mx-auto rounded-3xl bg-[#111318] border border-white/10 p-12 space-y-5">
          <h1 className="font-display text-2xl font-bold text-[#F5F5F7]">No Items to Checkout</h1>
          <p className="text-sm text-[#A1A1AA]">
            Your shopping cart is empty. Add a Flange Craft signage variant before proceeding to checkout.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F5F5F7] text-[#08090B] text-xs font-semibold"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const validateForm = () => {
    if (!fullName.trim()) return 'Please enter your full name.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return 'Please enter a valid email address.';
    if (phone.trim().length < 8) return 'Please enter a valid contact phone number.';
    if (!address.trim()) return 'Please enter your street / delivery address.';
    if (!city.trim()) return 'Please enter your city.';
    if (!stateName.trim()) return 'Please enter your state.';
    if (postalCode.trim().length < 4) return 'Please enter a valid PIN / postal code.';
    if (!country.trim()) return 'Please enter your country.';
    return null;
  };

  const verifyPaymentOnServer = async (
    orderNumber: string,
    payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
  ) => {
    setVerifyingPayment(true);
    try {
      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderNumber,
          ...payload
        })
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.verified) {
        setError(verifyData.error || 'Payment verification failed. Order was not marked as paid.');
        setTestGatewayModal(null);
        showToast('Payment Verification Failed', verifyData.error || 'Signature mismatch', 'error');
        return;
      }
      clearCart();
      setTestGatewayModal(null);
      showToast('Payment Verified', `Order ${orderNumber} cryptographically verified.`);
      navigate(`/checkout/success?order=${encodeURIComponent(orderNumber)}`);
    } catch {
      setError('Server error while verifying payment.');
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customer: {
            name: fullName.trim(),
            email: email.trim(),
            phone: phone.trim()
          },
          shippingAddress: {
            fullName: fullName.trim(),
            phone: phone.trim(),
            address: address.trim(),
            city: city.trim(),
            state: stateName.trim(),
            postalCode: postalCode.trim(),
            country: country.trim()
          },
          items: cart.map((item) => ({
            productId: item.product.id,
            slug: item.product.slug,
            name: item.product.name,
            quantity: item.quantity
          })),
          paymentMethod,
          notes: notes.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unable to create order.');
        setSubmitting(false);
        return;
      }

      const createdOrder = data.order;
      const rpDetails = data.razorpay;

      // Case 1: Configurable Price Order (price pending admin quote)
      if (createdOrder.hasUnconfiguredPrice || !rpDetails) {
        clearCart();
        navigate(`/checkout/success?order=${encodeURIComponent(createdOrder.orderNumber)}`);
        return;
      }

      // Case 2: Live Razorpay credentials configured
      if (paymentGatewayStatus.liveCredentialsConfigured && window.Razorpay) {
        const rzp = new window.Razorpay({
          key: rpDetails.keyId,
          amount: rpDetails.amountPaise,
          currency: rpDetails.currency,
          name: 'Flange Craft',
          description: `Order ${createdOrder.orderNumber}`,
          order_id: rpDetails.orderId,
          prefill: {
            name: fullName,
            email,
            contact: phone
          },
          theme: {
            color: '#8B5CF6'
          },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            await verifyPaymentOnServer(createdOrder.orderNumber, response);
          }
        });
        rzp.open();
        setSubmitting(false);
        return;
      }

      // Case 3: Development / Test Mode Razorpay Cryptographic Verification Flow
      setTestGatewayModal({
        orderId: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        razorpayOrderId: rpDetails.orderId,
        amountPaise: rpDetails.amountPaise,
        customerName: fullName.trim()
      });
    } catch {
      setError('Network error while creating order.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestGatewayOutcome = async (outcome: 'success' | 'failure') => {
    if (!testGatewayModal) return;
    setVerifyingPayment(true);
    try {
      const sigRes = await fetch('/api/payments/create-test-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpayOrderId: testGatewayModal.razorpayOrderId,
          outcome
        })
      });
      const sigData = await sigRes.json();
      await verifyPaymentOnServer(testGatewayModal.orderNumber, {
        razorpay_order_id: sigData.razorpayOrderId,
        razorpay_payment_id: sigData.razorpayPaymentId,
        razorpay_signature: sigData.razorpaySignature
      });
    } catch {
      setError('Failed to execute test payment verification.');
      setVerifyingPayment(false);
    }
  };

  return (
    <div className="bg-[#08090B] min-h-screen pt-28 pb-24">
      <SEO
        title="Checkout — Flange Craft"
        description="Complete your Flange Craft illuminated Lollipop Flange signage order with guest checkout and Razorpay payment verification."
        canonicalPath="/checkout"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pb-8 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8B5CF6] mb-2">
              Secure Order Processing
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F5F7]">Checkout</h1>
          </div>
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#A1A1AA] hover:text-[#F5F5F7]"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Cart
          </Link>
        </div>

        {/* Guest Checkout / Logged-in Banner */}
        <div className="mt-8 p-4 rounded-2xl bg-[#111318] border border-white/10 flex flex-wrap items-center justify-between gap-4">
          {user ? (
            <div className="text-xs text-[#A1A1AA]">
              Signed in as <strong className="text-[#F5F5F7]">{user.name}</strong> ({user.email}). Your order will be linked to your customer account.
            </div>
          ) : (
            <div className="text-xs text-[#A1A1AA]">
              <strong className="text-[#F5F5F7]">Guest Checkout Enabled:</strong> You can complete your order without creating an account, or{' '}
              <Link to="/login" className="text-[#38BDF8] underline">
                sign in
              </Link>{' '}
              to save your address and order history.
            </div>
          )}

          {user?.addresses && user.addresses.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#A1A1AA]">Saved Address:</span>
              {user.addresses.map((addr, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setFullName(addr.fullName || user.name);
                    setPhone(addr.phone || user.phone);
                    setAddress(addr.address);
                    setCity(addr.city);
                    setStateName(addr.state);
                    setPostalCode(addr.postalCode);
                    setCountry(addr.country || 'India');
                  }}
                  className="px-3 py-1 rounded-lg bg-[#1A1C22] border border-white/10 text-xs text-[#38BDF8] hover:bg-[#242832]"
                >
                  Use {addr.label || addr.city}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-xs sm:text-sm text-red-300">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Shipping & Contact Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#111318] border border-white/10 space-y-6">
              <h2 className="font-display text-xl font-bold text-[#F5F5F7]">
                1. Contact &amp; Shipping Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 rounded-xl bg-[#1A1C22] border border-white/10 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@business.com"
                    className="w-full px-4 py-3 rounded-xl bg-[#1A1C22] border border-white/10 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-xl bg-[#1A1C22] border border-white/10 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                    Street Address / Storefront Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Shop / Building No., Street, Landmark"
                    className="w-full px-4 py-3 rounded-xl bg-[#1A1C22] border border-white/10 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="w-full px-4 py-3 rounded-xl bg-[#1A1C22] border border-white/10 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">State *</label>
                  <input
                    type="text"
                    required
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="State"
                    className="w-full px-4 py-3 rounded-xl bg-[#1A1C22] border border-white/10 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">PIN / Postal Code *</label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="PIN Code"
                    className="w-full px-4 py-3 rounded-xl bg-[#1A1C22] border border-white/10 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">Country *</label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#1A1C22] border border-white/10 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                    Order Notes / Custom Signage Graphic Instructions (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Mention any delivery instructions or storefront branding details..."
                    className="w-full px-4 py-3 rounded-xl bg-[#1A1C22] border border-white/10 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Architecture */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#111318] border border-white/10 space-y-5">
              <h2 className="font-display text-xl font-bold text-[#F5F5F7]">
                2. Payment Integration &amp; Verification
              </h2>

              {!hasUnconfiguredCartPrice ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#1A1C22] border border-[#8B5CF6]/50 flex items-start gap-3.5">
                    <CreditCard className="w-5 h-5 text-[#8B5CF6] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-[#F5F5F7] flex items-center gap-2">
                        Razorpay Secure Payment Gateway (INR)
                        <span className="px-2 py-0.5 rounded bg-[#8B5CF6]/20 text-[10px] text-[#38BDF8]">
                          {paymentGatewayStatus.liveCredentialsConfigured ? 'Live Mode' : 'Development/Test Mode'}
                        </span>
                      </div>
                      <p className="text-xs text-[#A1A1AA] leading-relaxed">
                        Creates a backend payment order and verifies transaction authenticity using server-side HMAC-SHA256 signature verification and duplicate transaction protection.
                      </p>
                    </div>
                  </div>

                  {!paymentGatewayStatus.liveCredentialsConfigured && (
                    <div className="p-3.5 rounded-xl bg-[#08090B] border border-white/10 text-xs text-[#A1A1AA] leading-relaxed">
                      <strong className="text-[#38BDF8]">Configuration Notice:</strong> Live Razorpay keys (<code className="text-[#F5F5F7]">RAZORPAY_KEY_ID</code> &amp; <code className="text-[#F5F5F7]">RAZORPAY_KEY_SECRET</code>) are not set in environment variables. Clicking "Pay &amp; Verify Order" will launch the Development/Test Mode Razorpay Verification flow with real backend HMAC-SHA256 cryptographic signature verification.
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#1A1C22] border border-[#38BDF8]/40 flex items-start gap-3.5">
                    <FileText className="w-5 h-5 text-[#38BDF8] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-[#F5F5F7]">
                        Configurable Price Order Submission
                      </div>
                      <p className="text-xs text-[#A1A1AA] leading-relaxed">
                        One or more selected variants are currently in the default Configurable Price state. Submitting this order records your exact variant selection and shipping details in the database for price confirmation by Sunil Shukla and Team.
                      </p>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#08090B] border border-white/10 text-xs text-[#A1A1AA]">
                    Want to test instant Razorpay online payment verification? Open the{' '}
                    <Link to="/admin" className="text-[#38BDF8] underline font-medium">
                      Admin Dashboard
                    </Link>{' '}
                    and click <strong>"Enable Sample Store Prices (INR)"</strong>.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Order Summary (5 cols) */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-[#111318] border border-white/10 p-6 sm:p-8 space-y-6 sticky top-28">
              <h2 className="font-display text-xl font-bold text-[#F5F5F7]">
                Order Summary ({cartCount} {cartCount === 1 ? 'Unit' : 'Units'})
              </h2>

              <div className="divide-y divide-white/[0.07] max-h-80 overflow-y-auto pr-1">
                {cart.map(({ product, quantity }) => (
                  <div key={product.id} className="py-3.5 flex items-center gap-3.5">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-14 h-14 rounded-xl object-cover bg-[#1A1C22] border border-white/10 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-[#F5F5F7] truncate">{product.name}</div>
                      <div className="text-[11px] text-[#A1A1AA] mt-0.5">
                        {product.shape} • {product.size} • Qty: {quantity}
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-[#F5F5F7] shrink-0">
                      {product.priceConfigured && product.price
                        ? formatPrice(product.price * quantity, true)
                        : 'Configurable'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-white/10 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#A1A1AA]">Subtotal</span>
                  <span className="font-semibold text-[#F5F5F7]">
                    {hasUnconfiguredCartPrice ? 'Configurable Price' : formatPrice(cartSubtotal, true)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A1A1AA]">Shipping</span>
                  <span className="text-xs text-[#F5F5F7]">
                    {shippingFee > 0 ? formatPrice(shippingFee, true) : 'Configurable'}
                  </span>
                </div>
                {taxPct > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#A1A1AA]">Tax ({taxPct}%)</span>
                    <span className="text-xs text-[#F5F5F7]">
                      {hasUnconfiguredCartPrice ? 'Configurable' : formatPrice(taxAmount, true)}
                    </span>
                  </div>
                )}
                <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                  <span className="font-display text-base font-bold text-[#F5F5F7]">Total Payable</span>
                  <span className="font-display text-xl font-bold text-[#38BDF8]">
                    {hasUnconfiguredCartPrice || totalAmount === null
                      ? 'Configurable Price'
                      : formatPrice(totalAmount, true)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 px-6 rounded-xl bg-[#F5F5F7] hover:bg-white disabled:opacity-50 text-[#08090B] font-display text-sm font-bold inline-flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                <Lock className="w-4 h-4" />
                {submitting
                  ? 'Processing Order...'
                  : hasUnconfiguredCartPrice
                  ? 'Submit Order for Price Confirmation'
                  : `Pay & Verify Order (${formatPrice(totalAmount, true)})`}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-[#A1A1AA]">
                <ShieldCheck className="w-4 h-4 text-[#38BDF8]" />
                <span>Server-Side Cryptographic Verification &amp; Duplicate Protection</span>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Development/Test Mode Razorpay Payment Gateway Verifier Modal */}
      {testGatewayModal && (
        <div className="fixed inset-0 z-[95] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#111318] border border-white/15 shadow-2xl overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-[#8B5CF6]/20 to-[#38BDF8]/20 border-b border-white/10">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md bg-[#08090B]/80 border border-white/15 text-[11px] font-mono text-[#38BDF8]">
                  RAZORPAY TEST MODE
                </span>
                <span className="text-xs font-mono text-[#A1A1AA]">{testGatewayModal.orderNumber}</span>
              </div>
              <h3 className="font-display text-xl font-bold text-[#F5F5F7] mt-3">
                Razorpay Payment Verification
              </h3>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Backend Order ID: <code className="text-[#F5F5F7]">{testGatewayModal.razorpayOrderId}</code>
              </p>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-4 rounded-2xl bg-[#1A1C22] border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#A1A1AA]">Amount</div>
                  <div className="font-display text-2xl font-bold text-[#F5F5F7]">
                    ₹{(testGatewayModal.amountPaise / 100).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#A1A1AA]">Customer</div>
                  <div className="text-xs font-semibold text-[#F5F5F7]">{testGatewayModal.customerName}</div>
                </div>
              </div>

              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                This development/test gateway signs the payment payload using the backend HMAC-SHA256 secret and submits it to <code className="text-[#F5F5F7]">POST /api/payments/verify</code>.
              </p>

              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={verifyingPayment}
                  onClick={() => handleTestGatewayOutcome('success')}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#F5F5F7] hover:bg-white text-[#08090B] font-display text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {verifyingPayment
                    ? 'Verifying HMAC-SHA256 Signature...'
                    : 'Authorize & Verify Valid Payment Signature'}
                </button>

                <button
                  type="button"
                  disabled={verifyingPayment}
                  onClick={() => handleTestGatewayOutcome('failure')}
                  className="w-full py-3 px-4 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Simulate Invalid Signature (Test Failure Protection)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
