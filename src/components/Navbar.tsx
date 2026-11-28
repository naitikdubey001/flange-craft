import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, User, ShoppingBag, Menu, X, ChevronDown, ArrowUpRight, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../context/StoreContext';
import { applyImageFallbackOnError } from '../utils/imageFallback';

export function Navbar() {
  const { cartCount, user, products, formatPrice } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 60);
    }
  }, [searchOpen]);

  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.shape.toLowerCase().includes(q) ||
      p.size.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    );
  });

  const isHomeTop = location.pathname === '/' && !scrolled && !mobileOpen;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isHomeTop
            ? 'bg-gradient-to-b from-[#08090B]/90 via-[#08090B]/40 to-transparent border-b border-white/[0.04] py-4'
            : 'bg-[#08090B]/92 backdrop-blur-xl border-b border-white/[0.08] py-3.5 shadow-2xl shadow-black/60'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-full overflow-hidden bg-white p-0.5 border border-white/15 shrink-0 transition-transform duration-300 group-hover:scale-105">
              <img
                src="/logo/logo.jpeg"
                alt="Flange Craft Logo"
                className="h-full w-full object-contain rounded-full"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold tracking-tight text-[#F5F5F7] leading-none">
                FLANGE CRAFT
              </span>
              <span className="text-[10px] uppercase tracking-[0.22em] text-[#A1A1AA] mt-1">
                Illuminated Signage
              </span>
            </div>
          </Link>

          {/* Center: Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
            <Link
              to="/"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/'
                  ? 'text-[#F5F5F7] bg-white/[0.06]'
                  : 'text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-white/[0.03]'
              }`}
            >
              Home
            </Link>

            {/* Products Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <Link
                to="/products"
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${
                  location.pathname === '/products' || location.pathname.startsWith('/product/')
                    ? 'text-[#F5F5F7] bg-white/[0.06]'
                    : 'text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-white/[0.03]'
                }`}
              >
                Products
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </Link>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.16 }}
                    className="absolute left-0 top-full pt-2 w-[440px]"
                  >
                    <div className="rounded-2xl bg-[#111318] border border-white/10 shadow-2xl shadow-black/90 p-4 grid grid-cols-2 gap-3">
                      <Link
                        to="/products/standard"
                        className="p-3.5 rounded-xl bg-[#1A1C22]/70 hover:bg-[#1A1C22] border border-white/[0.06] hover:border-[#8B5CF6]/40 transition-all group"
                      >
                        <div className="text-xs font-semibold uppercase tracking-wider text-[#8B5CF6] mb-1">
                          4 Variants
                        </div>
                        <div className="font-display font-semibold text-sm text-[#F5F5F7] flex items-center justify-between">
                          Standard Flange
                          <ArrowUpRight className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-[#F5F5F7]" />
                        </div>
                        <p className="text-xs text-[#A1A1AA] mt-1 leading-relaxed">
                          Round & Square — 18 × 18" and 24 × 24"
                        </p>
                      </Link>

                      <Link
                        to="/products/rotating"
                        className="p-3.5 rounded-xl bg-[#1A1C22]/70 hover:bg-[#1A1C22] border border-white/[0.06] hover:border-[#38BDF8]/40 transition-all group"
                      >
                        <div className="text-xs font-semibold uppercase tracking-wider text-[#38BDF8] mb-1">
                          2 Variants (Round Only)
                        </div>
                        <div className="font-display font-semibold text-sm text-[#F5F5F7] flex items-center justify-between">
                          Rotating Flange
                          <ArrowUpRight className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-[#F5F5F7]" />
                        </div>
                        <p className="text-xs text-[#A1A1AA] mt-1 leading-relaxed">
                          Round — 12 × 12" and 24 × 24"
                        </p>
                      </Link>

                      <div className="col-span-2 pt-2 border-t border-white/[0.06] flex items-center justify-between px-1">
                        <span className="text-xs text-[#A1A1AA]">Complete 6-variant verified catalogue</span>
                        <Link
                          to="/products"
                          className="text-xs font-medium text-[#F5F5F7] hover:text-[#38BDF8] inline-flex items-center gap-1"
                        >
                          View All Products <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              to="/products/standard"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/products/standard'
                  ? 'text-[#F5F5F7] bg-white/[0.06]'
                  : 'text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-white/[0.03]'
              }`}
            >
              Standard
            </Link>

            <Link
              to="/products/rotating"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/products/rotating'
                  ? 'text-[#F5F5F7] bg-white/[0.06]'
                  : 'text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-white/[0.03]'
              }`}
            >
              Rotating
            </Link>

            <Link
              to="/about"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/about'
                  ? 'text-[#F5F5F7] bg-white/[0.06]'
                  : 'text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-white/[0.03]'
              }`}
            >
              About
            </Link>

            <Link
              to="/contact"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/contact'
                  ? 'text-[#F5F5F7] bg-white/[0.06]'
                  : 'text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-white/[0.03]'
              }`}
            >
              Contact
            </Link>
          </nav>

          {/* Right: Search, Account, Admin, Cart */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search Products"
              className="p-2.5 rounded-xl text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-white/[0.06] transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>

            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8B5CF6]/15 border border-[#8B5CF6]/40 text-xs font-medium text-[#F5F5F7] hover:bg-[#8B5CF6]/25 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-[#8B5CF6]" />
                Admin
              </Link>
            )}

            <Link
              to={user ? '/account' : '/login'}
              aria-label="Customer Account"
              className={`hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                location.pathname === '/account' || location.pathname === '/login'
                  ? 'bg-white/[0.08] text-[#F5F5F7]'
                  : 'text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-white/[0.06]'
              }`}
            >
              <User className="w-4 h-4" />
              <span className="max-w-[96px] truncate">{user ? user.name.split(' ')[0] : 'Account'}</span>
            </Link>

            <Link
              to="/cart"
              aria-label="Shopping Cart"
              className="relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1A1C22] hover:bg-[#23262F] border border-white/10 text-sm font-medium text-[#F5F5F7] transition-all"
            >
              <ShoppingBag className="w-4 h-4 text-[#38BDF8]" />
              <span className="hidden sm:inline text-xs">Cart</span>
              <span
                className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold transition-transform ${
                  cartCount > 0
                    ? 'bg-[#8B5CF6] text-white'
                    : 'bg-white/10 text-[#A1A1AA]'
                }`}
              >
                {cartCount}
              </span>
            </Link>

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Toggle Mobile Navigation"
              className="lg:hidden p-2.5 rounded-xl text-[#F5F5F7] hover:bg-white/[0.06] transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              className="lg:hidden overflow-hidden bg-[#111318] border-b border-white/10"
            >
              <div className="px-4 pt-4 pb-6 space-y-2">
                <Link
                  to="/"
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-[#F5F5F7] hover:bg-white/[0.05]"
                >
                  Home
                </Link>
                <Link
                  to="/products"
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-[#F5F5F7] hover:bg-white/[0.05]"
                >
                  All Products (6 Variants)
                </Link>
                <Link
                  to="/products/standard"
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-[#F5F5F7] hover:bg-white/[0.05]"
                >
                  Standard Lollipop Flange
                </Link>
                <Link
                  to="/products/rotating"
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-[#F5F5F7] hover:bg-white/[0.05]"
                >
                  Rotating Lollipop Flange
                </Link>
                <Link
                  to="/about"
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-[#F5F5F7] hover:bg-white/[0.05]"
                >
                  About Us
                </Link>
                <Link
                  to="/contact"
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-[#F5F5F7] hover:bg-white/[0.05]"
                >
                  Contact Us
                </Link>
                <Link
                  to="/faq"
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-white/[0.05]"
                >
                  FAQ
                </Link>
                <div className="pt-3 border-t border-white/10 flex flex-wrap gap-2 px-2">
                  <Link
                    to={user ? '/account' : '/login'}
                    className="flex-1 text-center py-2.5 px-4 rounded-xl bg-[#1A1C22] border border-white/10 text-xs font-medium text-[#F5F5F7]"
                  >
                    {user ? `Account (${user.name.split(' ')[0]})` : 'Login / Register'}
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="py-2.5 px-4 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-xs font-medium text-[#F5F5F7]"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Instant Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-start justify-center pt-20 px-4"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-2xl bg-[#111318] border border-white/15 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
                <Search className="w-5 h-5 text-[#38BDF8]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Standard, Rotating, Round, Square, 12x12, 18x18, 24x24..."
                  className="w-full bg-transparent text-sm text-[#F5F5F7] placeholder-[#A1A1AA] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#F5F5F7]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-4 divide-y divide-white/[0.06]">
                {filteredProducts.length === 0 ? (
                  <div className="py-10 text-center text-sm text-[#A1A1AA]">
                    No matching signage variants found for "{searchQuery}".
                  </div>
                ) : (
                  filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSearchOpen(false);
                        navigate(`/product/${p.slug}`);
                      }}
                      className="w-full py-3 px-3 flex items-center gap-4 hover:bg-white/[0.04] rounded-xl transition-colors text-left"
                    >
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        onError={(e) => applyImageFallbackOnError(e, p.shortName || p.name, p.shape)}
                        className="w-14 h-14 rounded-lg object-cover bg-[#1A1C22] border border-white/10 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[#F5F5F7] truncate">{p.name}</div>
                        <div className="text-xs text-[#A1A1AA] mt-0.5 flex items-center gap-2">
                          <span>{p.categoryLabel}</span>
                          <span>•</span>
                          <span>{p.shape}</span>
                          <span>•</span>
                          <span>{p.size}</span>
                        </div>
                      </div>
                      <div className="text-xs font-medium text-[#38BDF8] shrink-0">
                        {formatPrice(p)}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
