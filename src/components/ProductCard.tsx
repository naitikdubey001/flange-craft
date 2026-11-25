import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowUpRight, RotateCw, Layers } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, formatPrice } = useStore();
  const isRotating = product.category === 'rotating';

  return (
    <div className="group rounded-2xl bg-[#111318] border border-white/[0.08] hover:border-white/20 overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 shadow-xl shadow-black/40">
      {/* Image Container */}
      <Link
        to={`/product/${product.slug}`}
        className="relative aspect-square w-full bg-[#1A1C22] overflow-hidden block"
      >
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090B]/80 via-transparent to-black/20 opacity-75 group-hover:opacity-60 transition-opacity" />

        {/* Category Badge */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#08090B]/85 backdrop-blur-md border border-white/15 text-[11px] font-medium text-[#F5F5F7]">
          {isRotating ? (
            <>
              <RotateCw className="w-3 h-3 text-[#38BDF8]" />
              <span>Rotating</span>
            </>
          ) : (
            <>
              <Layers className="w-3 h-3 text-[#8B5CF6]" />
              <span>Standard</span>
            </>
          )}
        </div>

        {/* Dimensions Pill */}
        <div className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full bg-[#08090B]/85 backdrop-blur-md border border-white/10 text-[11px] font-mono text-[#A1A1AA]">
          {product.size}
        </div>

        {/* Shape Indicator at bottom-left of image */}
        <div className="absolute bottom-3.5 left-3.5 flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-md text-[11px] font-medium text-[#F5F5F7]">
            {product.shape} Shape
          </span>
          {product.images.length > 1 && (
            <span className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] text-[#A1A1AA]">
              {product.images.length} Photos
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-[#A1A1AA] mb-1">
            {product.categoryLabel}
          </div>
          <Link
            to={`/product/${product.slug}`}
            className="font-display text-lg font-bold text-[#F5F5F7] group-hover:text-[#38BDF8] transition-colors line-clamp-1"
          >
            {product.shortName}
          </Link>
          <p className="text-xs text-[#A1A1AA] mt-1.5 line-clamp-2 leading-relaxed">
            {product.summary}
          </p>
        </div>

        <div className="pt-3 border-t border-white/[0.07] space-y-3">
          {/* Specs & Price Row */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#A1A1AA] block">
                Price Status
              </span>
              {product.priceConfigured && product.price ? (
                <span className="font-display text-lg font-bold text-[#F5F5F7]">
                  {formatPrice(product)}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#38BDF8]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#38BDF8]" />
                  Configurable Price
                </span>
              )}
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-[#A1A1AA] block">
                Dimensions
              </span>
              <span className="text-xs font-medium text-[#F5F5F7]">{product.size}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <Link
              to={`/product/${product.slug}`}
              className="py-2.5 px-3 rounded-xl bg-[#1A1C22] hover:bg-[#232630] border border-white/10 text-xs font-medium text-[#F5F5F7] inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              Details
              <ArrowUpRight className="w-3.5 h-3.5 text-[#A1A1AA]" />
            </Link>
            <button
              type="button"
              disabled={!product.inStock}
              onClick={() => addToCart(product, 1)}
              className="py-2.5 px-3 rounded-xl bg-[#F5F5F7] hover:bg-white text-[#08090B] disabled:opacity-40 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {product.inStock ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
