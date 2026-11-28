import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShoppingBag,
  Zap,
  Maximize2,
  ZoomIn,
  CheckCircle2,
  Layers,
  RotateCw,
  Truck,
  ShieldCheck,
  ChevronDown,
  ArrowLeft,
  Info
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { LightboxModal } from '../components/LightboxModal';
import { ProductCard } from '../components/ProductCard';
import { SEO } from '../components/SEO';
import { applyImageFallbackOnError } from '../utils/imageFallback';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { products, addToCart, formatPrice, faqs, siteConfig } = useStore();

  const product = products.find((p) => p.slug === slug || p.id === slug);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomCoords, setZoomCoords] = useState({ x: 50, y: 50 });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  useEffect(() => {
    setActiveImageIndex(0);
    setIsZoomed(false);
    setQuantity(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (!product) {
    return (
      <div className="bg-[#08090B] min-h-screen pt-32 pb-24 px-4 text-center">
        <div className="max-w-lg mx-auto rounded-3xl bg-[#111318] border border-white/10 p-12 space-y-5">
          <h1 className="font-display text-2xl font-bold text-[#F5F5F7]">Product Variant Not Found</h1>
          <p className="text-sm text-[#A1A1AA]">
            The requested signage variant does not exist in our verified 6-product catalogue.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F5F5F7] text-[#08090B] text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Catalogue
          </Link>
        </div>
      </div>
    );
  }

  // Dynamic Variant Selection Helper — strictly prevents invalid combinations!
  const handleSelectCategory = (targetCategory: 'standard' | 'rotating') => {
    if (targetCategory === product.category) return;
    if (targetCategory === 'rotating') {
      // Rotating is Round only (12x12 or 24x24)
      const targetSize = product.size === '24 × 24 inches' ? '24 × 24 inches' : '12 × 12 inches';
      const match = products.find((p) => p.category === 'rotating' && p.shape === 'Round' && p.size === targetSize);
      if (match) navigate(`/product/${match.slug}`);
    } else {
      // Standard is 18x18 or 24x24
      const targetSize = product.size === '24 × 24 inches' ? '24 × 24 inches' : '18 × 18 inches';
      const match = products.find((p) => p.category === 'standard' && p.shape === 'Round' && p.size === targetSize);
      if (match) navigate(`/product/${match.slug}`);
    }
  };

  const handleSelectShape = (targetShape: 'Round' | 'Square') => {
    if (product.category === 'rotating' && targetShape === 'Square') {
      return; // Strictly prohibited
    }
    const match = products.find(
      (p) => p.category === product.category && p.shape === targetShape && p.size === product.size
    );
    if (match) navigate(`/product/${match.slug}`);
  };

  const handleSelectSize = (targetSize: string) => {
    const match = products.find(
      (p) => p.category === product.category && p.shape === product.shape && p.size === targetSize
    );
    if (match) navigate(`/product/${match.slug}`);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate('/checkout');
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomCoords({ x, y });
  };

  const relatedProducts = products.filter((p) => p.id !== product.id).slice(0, 3);

  return (
    <div className="bg-[#08090B] min-h-screen pt-28 pb-24">
      <SEO
        title={`${product.name} — Illuminated Lollipop Flange`}
        description={product.summary}
        canonicalPath={`/product/${product.slug}`}
        ogImage={product.images[0]}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          sku: product.sku,
          description: product.description,
          image: product.images.map((img) => window.location.origin + img),
          brand: {
            '@type': 'Brand',
            name: 'Flange Craft'
          },
          offers: {
            '@type': 'Offer',
            priceCurrency: 'INR',
            price: product.priceConfigured && product.price ? product.price : undefined,
            availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
          }
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-[#A1A1AA] mb-8">
          <Link to="/" className="hover:text-[#F5F5F7]">
            Home
          </Link>
          <span>/</span>
          <Link to="/products" className="hover:text-[#F5F5F7]">
            Products
          </Link>
          <span>/</span>
          <Link to={`/products/${product.category}`} className="hover:text-[#F5F5F7] capitalize">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-[#F5F5F7] font-medium truncate">{product.shortName}</span>
        </nav>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 pb-20 border-b border-white/[0.08]">
          {/* LEFT: Image Gallery, Zoom & Fullscreen (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setIsZoomed(false)}
              onClick={() => setIsZoomed((z) => !z)}
              className={`relative aspect-square w-full rounded-3xl bg-[#111318] border border-white/10 overflow-hidden select-none ${
                isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
              }`}
            >
              <img
                src={product.images[activeImageIndex] || product.images[0]}
                alt={`${product.name} view ${activeImageIndex + 1}`}
                onError={(e) => applyImageFallbackOnError(e, product.shortName, product.shape)}
                style={
                  isZoomed
                    ? {
                        transformOrigin: `${zoomCoords.x}% ${zoomCoords.y}%`,
                        transform: 'scale(1.85)'
                      }
                    : undefined
                }
                className="w-full h-full object-cover object-center transition-transform duration-200"
              />

              {/* Gallery Controls Overlay */}
              <div
                className="absolute top-4 right-4 flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setIsZoomed((z) => !z)}
                  className="px-3 py-2 rounded-xl bg-[#08090B]/85 backdrop-blur-md border border-white/15 text-xs font-medium text-[#F5F5F7] inline-flex items-center gap-1.5 hover:bg-[#1A1C22]"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-[#38BDF8]" />
                  {isZoomed ? 'Exit Zoom' : 'Inspect Zoom'}
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="px-3 py-2 rounded-xl bg-[#08090B]/85 backdrop-blur-md border border-white/15 text-xs font-medium text-[#F5F5F7] inline-flex items-center gap-1.5 hover:bg-[#1A1C22]"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  Fullscreen
                </button>
              </div>

              <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-xl bg-[#08090B]/85 backdrop-blur-md border border-white/10 text-[11px] text-[#A1A1AA]">
                Supplied Flange Craft Product Photograph ({activeImageIndex + 1}/{product.images.length})
              </div>
            </div>

            {/* Thumbnails */}
            <div className="flex items-center gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => {
                    setActiveImageIndex(idx);
                    setIsZoomed(false);
                  }}
                  className={`relative w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all ${
                    activeImageIndex === idx
                      ? 'border-[#38BDF8] scale-105 shadow-lg shadow-[#38BDF8]/15'
                      : 'border-white/10 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.shortName} thumbnail ${idx + 1}`}
                    onError={(e) => applyImageFallbackOnError(e, product.shortName, product.shape)}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: Product Configuration & Actions (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="px-3 py-1 rounded-full bg-[#111318] border border-white/15 text-xs font-medium text-[#38BDF8]">
                  {product.categoryLabel}
                </span>
                <span className="text-xs font-mono text-[#A1A1AA]">SKU: {product.sku}</span>
              </div>

              <h1 className="font-display text-2xl sm:text-4xl font-bold text-[#F5F5F7] tracking-tight">
                {product.name}
              </h1>

              <p className="text-sm text-[#A1A1AA] mt-2.5 leading-relaxed">{product.summary}</p>
            </div>

            {/* Price & Availability Box */}
            <div className="p-5 rounded-2xl bg-[#111318] border border-white/10 flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#A1A1AA]">Price</div>
                {product.priceConfigured && product.price ? (
                  <div className="font-display text-2xl sm:text-3xl font-bold text-[#F5F5F7] mt-0.5">
                    {formatPrice(product)}
                  </div>
                ) : (
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-xs font-semibold text-[#38BDF8]">
                      Configurable Price State
                    </span>
                    <p className="text-[11px] text-[#A1A1AA] mt-1">
                      Configurable via Admin Dashboard • Place order or inquiry at checkout
                    </p>
                  </div>
                )}
              </div>

              <div className="text-right shrink-0">
                <div className="text-[11px] uppercase tracking-wider text-[#A1A1AA]">Availability</div>
                {product.inStock ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mt-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    In Stock ({product.inventory} units)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 mt-1">
                    Out of Stock
                  </span>
                )}
              </div>
            </div>

            {/* DYNAMIC VARIANT SELECTION (Prevents Invalid Combinations!) */}
            <div className="p-5 rounded-2xl bg-[#111318] border border-white/10 space-y-5">
              {/* 1. Product Series */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] block mb-2">
                  1. Signage Series
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSelectCategory('standard')}
                    className={`py-2.5 px-3.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      product.category === 'standard'
                        ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#F5F5F7]'
                        : 'bg-[#1A1C22] border-white/10 text-[#A1A1AA] hover:text-[#F5F5F7]'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Standard Flange
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectCategory('rotating')}
                    className={`py-2.5 px-3.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      product.category === 'rotating'
                        ? 'bg-[#38BDF8]/20 border-[#38BDF8] text-[#F5F5F7]'
                        : 'bg-[#1A1C22] border-white/10 text-[#A1A1AA] hover:text-[#F5F5F7]'
                    }`}
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Rotating Flange
                  </button>
                </div>
              </div>

              {/* 2. Shape Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
                    2. Shape
                  </label>
                  {product.category === 'rotating' && (
                    <span className="text-[11px] text-[#38BDF8]">Rotating series is Round only</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSelectShape('Round')}
                    className={`py-2.5 px-3.5 rounded-xl border text-xs font-semibold transition-all ${
                      product.shape === 'Round'
                        ? 'bg-[#F5F5F7] border-[#F5F5F7] text-[#08090B]'
                        : 'bg-[#1A1C22] border-white/10 text-[#A1A1AA] hover:text-[#F5F5F7]'
                    }`}
                  >
                    Round
                  </button>
                  <button
                    type="button"
                    disabled={product.category === 'rotating'}
                    onClick={() => handleSelectShape('Square')}
                    title={
                      product.category === 'rotating'
                        ? 'Rotating Lollipop Flange is manufactured exclusively in Round shape'
                        : undefined
                    }
                    className={`py-2.5 px-3.5 rounded-xl border text-xs font-semibold transition-all ${
                      product.category === 'rotating'
                        ? 'bg-[#1A1C22]/40 border-white/[0.04] text-[#A1A1AA]/30 cursor-not-allowed'
                        : product.shape === 'Square'
                        ? 'bg-[#F5F5F7] border-[#F5F5F7] text-[#08090B]'
                        : 'bg-[#1A1C22] border-white/10 text-[#A1A1AA] hover:text-[#F5F5F7]'
                    }`}
                  >
                    Square {product.category === 'rotating' ? '(Not Available)' : ''}
                  </button>
                </div>
              </div>

              {/* 3. Dimensions Selection */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] block mb-2">
                  3. Verified Dimensions
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['12 × 12 inches', '18 × 18 inches', '24 × 24 inches'] as const).map((sz) => {
                    const isValid = products.some(
                      (p) => p.category === product.category && p.shape === product.shape && p.size === sz
                    );
                    const isSelected = product.size === sz;
                    return (
                      <button
                        key={sz}
                        type="button"
                        disabled={!isValid}
                        onClick={() => handleSelectSize(sz)}
                        className={`py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all ${
                          !isValid
                            ? 'bg-[#1A1C22]/40 border-white/[0.04] text-[#A1A1AA]/30 cursor-not-allowed'
                            : isSelected
                            ? 'bg-[#F5F5F7] border-[#F5F5F7] text-[#08090B]'
                            : 'bg-[#1A1C22] border-white/10 text-[#A1A1AA] hover:text-[#F5F5F7]'
                        }`}
                      >
                        {sz.replace(' inches', '"')}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quantity & Cart Actions */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-xl bg-[#111318] border border-white/15">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-4 py-3 text-sm font-bold text-[#A1A1AA] hover:text-[#F5F5F7]"
                  >
                    −
                  </button>
                  <span className="px-4 py-3 text-sm font-semibold text-[#F5F5F7] min-w-[44px] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.inventory || 25, q + 1))}
                    className="px-4 py-3 text-sm font-bold text-[#A1A1AA] hover:text-[#F5F5F7]"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  disabled={!product.inStock}
                  onClick={() => addToCart(product, quantity)}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-[#1A1C22] hover:bg-[#242832] border border-white/15 text-sm font-display font-semibold text-[#F5F5F7] inline-flex items-center justify-center gap-2 transition-all"
                >
                  <ShoppingBag className="w-4 h-4 text-[#38BDF8]" />
                  Add to Cart
                </button>
              </div>

              <button
                type="button"
                disabled={!product.inStock}
                onClick={handleBuyNow}
                className="w-full py-4 px-6 rounded-xl bg-[#F5F5F7] hover:bg-white text-[#08090B] text-sm font-display font-bold inline-flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                <Zap className="w-4 h-4" />
                Buy Now
              </button>
            </div>

            {/* Trust Highlights */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-[#111318] border border-white/[0.06] flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="text-[#F5F5F7] font-semibold block">Commercial Packaging</span>
                  <span className="text-[#A1A1AA]">Protective transit casing</span>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#111318] border border-white/[0.06] flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#8B5CF6] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="text-[#F5F5F7] font-semibold block">Verified Variant</span>
                  <span className="text-[#A1A1AA]">Authentic Flange Craft build</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BELOW: Product Overview, Specifications, Product Images, Shipping & FAQ */}
        <div className="py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 border-b border-white/[0.08]">
          {/* Product Overview & Features (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="font-display text-2xl font-bold text-[#F5F5F7]">Product Overview</h2>
            <p className="text-sm sm:text-base text-[#A1A1AA] leading-relaxed">{product.description}</p>

            <div className="space-y-3 pt-2">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-[#F5F5F7]">
                Key Verified Features
              </h3>
              <ul className="space-y-2.5">
                {product.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-3 text-sm text-[#A1A1AA]">
                    <CheckCircle2 className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Shipping Info Box */}
            <div className="p-6 rounded-2xl bg-[#111318] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#F5F5F7]">
                <Info className="w-4 h-4 text-[#8B5CF6]" />
                Shipping &amp; Delivery Information
              </div>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                {siteConfig?.commerce?.shippingConfigurableNote ||
                  'Each Lollipop Flange sign is securely packed for commercial delivery. Shipping rates and dispatch timelines are configurable in the Flange Craft Admin Dashboard.'}
              </p>
            </div>
          </div>

          {/* Verified Specifications Table (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <h2 className="font-display text-2xl font-bold text-[#F5F5F7]">Verified Specifications</h2>
            <div className="rounded-2xl bg-[#111318] border border-white/10 divide-y divide-white/[0.07] overflow-hidden">
              {product.specifications.map((spec) => (
                <div key={spec.label} className="px-5 py-3.5 flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-[#A1A1AA]">{spec.label}</span>
                  <span className="font-semibold text-[#F5F5F7] text-right">{spec.value}</span>
                </div>
              ))}
              <div className="px-5 py-3.5 flex items-center justify-between text-xs sm:text-sm">
                <span className="text-[#A1A1AA]">SKU Code</span>
                <span className="font-mono text-[#38BDF8]">{product.sku}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product FAQ Section */}
        <div className="py-16 border-b border-white/[0.08] max-w-4xl">
          <h2 className="font-display text-2xl font-bold text-[#F5F5F7] mb-6">
            Product Questions &amp; Answers
          </h2>
          <div className="space-y-3">
            {faqs.slice(0, 4).map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div key={faq.id} className="rounded-2xl bg-[#111318] border border-white/10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4"
                  >
                    <span className="font-display text-sm font-semibold text-[#F5F5F7]">{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#A1A1AA] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs sm:text-sm text-[#A1A1AA] leading-relaxed border-t border-white/[0.05] pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Related Products */}
        <div className="pt-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl font-bold text-[#F5F5F7]">Other Verified Variants</h2>
            <Link to="/products" className="text-xs font-semibold text-[#38BDF8] hover:text-[#F5F5F7]">
              View All 6 Variants →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </div>
      </div>

      <LightboxModal
        images={product.images}
        initialIndex={activeImageIndex}
        isOpen={lightboxOpen}
        title={product.name}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
