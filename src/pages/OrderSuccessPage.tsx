import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Clock, ShieldCheck, ArrowRight, Package, AlertTriangle } from 'lucide-react';
import { Order } from '../types';
import { useStore } from '../context/StoreContext';
import { SEO } from '../components/SEO';

export function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order');
  const { formatPrice } = useStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      if (!orderNumber) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data.order);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="bg-[#08090B] min-h-screen pt-32 pb-24 px-4 text-center">
        <div className="text-sm text-[#A1A1AA]">Verifying order status...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-[#08090B] min-h-screen pt-32 pb-24 px-4 text-center">
        <div className="max-w-lg mx-auto rounded-3xl bg-[#111318] border border-white/10 p-12 space-y-5">
          <h1 className="font-display text-2xl font-bold text-[#F5F5F7]">Order Not Found</h1>
          <p className="text-sm text-[#A1A1AA]">
            We could not locate the requested order confirmation. You can view all your orders in your Customer Account.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F5F5F7] text-[#08090B] text-xs font-semibold"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const isPaymentVerified = order.paymentVerified && order.paymentStatus === 'paid';

  return (
    <div className="bg-[#08090B] min-h-screen pt-28 pb-24">
      <SEO
        title={`Order ${order.orderNumber} — Flange Craft`}
        description="Flange Craft order confirmation and payment verification summary."
        canonicalPath="/checkout/success"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Status Card — Strictly shows verified payment confirmation ONLY when paymentVerified is true */}
        <div className="rounded-3xl bg-[#111318] border border-white/10 p-8 sm:p-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {isPaymentVerified ? (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-xs font-semibold text-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
                Payment Cryptographically Verified • Order Confirmed
              </div>
            ) : order.paymentStatus === 'price_pending_confirmation' ? (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8]/40 text-xs font-semibold text-[#38BDF8]">
                <Clock className="w-4 h-4" />
                Order Registered • Configurable Price Confirmation Pending
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-xs font-semibold text-amber-300">
                <AlertTriangle className="w-4 h-4" />
                Payment Pending / Unverified
              </div>
            )}

            <span className="text-xs font-mono text-[#A1A1AA]">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F5F7]">
              {isPaymentVerified
                ? 'Thank You. Your Payment & Order Are Confirmed.'
                : 'Thank You. Your Order Request Has Been Recorded.'}
            </h1>
            <p className="text-sm text-[#A1A1AA] leading-relaxed">
              Order Number: <strong className="text-[#F5F5F7] font-mono">{order.orderNumber}</strong>
            </p>
          </div>

          {/* Payment & Order Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
            <div className="p-4 rounded-2xl bg-[#1A1C22] border border-white/[0.06]">
              <div className="text-[11px] uppercase tracking-wider text-[#A1A1AA]">Order Number</div>
              <div className="font-mono text-sm font-bold text-[#F5F5F7] mt-1">{order.orderNumber}</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#1A1C22] border border-white/[0.06]">
              <div className="text-[11px] uppercase tracking-wider text-[#A1A1AA]">Payment Status</div>
              <div className="text-sm font-bold text-[#F5F5F7] mt-1 capitalize">
                {isPaymentVerified
                  ? 'Paid & Verified'
                  : order.paymentStatus === 'price_pending_confirmation'
                  ? 'Price Quote Pending'
                  : order.paymentStatus}
              </div>
              {order.razorpayPaymentId && (
                <div className="text-[11px] font-mono text-[#38BDF8] mt-0.5 truncate">
                  ID: {order.razorpayPaymentId}
                </div>
              )}
            </div>
            <div className="p-4 rounded-2xl bg-[#1A1C22] border border-white/[0.06]">
              <div className="text-[11px] uppercase tracking-wider text-[#A1A1AA]">Order Total</div>
              <div className="font-display text-lg font-bold text-[#38BDF8] mt-0.5">
                {order.hasUnconfiguredPrice || order.totalAmount === null
                  ? 'Configurable Price'
                  : formatPrice(order.totalAmount, true)}
              </div>
            </div>
          </div>
        </div>

        {/* Purchased Products & Customer Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 rounded-3xl bg-[#111318] border border-white/10 p-6 sm:p-8 space-y-5">
            <h2 className="font-display text-lg font-bold text-[#F5F5F7] flex items-center gap-2">
              <Package className="w-5 h-5 text-[#8B5CF6]" />
              Ordered Signage Variants
            </h2>

            <div className="divide-y divide-white/[0.07]">
              {order.items.map((item) => (
                <div key={item.productId} className="py-4 flex items-center gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover bg-[#1A1C22] border border-white/10 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#F5F5F7]">{item.name}</div>
                    <div className="text-xs text-[#A1A1AA] mt-0.5">
                      {item.shape} • {item.dimensions} • SKU: {item.sku}
                    </div>
                    <div className="text-xs text-[#A1A1AA] mt-0.5">Quantity: {item.quantity}</div>
                  </div>
                  <div className="text-xs font-semibold text-[#F5F5F7] shrink-0">
                    {item.priceConfigured && item.lineTotal
                      ? formatPrice(item.lineTotal, true)
                      : 'Configurable Price'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 rounded-3xl bg-[#111318] border border-white/10 p-6 sm:p-8 space-y-5">
            <h2 className="font-display text-lg font-bold text-[#F5F5F7] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#38BDF8]" />
              Customer &amp; Delivery Details
            </h2>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <span className="text-[#A1A1AA] block text-xs">Customer Name</span>
                <span className="font-semibold text-[#F5F5F7]">{order.customerName}</span>
              </div>
              <div>
                <span className="text-[#A1A1AA] block text-xs">Email &amp; Phone</span>
                <span className="text-[#F5F5F7]">
                  {order.customerEmail} • {order.customerPhone}
                </span>
              </div>
              <div>
                <span className="text-[#A1A1AA] block text-xs">Shipping Address</span>
                <span className="text-[#F5F5F7] leading-relaxed block">
                  {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                  {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-col gap-2.5">
              <Link
                to="/products"
                className="w-full py-3.5 px-5 rounded-xl bg-[#F5F5F7] hover:bg-white text-[#08090B] font-display text-xs font-bold inline-flex items-center justify-center gap-2"
              >
                Continue Shopping <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/account"
                className="w-full py-3 px-5 rounded-xl bg-[#1A1C22] hover:bg-[#232730] border border-white/10 text-xs font-semibold text-[#F5F5F7] text-center"
              >
                View Order History
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
