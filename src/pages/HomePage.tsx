import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Layers,
  RotateCw,
  Sun,
  Eye,
  Maximize2,
  CheckCircle2,
  Compass,
  ShieldCheck
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { SEO } from '../components/SEO';

export function HomePage() {
  const { products, siteConfig, faqs } = useStore();
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');
  const [heroImageIndex, setHeroImageIndex] = useState(0);

  const heroShowcases = [
    {
      image: '/images/product/standard/18x18/round/image-2.jpg',
      label: 'Standard Round — 18 × 18 inches',
      slug: 'standard-round-18x18',
      tag: 'Internal Illuminated Round Flange'
    },
    {
      image: '/images/product/standard/18x18/square/image-2.jpg',
      label: 'Standard Square — 18 × 18 inches',
      slug: 'standard-square-18x18',
      tag: 'Projecting Square Storefront Flange'
    },
    {
      image: '/images/product/rotating/12x12/round/image-1.jpg',
      label: 'Rotating Round — 12 × 12 inches',
      slug: 'rotating-round-12x12',
      tag: 'Dynamic Rotating Round Flange'
    },
    {
      image: '/images/product/standard/24x24/round/image-1.jpg',
      label: 'Standard Round — 24 × 24 inches',
      slug: 'standard-round-24x24',
      tag: 'Large-Format 24 × 24" Flange'
    }
  ];

  const activeHero = heroShowcases[heroImageIndex] || heroShowcases[0];
  const focusProduct = products.find((p) => p.slug === 'standard-square-18x18') || products[0];

  return (
    <div className="bg-[#08090B] text-[#F5F5F7]">
      <SEO
        title="Flange Craft — Premium Illuminated Lollipop Flange Signage"
        description="Your Store Deserves to Be Seen. Premium illuminated projecting Lollipop Flange signage by Sunil Shukla and Team. Available in Standard Round, Standard Square, and Rotating Round."
        canonicalPath="/"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Flange Craft',
          founder: 'Sunil Shukla and Team',
          description: 'Premium illuminated projecting Lollipop Flange signage for commercial storefronts.',
          url: window.location.origin
        }}
      />

      {/* SECTION 1 — CINEMATIC HERO */}
      <section className="relative min-h-screen pt-28 pb-20 lg:pt-32 lg:pb-24 flex items-center overflow-hidden bg-architectural-grid border-b border-white/[0.07]">
        {/* Controlled Ambient Lighting */}
        <div className="pointer-events-none absolute -top-40 left-1/4 w-[540px] h-[540px] rounded-full bg-[#8B5CF6]/[0.09] blur-[140px]" />
        <div className="pointer-events-none absolute bottom-0 right-10 w-[480px] h-[480px] rounded-full bg-[#38BDF8]/[0.08] blur-[140px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            {/* Hero Editorial Copy (7 columns) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
              className="lg:col-span-7 space-y-7"
            >
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#111318] border border-white/10">
                <span className="h-2 w-2 rounded-full bg-[#38BDF8]" />
                <span className="text-xs font-medium tracking-wider uppercase text-[#A1A1AA]">
                  Flange Craft • Illuminated Commercial Signage
                </span>
              </div>

              <h1 className="font-display text-4xl sm:text-6xl lg:text-[68px] font-bold tracking-tight text-[#F5F5F7] leading-[1.04]">
                {siteConfig.tagline || 'Your Store Deserves to Be Seen.'}
              </h1>

              <p className="text-base sm:text-xl text-[#A1A1AA] max-w-2xl leading-relaxed font-normal">
                {siteConfig.heroSubtitle ||
                  'Premium illuminated projecting signage designed to make your storefront stand out.'}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#collections"
                  className="px-7 py-4 rounded-xl bg-[#F5F5F7] hover:bg-white text-[#08090B] font-display font-semibold text-sm inline-flex items-center gap-2.5 transition-all shadow-lg shadow-white/5"
                >
                  Explore Collection
                  <ArrowRight className="w-4 h-4" />
                </a>
                <Link
                  to="/products"
                  className="px-7 py-4 rounded-xl bg-[#111318] hover:bg-[#1A1C22] text-[#F5F5F7] border border-white/15 font-display font-semibold text-sm inline-flex items-center gap-2.5 transition-all"
                >
                  View Products
                  <ArrowUpRight className="w-4 h-4 text-[#38BDF8]" />
                </Link>
              </div>

              {/* Verified Variant Matrix Summary */}
              <div className="pt-6 border-t border-white/[0.08] grid grid-cols-3 gap-4 max-w-xl">
                <div>
                  <div className="text-xs uppercase tracking-wider text-[#A1A1AA]">Standard Series</div>
                  <div className="font-display text-sm sm:text-base font-semibold text-[#F5F5F7] mt-1">
                    Round &amp; Square
                  </div>
                  <div className="text-xs text-[#A1A1AA] mt-0.5">18 × 18" • 24 × 24"</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-[#A1A1AA]">Rotating Series</div>
                  <div className="font-display text-sm sm:text-base font-semibold text-[#F5F5F7] mt-1">
                    Round Exclusive
                  </div>
                  <div className="text-xs text-[#A1A1AA] mt-0.5">12 × 12" • 24 × 24"</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-[#A1A1AA]">Visibility</div>
                  <div className="font-display text-sm sm:text-base font-semibold text-[#F5F5F7] mt-1">
                    Double-Sided
                  </div>
                  <div className="text-xs text-[#A1A1AA] mt-0.5">Internal Illumination</div>
                </div>
              </div>
            </motion.div>

            {/* Hero Dominant Illuminated Product Visual (5 columns) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.75, delay: 0.1 }}
              className="lg:col-span-5"
            >
              <div className="relative rounded-3xl bg-[#111318] border border-white/15 p-3 sm:p-4 shadow-2xl shadow-black/90">
                <div className="relative aspect-[4/4.3] rounded-2xl overflow-hidden bg-[#1A1C22]">
                  <img
                    src={activeHero.image}
                    alt={activeHero.label}
                    className="w-full h-full object-cover object-center transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#08090B]/90 via-transparent to-black/20" />

                  <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-[#08090B]/80 backdrop-blur-md border border-white/15 text-[11px] font-medium text-[#38BDF8]">
                    {activeHero.tag}
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-widest text-[#A1A1AA]">
                        Verified Flange Craft Unit
                      </div>
                      <div className="font-display text-lg font-bold text-[#F5F5F7]">
                        {activeHero.label}
                      </div>
                    </div>
                    <Link
                      to={`/product/${activeHero.slug}`}
                      className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] text-[#08090B] text-xs font-semibold inline-flex items-center gap-1 shrink-0 hover:bg-white transition-colors"
                    >
                      Inspect <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Switchable Real Photography Thumbnails */}
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {heroShowcases.map((item, idx) => (
                    <button
                      key={item.slug}
                      type="button"
                      onClick={() => setHeroImageIndex(idx)}
                      className={`relative rounded-xl overflow-hidden aspect-square border transition-all ${
                        heroImageIndex === idx
                          ? 'border-[#38BDF8] ring-1 ring-[#38BDF8]/50'
                          : 'border-white/10 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={item.image} alt={item.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — BRAND INTRODUCTION */}
      <section className="py-24 lg:py-32 border-b border-white/[0.07]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8B5CF6]">
                01 / Architectural Presence
              </div>
              <h2 className="font-display text-3xl sm:text-5xl font-bold text-[#F5F5F7] tracking-tight leading-[1.1]">
                {siteConfig.introHeadline || 'Visibility. Designed Differently.'}
              </h2>
              <p className="text-base sm:text-lg text-[#A1A1AA] leading-relaxed max-w-2xl">
                {siteConfig.introText ||
                  'Flange Craft offers illuminated projecting signage for businesses seeking professional storefront visibility. Mounted perpendicular to your building wall, every Lollipop Flange sign presents your identity clearly to approaching foot and street traffic from both directions.'}
              </p>
              <div className="pt-2 flex flex-wrap gap-6 text-xs text-[#A1A1AA]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#8B5CF6]" />
                  <span>Projecting Wall-Mounted Design</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#38BDF8]" />
                  <span>Internal Illumination</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#F5F5F7]" />
                  <span>6 Verified Commercial Variants</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              <div className="rounded-2xl overflow-hidden bg-[#111318] border border-white/10 aspect-[4/5]">
                <img
                  src="/images/product/standard/18x18/round/image-1.jpg"
                  alt="Standard Round Lollipop Flange Sign"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-2xl overflow-hidden bg-[#111318] border border-white/10 aspect-[4/5] mt-8">
                <img
                  src="/images/product/rotating/24x24/round/image-1.jpg"
                  alt="Rotating Round Lollipop Flange Sign"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — PRODUCT COLLECTIONS */}
      <section id="collections" className="py-24 lg:py-28 bg-[#111318]/50 border-b border-white/[0.07]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#38BDF8] mb-3">
                02 / Primary Collections
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F5F7]">
                Two Distinct Signage Systems
              </h2>
            </div>
            <p className="text-sm text-[#A1A1AA] max-w-md">
              Choose between our classic stationary Standard Lollipop Flange in Round or Square, or our dynamic Rotating Lollipop Flange crafted exclusively in Round.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Standard Collection Card */}
            <Link
              to="/products/standard"
              className="group relative rounded-3xl bg-[#111318] border border-white/10 hover:border-[#8B5CF6]/50 overflow-hidden flex flex-col justify-between transition-all duration-500"
            >
              <div className="relative aspect-[16/11] w-full overflow-hidden bg-[#1A1C22]">
                <img
                  src="/images/product/standard/24x24/round/image-1.jpg"
                  alt="Standard Lollipop Flange Collection"
                  loading="lazy"
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111318] via-[#111318]/20 to-transparent" />
                <div className="absolute top-5 left-5 px-3.5 py-1.5 rounded-full bg-[#08090B]/85 backdrop-blur-md border border-white/15 text-xs font-medium text-[#F5F5F7] inline-flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  4 Variants • Round &amp; Square
                </div>
              </div>

              <div className="p-8 pt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div className="space-y-2 max-w-md">
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#F5F5F7]">
                    Standard Lollipop Flange
                  </h3>
                  <p className="text-sm text-[#A1A1AA] leading-relaxed">
                    A classic illuminated projecting sign designed for storefront visibility. Available in Round (18 × 18", 24 × 24") and Square (18 × 18", 24 × 24").
                  </p>
                </div>
                <span className="px-5 py-3 rounded-xl bg-[#F5F5F7] text-[#08090B] text-xs font-semibold inline-flex items-center gap-2 shrink-0 group-hover:bg-white transition-colors">
                  Discover Collection
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
            </Link>

            {/* Rotating Collection Card */}
            <Link
              to="/products/rotating"
              className="group relative rounded-3xl bg-[#111318] border border-white/10 hover:border-[#38BDF8]/50 overflow-hidden flex flex-col justify-between transition-all duration-500"
            >
              <div className="relative aspect-[16/11] w-full overflow-hidden bg-[#1A1C22]">
                <img
                  src="/images/product/rotating/12x12/round/image-1.jpg"
                  alt="Rotating Lollipop Flange Collection"
                  loading="lazy"
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111318] via-[#111318]/20 to-transparent" />
                <div className="absolute top-5 left-5 px-3.5 py-1.5 rounded-full bg-[#08090B]/85 backdrop-blur-md border border-white/15 text-xs font-medium text-[#F5F5F7] inline-flex items-center gap-2">
                  <RotateCw className="w-3.5 h-3.5 text-[#38BDF8]" />
                  2 Variants • Round Exclusive
                </div>
              </div>

              <div className="p-8 pt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div className="space-y-2 max-w-md">
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#F5F5F7]">
                    Rotating Lollipop Flange
                  </h3>
                  <p className="text-sm text-[#A1A1AA] leading-relaxed">
                    A rotating round illuminated signage option engineered to capture attention through rotational motion. Available in Round 12 × 12" and Round 24 × 24".
                  </p>
                </div>
                <span className="px-5 py-3 rounded-xl bg-[#F5F5F7] text-[#08090B] text-xs font-semibold inline-flex items-center gap-2 shrink-0 group-hover:bg-white transition-colors">
                  Discover Collection
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 4 — FEATURED PRODUCTS */}
      <section className="py-24 lg:py-28 border-b border-white/[0.07]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8B5CF6] mb-3">
                03 / Complete Lineup
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F5F7]">
                Featured Signage Variants
              </h2>
            </div>
            <Link
              to="/products"
              className="text-sm font-medium text-[#38BDF8] hover:text-[#F5F5F7] inline-flex items-center gap-1.5 transition-colors"
            >
              Filter &amp; Compare All 6 Variants <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — PRODUCT IN FOCUS */}
      {focusProduct && (
        <section className="py-24 lg:py-32 bg-[#111318] border-b border-white/[0.07] relative overflow-hidden">
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#8B5CF6]/[0.06] blur-[150px]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl overflow-hidden bg-[#1A1C22] border border-white/10 aspect-[4/4.5]">
                    <img
                      src="/images/product/standard/18x18/square/image-2.jpg"
                      alt={focusProduct.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="rounded-2xl overflow-hidden bg-[#1A1C22] border border-white/10 aspect-[4/4.5]">
                    <img
                      src="/images/product/standard/18x18/square/image-1.jpg"
                      alt={`${focusProduct.name} unprinted blank housing`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1C22] border border-white/10 text-xs font-medium text-[#38BDF8]">
                  Product in Focus
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F5F7] leading-tight">
                  {focusProduct.name}
                </h2>
                <p className="text-sm sm:text-base text-[#A1A1AA] leading-relaxed">
                  {focusProduct.description}
                </p>

                <ul className="space-y-3 pt-2">
                  {focusProduct.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-3 text-sm text-[#F5F5F7]">
                      <CheckCircle2 className="w-4 h-4 text-[#8B5CF6] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4 flex flex-wrap items-center gap-4">
                  <Link
                    to={`/product/${focusProduct.slug}`}
                    className="px-6 py-3.5 rounded-xl bg-[#F5F5F7] hover:bg-white text-[#08090B] font-display text-sm font-semibold inline-flex items-center gap-2 transition-colors"
                  >
                    View Product
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/products/standard"
                    className="px-5 py-3.5 rounded-xl bg-[#1A1C22] hover:bg-[#232730] border border-white/10 text-sm font-medium text-[#F5F5F7] transition-colors"
                  >
                    Explore Standard Series
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 6 — STANDARD VS ROTATING */}
      <section className="py-24 lg:py-28 border-b border-white/[0.07]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-14">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#38BDF8] mb-3">
              04 / Specification Comparison
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F5F7]">
              Standard vs. Rotating Lollipop Flange
            </h2>
            <p className="text-sm text-[#A1A1AA] mt-3 leading-relaxed">
              Verified structural and variant differences between our two commercial signage families.
            </p>
          </div>

          <div className="rounded-3xl bg-[#111318] border border-white/10 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
              {/* Column 1: Attributes */}
              <div className="p-7 lg:p-9 bg-[#1A1C22]/40 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
                    Architecture Guide
                  </div>
                  <h3 className="font-display text-xl font-bold text-[#F5F5F7] mt-2">
                    Select the Right Format for Your Facade
                  </h3>
                  <p className="text-xs text-[#A1A1AA] mt-3 leading-relaxed">
                    Both series feature internal illumination and double-sided projecting wall-mount construction.
                  </p>
                </div>
                <div className="pt-8">
                  <Link
                    to="/products"
                    className="text-xs font-semibold text-[#38BDF8] hover:text-[#F5F5F7] inline-flex items-center gap-1"
                  >
                    Compare in Catalogue <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Column 2: Standard */}
              <div className="p-7 lg:p-9 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/40 text-xs font-semibold text-[#F5F5F7]">
                    Standard Lollipop Flange
                  </span>
                  <Layers className="w-5 h-5 text-[#8B5CF6]" />
                </div>

                <div className="space-y-4 text-sm">
                  <div className="pb-3 border-b border-white/[0.06]">
                    <span className="text-xs text-[#A1A1AA] block">Available Shapes</span>
                    <span className="font-semibold text-[#F5F5F7]">Round &amp; Square</span>
                  </div>
                  <div className="pb-3 border-b border-white/[0.06]">
                    <span className="text-xs text-[#A1A1AA] block">Verified Dimensions</span>
                    <span className="font-semibold text-[#F5F5F7]">18 × 18 inches &amp; 24 × 24 inches</span>
                  </div>
                  <div className="pb-3 border-b border-white/[0.06]">
                    <span className="text-xs text-[#A1A1AA] block">Presentation Mode</span>
                    <span className="font-semibold text-[#F5F5F7]">Stationary Projecting Display</span>
                  </div>
                  <div className="pb-3 border-b border-white/[0.06]">
                    <span className="text-xs text-[#A1A1AA] block">Illumination</span>
                    <span className="font-semibold text-[#F5F5F7]">Internal Double-Sided Illumination</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#A1A1AA] block">Total Catalogue Variants</span>
                    <span className="font-semibold text-[#F5F5F7]">4 Variants (2 Round, 2 Square)</span>
                  </div>
                </div>
              </div>

              {/* Column 3: Rotating */}
              <div className="p-7 lg:p-9 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8]/40 text-xs font-semibold text-[#F5F5F7]">
                    Rotating Lollipop Flange
                  </span>
                  <RotateCw className="w-5 h-5 text-[#38BDF8]" />
                </div>

                <div className="space-y-4 text-sm">
                  <div className="pb-3 border-b border-white/[0.06]">
                    <span className="text-xs text-[#A1A1AA] block">Available Shapes</span>
                    <span className="font-semibold text-[#38BDF8]">Round Only (Never Square)</span>
                  </div>
                  <div className="pb-3 border-b border-white/[0.06]">
                    <span className="text-xs text-[#A1A1AA] block">Verified Dimensions</span>
                    <span className="font-semibold text-[#F5F5F7]">12 × 12 inches &amp; 24 × 24 inches</span>
                  </div>
                  <div className="pb-3 border-b border-white/[0.06]">
                    <span className="text-xs text-[#A1A1AA] block">Presentation Mode</span>
                    <span className="font-semibold text-[#F5F5F7]">Rotating Dynamic Display</span>
                  </div>
                  <div className="pb-3 border-b border-white/[0.06]">
                    <span className="text-xs text-[#A1A1AA] block">Illumination</span>
                    <span className="font-semibold text-[#F5F5F7]">Internal Double-Sided Illumination</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#A1A1AA] block">Total Catalogue Variants</span>
                    <span className="font-semibold text-[#F5F5F7]">2 Variants (Round 12×12", Round 24×24")</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 — PRODUCT BENEFITS */}
      <section className="py-24 lg:py-28 bg-[#111318]/40 border-b border-white/[0.07]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-14">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8B5CF6] mb-3">
              05 / Verified Advantages
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F5F7]">
              Engineered for Storefront Clarity
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Sun,
                title: 'Illuminated Signage',
                desc: 'Internal illumination keeps your brand graphic bright, legible, and inviting across daytime, dusk, and nighttime commercial hours.'
              },
              {
                icon: Eye,
                title: 'Double-Sided Visibility',
                desc: 'Dual display faces ensure approaching pedestrians and motorists see your signage clearly from either direction down the street.'
              },
              {
                icon: Compass,
                title: 'Projecting Storefront Design',
                desc: 'Wall-mounted perpendicular flange projection breaks out of flat facade clutter so your business stands out in dense retail corridors.'
              },
              {
                icon: Maximize2,
                title: 'Multiple Verified Sizes',
                desc: 'Available in 12 × 12 inches (Rotating Round), 18 × 18 inches (Standard Round & Square), and 24 × 24 inches (Standard & Rotating).'
              },
              {
                icon: RotateCw,
                title: 'Standard & Rotating Options',
                desc: 'Select classic stationary projection in Round or Square, or opt for dynamic rotational movement in our Round Rotating series.'
              },
              {
                icon: ShieldCheck,
                title: 'Business Visibility & Trust',
                desc: 'Clean molded framing and sturdy mounting brackets present your storefront with professional permanence and visual authority.'
              }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="p-7 rounded-2xl bg-[#111318] border border-white/[0.08] hover:border-white/20 transition-colors space-y-4"
                >
                  <div className="h-11 w-11 rounded-xl bg-[#1A1C22] border border-white/10 flex items-center justify-center text-[#38BDF8]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#F5F5F7]">{item.title}</h3>
                  <p className="text-sm text-[#A1A1AA] leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 8 — BRAND STORY */}
      <section className="py-24 lg:py-32 border-b border-white/[0.07]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#38BDF8]">
                06 / Brand Story
              </div>
              <h2 className="font-display text-3xl sm:text-5xl font-bold text-[#F5F5F7] tracking-tight">
                {siteConfig.storyHeadline || 'Built to Stand Out.'}
              </h2>
              <p className="text-base sm:text-lg text-[#A1A1AA] leading-relaxed">
                {siteConfig.storyText ||
                  'Led by Sunil Shukla and Team, Flange Craft is dedicated to illuminated Lollipop Flange signage that elevates storefront presentation with honest craftsmanship and product clarity.'}
              </p>
              <div className="p-5 rounded-2xl bg-[#111318] border border-white/10 space-y-1">
                <div className="text-xs uppercase tracking-wider text-[#A1A1AA]">Leadership &amp; Stewardship</div>
                <div className="font-display text-base font-bold text-[#F5F5F7]">
                  {siteConfig.ownerName || 'Sunil Shukla and Team'}
                </div>
              </div>
              <div className="pt-2">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#F5F5F7] hover:text-[#38BDF8] transition-colors"
                >
                  Read Our Full Brand Philosophy <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <img
                  src="/images/product/standard/24x24/square/image-1.jpg"
                  alt="Standard Square 24x24 Sign"
                  loading="lazy"
                  className="rounded-2xl border border-white/10 w-full aspect-square object-cover bg-[#111318]"
                />
                <img
                  src="/images/product/standard/24x24/round/image-2.jpg"
                  alt="Standard Round 24x24 Sign"
                  loading="lazy"
                  className="rounded-2xl border border-white/10 w-full aspect-[4/3] object-cover bg-[#111318]"
                />
              </div>
              <div className="space-y-4 pt-6">
                <img
                  src="/images/product/rotating/12x12/round/image-1.jpg"
                  alt="Rotating Round 12x12 Sign"
                  loading="lazy"
                  className="rounded-2xl border border-white/10 w-full aspect-[4/3] object-cover bg-[#111318]"
                />
                <img
                  src="/images/product/standard/18x18/round/image-2.jpg"
                  alt="Standard Round 18x18 Illuminated Sign"
                  loading="lazy"
                  className="rounded-2xl border border-white/10 w-full aspect-square object-cover bg-[#111318]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9 — FAQ PREVIEW */}
      <section className="py-24 lg:py-28 bg-[#111318]/40 border-b border-white/[0.07]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8B5CF6] mb-3">
                07 / Product &amp; Ordering Clarity
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F5F7]">
                Frequently Asked Questions
              </h2>
            </div>
            <Link
              to="/faq"
              className="text-sm font-medium text-[#38BDF8] hover:text-[#F5F5F7] inline-flex items-center gap-1"
            >
              View All FAQs <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {faqs.slice(0, 6).map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-2xl bg-[#111318] border border-white/[0.08] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-0.5 rounded-md bg-[#1A1C22] border border-white/10 text-[11px] font-medium text-[#38BDF8]">
                        {faq.category}
                      </span>
                      <span className="font-display text-sm sm:text-base font-semibold text-[#F5F5F7]">
                        {faq.question}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-[#A1A1AA] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#F5F5F7]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-sm text-[#A1A1AA] leading-relaxed border-t border-white/[0.05]">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 10 — FINAL CTA */}
      <section className="py-24 lg:py-32 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[#8B5CF6]/[0.06] to-transparent" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111318] border border-white/10 text-xs text-[#A1A1AA]">
            <span>Flange Craft • Sunil Shukla and Team</span>
          </div>
          <h2 className="font-display text-4xl sm:text-6xl font-bold text-[#F5F5F7] tracking-tight">
            Make Your Business Visible.
          </h2>
          <p className="text-base sm:text-lg text-[#A1A1AA] max-w-2xl mx-auto leading-relaxed">
            Explore our six verified Standard and Rotating Lollipop Flange signage variants or connect with our team for storefront signage inquiries.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/products"
              className="px-8 py-4 rounded-xl bg-[#F5F5F7] hover:bg-white text-[#08090B] font-display font-semibold text-sm inline-flex items-center gap-2 transition-all"
            >
              Explore Products
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 rounded-xl bg-[#111318] hover:bg-[#1A1C22] border border-white/15 text-[#F5F5F7] font-display font-semibold text-sm inline-flex items-center gap-2 transition-all"
            >
              Contact Us
              <ArrowUpRight className="w-4 h-4 text-[#38BDF8]" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
