import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { applyImageFallbackOnError } from '../utils/imageFallback';

interface LightboxModalProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  title: string;
  onClose: () => void;
}

export function LightboxModal({ images, initialIndex, isOpen, title, onClose }: LightboxModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoomed(false);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && images.length > 1) {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }
      if (e.key === 'ArrowLeft' && images.length > 1) {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, images.length, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-[#08090B]/95 backdrop-blur-xl flex flex-col"
          onClick={onClose}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="font-display text-sm font-semibold text-[#F5F5F7]">{title}</h3>
              <p className="text-xs text-[#A1A1AA]">
                Image {currentIndex + 1} of {images.length} — Actual Supplied Product Photography
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomed((z) => !z)}
                className="px-3 py-2 rounded-xl bg-[#1A1C22] border border-white/10 text-xs font-medium text-[#F5F5F7] inline-flex items-center gap-1.5 hover:bg-[#252830]"
              >
                {zoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
                {zoomed ? 'Reset Zoom' : 'Zoom 1.6x'}
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close Fullscreen"
                className="p-2 rounded-xl bg-[#1A1C22] border border-white/10 text-[#F5F5F7] hover:bg-[#252830]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Image Stage */}
          <div
            className="flex-1 relative flex items-center justify-center overflow-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {images.length > 1 && (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)}
                className="absolute left-6 z-10 p-3 rounded-full bg-[#111318]/90 border border-white/15 text-[#F5F5F7] hover:bg-[#1A1C22]"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <img
              src={images[currentIndex]}
              alt={`${title} view ${currentIndex + 1}`}
              onError={(e) => applyImageFallbackOnError(e, title)}
              onClick={() => setZoomed((z) => !z)}
              className={`max-h-[76vh] max-w-[88vw] object-contain rounded-xl transition-transform duration-300 cursor-zoom-in ${
                zoomed ? 'scale-150 cursor-zoom-out' : 'scale-100'
              }`}
            />

            {images.length > 1 && (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => (prev + 1) % images.length)}
                className="absolute right-6 z-10 p-3 rounded-full bg-[#111318]/90 border border-white/15 text-[#F5F5F7] hover:bg-[#1A1C22]"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div
              className="py-4 px-6 border-t border-white/10 flex items-center justify-center gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img, idx) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(idx);
                    setZoomed(false);
                  }}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === currentIndex ? 'border-[#38BDF8] scale-105' : 'border-white/10 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${title} thumbnail ${idx + 1}`}
                    onError={(e) => applyImageFallbackOnError(e, title)}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
