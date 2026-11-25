import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, RotateCcw, Layers, RotateCw, ArrowUpRight, Info } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { SEO } from '../components/SEO';
import { Product } from '../types';

interface ProductsPageProps {
  mode: 'all' | 'standard' | 'rotating';
}

function getSizeRank(size: string): number {
  if (size.includes('12')) return 12;
  if (size.includes('18')) return 18;
  if (size.includes('24')) return 24;
  return 20;
}

export function ProductsPage({ mode }: ProductsPageProps) {
  const { products } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'standard' | 'rotating'>(mode);
  const [selectedShape, setSelectedShape] = useState<'all' | 'Round' | 'Square'>('all');
  const [selectedSize, setSelectedSize] = useState<'all' | '12 × 12 inches' | '18 × 18 inches' | '24 × 24 inches'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  useEffect(() => {
    setSelectedCategory(mode);
    setSelectedShape('all');
    setSelectedSize('all');
    setSearchQuery('');
  }, [mode]);

  // Enforce strict rule: if Rotating is selected, Square is never valid
  useEffect(() => {
    if (selectedCategory === 'rotating' && selectedShape === 'Square') {
      setSelectedShape('Round');
    }
    if (selectedCategory === 'rotating' && selectedSize === '18 × 18 inches') {
      setSelectedSize('all');
    }
    if (selectedCategory === 'standard' && selectedSize === '12 × 12 inches') {
      setSelectedSize('all');
    }
  }, [selectedCategory, selectedShape, selectedSize]);

  const filteredProducts = useMemo(() => {
    const base = products.filter((p) => {
      // Never allow rotating square even if someone tampered with data
      if (p.category === 'rotating' && p.shape !== 'Round') return false;

      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (selectedShape !== 'all' && p.shape !== selectedShape) return false;
      if (selectedSize !== 'all' && p.size !== selectedSize) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          p.name.toLowerCase().includes(q) ||
          p.shortName.toLowerCase().includes(q) ||
          p.categoryLabel.toLowerCase().includes(q) ||
          p.shape.toLowerCase().includes(q) ||
          p.size.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    const sorted = [...base];
    if (sortBy === 'featured') {
      sorted.sort((a, b) => a.sortOrder - b.sortOrder);
    } else if (sortBy === 'price-asc') {
      sorted.sort((a: Product, b: Product) => {
        const aPrice = a.priceConfigured && a.price ? a.price : getSizeRank(a.size);
        const bPrice = b.priceConfigured && b.price ? b.price : getSizeRank(b.size);
        return aPrice - bPrice;
      });
    } else if (sortBy === 'price-desc') {
      sorted.sort((a: Product, b: Product) => {
        const aPrice = a.priceConfigured && a.price ? a.price : getSizeRank(a.size);
        const bPrice = b.priceConfigured && b.price ? b.price : getSizeRank(b.size);
        return bPrice - aPrice;
      });
    }
    return sorted;
  }, [products, selectedCategory, selectedShape, selectedSize, searchQuery, sortBy]);

  const resetFilters = () => {
    setSelectedCategory(mode);
    setSelectedShape('all');
    setSelectedSize('all');
    setSearchQuery('');
    setSortBy('featured');
  };

  if (mode === 'standard') {
    return (
      <div className="bg-[#08090B] min-h-screen pt-28 pb-24">
        <SEO
          title="Standard Lollipop Flange Signage — Round & Square (18×18 & 24×24)"
          description="Explore Flange Craft Standard Lollipop Flange illuminated projecting signs. Available in Round 18×18, Round 24×24, Square 18×18, and Square 24×24 inches."
          canonicalPath="/products/standard"
        />

        {/* Category Hero */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
          <div className="rounded-3xl bg-[#111318] border border-white/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/40 text-xs font-semibold text-[#F5F5F7]">
                  <Layers className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  Standard Collection • 4 Verified Variants
                </div>
                <h1 className="font-display text-3xl sm:text-5xl font-bold text-[#F5F5F7] tracking-tight">
                  Standard Lollipop Flange
                </h1>
                <p className="text-sm sm:text-base text-[#A1A1AA] leading-relaxed max-w-xl">
                  Our stationary projecting wall-mounted illuminated signage collection. Designed for permanent double-sided storefront visibility and available in both Round and Square formats across 18 × 18 inches and 24 × 24 inches dimensions.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10">
                <div className="p-3 rounded-xl bg-[#1A1C22]/70 border border-white/[0.06]">
                  <div className="text-[11px] text-[#A1A1AA]">Variant 01</div>
                  <div className="text-xs font-semibold text-[#F5F5F7] mt-0.5">Round 18 × 18"</div>
                </div>
                <div className="p-3 rounded-xl bg-[#1A1C22]/70 border border-white/[0.06]">
                  <div className="text-[11px] text-[#A1A1AA]">Variant 02</div>
                  <div className="text-xs font-semibold text-[#F5F5F7] mt-0.5">Round 24 × 24"</div>
                </div>
                <div className="p-3 rounded-xl bg-[#1A1C22]/70 border border-white/[0.06]">
                  <div className="text-[11px] text-[#A1A1AA]">Variant 03</div>
                  <div className="text-xs font-semibold text-[#F5F5F7] mt-0.5">Square 18 × 18"</div>
                </div>
                <div className="p-3 rounded-xl bg-[#1A1C22]/70 border border-white/[0.06]">
                  <div className="text-[11px] text-[#A1A1AA]">Variant 04</div>
                  <div className="text-xs font-semibold text-[#F5F5F7] mt-0.5">Square 24 × 24"</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 gap-2 p-4 bg-[#1A1C22]/50">
              <img
                src="/images/product/standard/18x18/round/image-2.jpg"
                alt="Standard Round 18x18"
                className="w-full h-48 sm:h-full object-cover rounded-2xl border border-white/10"
              />
              <img
                src="/images/product/standard/18x18/square/image-2.jpg"
                alt="Standard Square 18x18"
                className="w-full h-48 sm:h-full object-cover rounded-2xl border border-white/10"
              />
            </div>
          </div>
        </section>

        {/* Filter Bar for Standard */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#111318] border border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-[#A1A1AA] mr-1">Shape:</span>
              {(['all', 'Round', 'Square'] as const).map((shape) => (
                <button
                  key={shape}
                  type="button"
                  onClick={() => setSelectedShape(shape)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    selectedShape === shape
                      ? 'bg-[#F5F5F7] text-[#08090B]'
                      : 'bg-[#1A1C22] text-[#A1A1AA] hover:text-[#F5F5F7]'
                  }`}
                >
                  {shape === 'all' ? 'All Shapes' : shape}
                </button>
              ))}

              <span className="text-xs font-medium text-[#A1A1AA] ml-3 mr-1">Size:</span>
              {(['all', '18 × 18 inches', '24 × 24 inches'] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setSelectedSize(sz)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    selectedSize === sz
                      ? 'bg-[#8B5CF6] text-white'
                      : 'bg-[#1A1C22] text-[#A1A1AA] hover:text-[#F5F5F7]'
                  }`}
                >
                  {sz === 'all' ? 'All Sizes' : sz}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc')}
                aria-label="Sort Standard Products"
                className="bg-[#1A1C22] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-[#F5F5F7] focus:outline-none"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-asc">Sort: Price Low to High</option>
                <option value="price-desc">Sort: Price High to Low</option>
              </select>
            </div>
          </div>
        </section>

        {/* Product Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Verified Specs & CTA */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-[#111318] border border-white/10 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="font-display text-xl font-bold text-[#F5F5F7]">
                Looking for Dynamic Rotational Motion?
              </h2>
              <p className="text-sm text-[#A1A1AA] mt-1">
                Explore our Rotating Lollipop Flange signs available in Round 12 × 12 inches and Round 24 × 24 inches.
              </p>
            </div>
            <Link
              to="/products/rotating"
              className="px-6 py-3.5 rounded-xl bg-[#1A1C22] hover:bg-[#232730] border border-white/15 text-xs font-semibold text-[#F5F5F7] inline-flex items-center gap-2 shrink-0"
            >
              View Rotating Collection <ArrowUpRight className="w-4 h-4 text-[#38BDF8]" />
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (mode === 'rotating') {
    return (
      <div className="bg-[#08090B] min-h-screen pt-28 pb-24">
        <SEO
          title="Rotating Lollipop Flange Signage — Round 12×12 & 24×24 Inches"
          description="Explore Flange Craft Rotating Lollipop Flange illuminated projecting signs. Engineered exclusively in Round shape: 12 × 12 inches and 24 × 24 inches."
          canonicalPath="/products/rotating"
        />

        {/* Rotating Category Hero */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
          <div className="rounded-3xl bg-[#111318] border border-white/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8]/40 text-xs font-semibold text-[#F5F5F7]">
                  <RotateCw className="w-3.5 h-3.5 text-[#38BDF8]" />
                  Rotating Collection • Round Format Exclusive
                </div>
                <h1 className="font-display text-3xl sm:text-5xl font-bold text-[#F5F5F7] tracking-tight">
                  Rotating Lollipop Flange
                </h1>
                <p className="text-sm sm:text-base text-[#A1A1AA] leading-relaxed max-w-xl">
                  Dynamic illuminated projecting signage that combines internal illumination with rotational motion. Manufactured exclusively in a balanced Round profile across two verified sizes: 12 × 12 inches and 24 × 24 inches.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#1A1C22]/80 border border-[#38BDF8]/25 flex items-start gap-3">
                <Info className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
                <p className="text-xs text-[#F5F5F7] leading-relaxed">
                  <strong>Verified Specification Note:</strong> Rotating Lollipop Flange signs are available in{' '}
                  <span className="text-[#38BDF8] font-semibold">Round shape only</span> (12 × 12 inches and 24 × 24 inches). Square rotating signs are not offered.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 gap-2 p-4 bg-[#1A1C22]/50">
              <img
                src="/images/product/rotating/12x12/round/image-1.jpg"
                alt="Rotating Round 12x12"
                className="w-full h-48 sm:h-full object-cover rounded-2xl border border-white/10"
              />
              <img
                src="/images/product/rotating/24x24/round/image-1.jpg"
                alt="Rotating Round 24x24"
                className="w-full h-48 sm:h-full object-cover rounded-2xl border border-white/10"
              />
            </div>
          </div>
        </section>

        {/* Filter Bar for Rotating */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#111318] border border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-[#A1A1AA] mr-1">Available Sizes (Round Only):</span>
              {(['all', '12 × 12 inches', '24 × 24 inches'] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setSelectedSize(sz)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    selectedSize === sz
                      ? 'bg-[#38BDF8] text-[#08090B] font-semibold'
                      : 'bg-[#1A1C22] text-[#A1A1AA] hover:text-[#F5F5F7]'
                  }`}
                >
                  {sz === 'all' ? 'All Rotating Sizes' : sz}
                </button>
              ))}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc')}
              aria-label="Sort Rotating Products"
              className="bg-[#1A1C22] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-[#F5F5F7] focus:outline-none"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-asc">Sort: Price Low to High</option>
              <option value="price-desc">Sort: Price High to Low</option>
            </select>
          </div>
        </section>

        {/* Product Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* CTA to Standard */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-[#111318] border border-white/10 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="font-display text-xl font-bold text-[#F5F5F7]">
                Need a Stationary Round or Square Sign?
              </h2>
              <p className="text-sm text-[#A1A1AA] mt-1">
                Explore our Standard Lollipop Flange collection in 18 × 18 inches and 24 × 24 inches.
              </p>
            </div>
            <Link
              to="/products/standard"
              className="px-6 py-3.5 rounded-xl bg-[#1A1C22] hover:bg-[#232730] border border-white/15 text-xs font-semibold text-[#F5F5F7] inline-flex items-center gap-2 shrink-0"
            >
              View Standard Collection <ArrowUpRight className="w-4 h-4 text-[#8B5CF6]" />
            </Link>
          </div>
        </section>
      </div>
    );
  }

  // ALL PRODUCTS PAGE (/products)
  return (
    <div className="bg-[#08090B] min-h-screen pt-28 pb-24">
      <SEO
        title="All Products — Illuminated Lollipop Flange Signage Catalogue"
        description="Browse all six verified Flange Craft illuminated Lollipop Flange variants: Standard Round, Standard Square, and Rotating Round signage."
        canonicalPath="/products"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading & Intro */}
        <div className="pb-10 border-b border-white/[0.08] flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#38BDF8]">
              Complete Commercial Catalogue
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-bold text-[#F5F5F7] tracking-tight">
              Illuminated Lollipop Flange Signs
            </h1>
            <p className="text-sm sm:text-base text-[#A1A1AA] max-w-2xl leading-relaxed">
              Explore our complete lineup of six verified variants across Standard Lollipop Flange (Round &amp; Square) and Rotating Lollipop Flange (Round Exclusive).
            </p>
          </div>

          {/* Category Quick Selector */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-[#F5F5F7] text-[#08090B]'
                  : 'bg-[#111318] text-[#A1A1AA] border border-white/10 hover:text-[#F5F5F7]'
              }`}
            >
              All Variants (6)
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('standard')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all ${
                selectedCategory === 'standard'
                  ? 'bg-[#8B5CF6] text-white'
                  : 'bg-[#111318] text-[#A1A1AA] border border-white/10 hover:text-[#F5F5F7]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Standard (4)
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('rotating')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all ${
                selectedCategory === 'rotating'
                  ? 'bg-[#38BDF8] text-[#08090B]'
                  : 'bg-[#111318] text-[#A1A1AA] border border-white/10 hover:text-[#F5F5F7]'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              Rotating (2)
            </button>
          </div>
        </div>

        {/* Filters, Search & Sort Controls */}
        <div className="my-8 p-5 rounded-2xl bg-[#111318] border border-white/10 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Search Input */}
            <div className="md:col-span-4 relative">
              <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by shape, size (12x12, 18x18, 24x24)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1A1C22] border border-white/10 text-xs text-[#F5F5F7] placeholder-[#A1A1AA] focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            {/* Shape Filter */}
            <div className="md:col-span-3 flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-[#A1A1AA] mr-1">Shape:</span>
              {(['all', 'Round', 'Square'] as const).map((shape) => {
                const disabled = selectedCategory === 'rotating' && shape === 'Square';
                return (
                  <button
                    key={shape}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSelectedShape(shape)}
                    title={disabled ? 'Rotating Lollipop Flange signs are available in Round shape only' : undefined}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      disabled
                        ? 'opacity-30 cursor-not-allowed bg-[#1A1C22] text-[#A1A1AA]'
                        : selectedShape === shape
                        ? 'bg-[#F5F5F7] text-[#08090B]'
                        : 'bg-[#1A1C22] text-[#A1A1AA] hover:text-[#F5F5F7]'
                    }`}
                  >
                    {shape === 'all' ? 'All' : shape}
                  </button>
                );
              })}
            </div>

            {/* Size Filter */}
            <div className="md:col-span-3 flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-[#A1A1AA] mr-1">Size:</span>
              {(
                [
                  { value: 'all', label: 'All' },
                  { value: '12 × 12 inches', label: '12×12"' },
                  { value: '18 × 18 inches', label: '18×18"' },
                  { value: '24 × 24 inches', label: '24×24"' }
                ] as const
              ).map((sz) => {
                const disabled =
                  (selectedCategory === 'standard' && sz.value === '12 × 12 inches') ||
                  (selectedCategory === 'rotating' && sz.value === '18 × 18 inches') ||
                  (selectedShape === 'Square' && sz.value === '12 × 12 inches');
                return (
                  <button
                    key={sz.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSelectedSize(sz.value)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      disabled
                        ? 'opacity-30 cursor-not-allowed bg-[#1A1C22] text-[#A1A1AA]'
                        : selectedSize === sz.value
                        ? 'bg-[#8B5CF6] text-white'
                        : 'bg-[#1A1C22] text-[#A1A1AA] hover:text-[#F5F5F7]'
                    }`}
                  >
                    {sz.label}
                  </button>
                );
              })}
            </div>

            {/* Sort Selector */}
            <div className="md:col-span-2 flex justify-end">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc')}
                aria-label="Sort Products"
                className="w-full bg-[#1A1C22] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-[#F5F5F7] focus:outline-none focus:border-[#38BDF8]"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Active Filter Status Bar */}
          <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs text-[#A1A1AA]">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>
                Showing <strong className="text-[#F5F5F7]">{filteredProducts.length}</strong> of{' '}
                <strong className="text-[#F5F5F7]">{products.length}</strong> verified variants
              </span>
            </div>

            {(selectedCategory !== 'all' || selectedShape !== 'all' || selectedSize !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 text-xs text-[#38BDF8] hover:text-[#F5F5F7]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl bg-[#111318] border border-white/10 p-14 text-center space-y-4">
            <p className="font-display text-xl font-bold text-[#F5F5F7]">
              No variants match this exact filter combination
            </p>
            <p className="text-sm text-[#A1A1AA] max-w-md mx-auto">
              Remember: Standard Lollipop Flange is available in 18 × 18" and 24 × 24" (Round &amp; Square), while Rotating Lollipop Flange is available exclusively in Round 12 × 12" and 24 × 24".
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="px-5 py-2.5 rounded-xl bg-[#F5F5F7] text-[#08090B] text-xs font-semibold"
            >
              Show All 6 Variants
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
