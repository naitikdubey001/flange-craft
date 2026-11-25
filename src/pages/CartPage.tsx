import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, ArrowRight, ArrowLeft, ShieldCheck, Info } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { SEO } from '../components/SEO';

export function CartPage() {
  const {
    cart,
    cartCount,
    cartSubtotal,
    hasUnconfiguredCartPrice,
    updateCartQuantity,
    removeFromCart,
    formatPrice,
    siteConfig
  } = useStore();
  const navigate = useNavigate();

  const shippingFee = hasUnconfiguredCartPrice ? 0 : Number(siteConfig?.commerce?.shippingFee || 0);
  const taxPct = Number(siteConfig?.commerce?.taxPercentage || 0);
  const taxAmount =
    hasUnconfiguredCartPrice || cartSubtotal === null ? 0 : Math.round((cartSubtotal * taxPct) / 100);
  const totalAmount =
    hasUnconfiguredCartPrice || cartSubtotal === null ? null : cartSubtotal + shippingFee + taxAmount;

  return (
    <div className="bg-[#08090B] min-h-screen pt-28 pb-24">
      <SEO
        title="Shopping Cart — Flange Craft"
        description="Review your selected Flange Craft illuminated Lollipop Flange signage variants and proceed to checkout."
        canonicalPath="/cart"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pb-8 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#38BDF8] mb-2">
              Your Selection
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F5F7]">
              Shopping Cart ({cartCount} {cartCount === 1 ? 'Unit' : 'Units'})
            </h1>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#A1A1AA] hover:text-[#F5F5F7] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Continue Shopping
          </Link>
        </div>

        {cart.length === 0 ? (
          <div className="my-12 rounded-3xl bg-[#111318] border border-white/10 p-14 text-center max-w-2xl mx-auto space-y-6">
            <div className="h-16 w-16 rounded-2xl bg-[#1A1C22] border border-white/10 flex items-center justify-center mx-auto text-[#38BDF8]">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-bold text-[#F5F5F7]">Your Shopping Cart is Empty</h2>
              <p className="text-sm text-[#A1A1AA] max-w-md mx-auto leading-relaxed">
                Explore our six verified Standard and Rotating Lollipop Flange illuminated signage variants to add products to your bag.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link
                to="/products"
                className="px-7 py-3.5 rounded-xl bg-[#F5F5F7] hover:bg-white text-[#08090B] font-display text-xs font-bold inline-flex items-center gap-2"
              >
                Explore All Products <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/products/standard"
                className="px-6 py-3.5 rounded-xl bg-[#1A1C22] hover:bg-[#232630] border border-white/10 text-xs font-semibold text-[#F5F5F7]"
              >
                Standard Series
              </Link>
              <Link
                to="/products/rotating"
                className="px-6 py-3.5 rounded-xl bg-[#1A1C22] hover:bg-[#232630] border border-white/10 text-xs font-semibold text-[#F5F5F7]"
              >
                Rotating Series
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Cart Items List (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {cart.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="p-5 rounded-2xl bg-[#111318] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-5"
                >
                  <Link
                    to={`/product/${product.slug}`}
                    className="w-24 h-24 rounded-xl overflow-hidden bg-[#1A1C22] border border-white/10 shrink-0"
                  >
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  </Link>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] text-[#38BDF8] font-medium">
                      <span>{product.categoryLabel}</span>
                      <span>•</span>
                      <span className="font-mono text-[#A1A1AA]">{product.sku}</span>
                    </div>
                    <Link
                      to={`/product/${product.slug}`}
                      className="font-display text-lg font-bold text-[#F5F5F7] hover:text-[#38BDF8] transition-colors block truncate"
                    >
                      {product.name}
                    </Link>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#A1A1AA]">
                      <span>
                        Shape: <strong className="text-[#F5F5F7]">{product.shape}</strong>
                      </span>
                      <span>
                        Dimensions: <strong className="text-[#F5F5F7]">{product.dimensions}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Quantity & Price Controls */}
                  <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
                    <div className="text-right">
                      {product.priceConfigured && product.price ? (
                        <div>
                          <div className="font-display text-lg font-bold text-[#F5F5F7]">
                            {formatPrice(product.price * quantity, true)}
                          </div>
                          <div className="text-[11px] text-[#A1A1AA]">
                            {formatPrice(product)} each
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-xs font-medium text-[#38BDF8]">
                          Configurable Price
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center rounded-xl bg-[#1A1C22] border border-white/10">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => updateCartQuantity(product.id, quantity - 1)}
                          className="px-3 py-1.5 text-xs font-bold text-[#A1A1AA] hover:text-[#F5F5F7]"
                        >
                          −
                        </button>
                        <span className="px-3 py-1.5 text-xs font-semibold text-[#F5F5F7] min-w-[32px] text-center">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => updateCartQuantity(product.id, quantity + 1)}
                          className="px-3 py-1.5 text-xs font-bold text-[#A1A1AA] hover:text-[#F5F5F7]"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        aria-label={`Remove ${product.name}`}
                        onClick={() => removeFromCart(product.id)}
                        className="p-2 rounded-xl bg-[#1A1C22] hover:bg-red-500/20 border border-white/10 text-[#A1A1AA] hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary (4 cols) */}
            <div className="lg:col-span-4">
              <div className="rounded-3xl bg-[#111318] border border-white/10 p-6 sm:p-7 space-y-6 sticky top-28">
                <h2 className="font-display text-xl font-bold text-[#F5F5F7]">Order Summary</h2>

                <div className="space-y-3 text-sm border-b border-white/10 pb-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[#A1A1AA]">Subtotal ({cartCount} items)</span>
                    <span className="font-semibold text-[#F5F5F7]">
                      {hasUnconfiguredCartPrice ? 'Configurable Price' : formatPrice(cartSubtotal, true)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#A1A1AA]">Shipping</span>
                    <span className="text-xs text-[#F5F5F7]">
                      {shippingFee > 0 ? formatPrice(shippingFee, true) : 'Configurable / At Checkout'}
                    </span>
                  </div>
                  {taxPct > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#A1A1AA]">Tax ({taxPct}%)</span>
                      <span className="text-xs text-[#F5F5F7]">
                        {hasUnconfiguredCartPrice ? 'Configurable' : formatPrice(taxAmount, true)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-display text-base font-bold text-[#F5F5F7]">Total</span>
                  <span className="font-display text-xl font-bold text-[#38BDF8]">
                    {hasUnconfiguredCartPrice || totalAmount === null
                      ? 'Configurable Price'
                      : formatPrice(totalAmount, true)}
                  </span>
                </div>

                {hasUnconfiguredCartPrice && (
                  <div className="p-3.5 rounded-xl bg-[#1A1C22] border border-white/10 flex items-start gap-2.5 text-xs text-[#A1A1AA]">
                    <Info className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
                    <div>
                      Product pricing is currently in a <strong className="text-[#F5F5F7]">Configurable State</strong>. You can proceed to checkout to submit your order, or configure INR prices in the{' '}
                      <Link to="/admin" className="text-[#38BDF8] underline">
                        Admin Dashboard
                      </Link>{' '}
                      to test instant Razorpay online payment.
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => navigate('/checkout')}
                  className="w-full py-4 px-6 rounded-xl bg-[#F5F5F7] hover:bg-white text-[#08090B] font-display text-sm font-bold inline-flex items-center justify-center gap-2 transition-all shadow-lg"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4" />
                </button>

                <Link
                  to="/products"
                  className="block w-full py-3 px-4 rounded-xl bg-[#1A1C22] hover:bg-[#232730] border border-white/10 text-center text-xs font-semibold text-[#F5F5F7] transition-colors"
                >
                  Continue Shopping
                </Link>

                <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-[#A1A1AA]">
                  <ShieldCheck className="w-4 h-4 text-[#8B5CF6]" />
                  <span>Guest Checkout &amp; Razorpay Verification Supported</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
