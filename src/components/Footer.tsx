import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ArrowUpRight, MapPin, Phone, Mail } from 'lucide-react';

export function Footer() {
  const { siteConfig } = useStore();
  const contact = siteConfig?.contact;

  return (
    <footer className="bg-[#08090B] border-t border-white/[0.08] text-[#A1A1AA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-14 border-b border-white/[0.07]">
          {/* Col 1: Brand & Ownership (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            <Link to="/" className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-full overflow-hidden bg-white p-0.5 border border-white/20 shrink-0">
                <img
                  src="/logo/logo.jpeg"
                  alt="Flange Craft Logo"
                  className="h-full w-full object-contain rounded-full"
                />
              </div>
              <div>
                <div className="font-display text-lg font-bold tracking-tight text-[#F5F5F7]">
                  FLANGE CRAFT
                </div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-[#38BDF8]">
                  Illuminated Storefront Signage
                </div>
              </div>
            </Link>

            <p className="text-sm text-[#A1A1AA] leading-relaxed max-w-sm">
              Professional illuminated projecting Lollipop Flange signage engineered for storefront visibility, modern architectural clarity, and reliable double-sided presentation.
            </p>

            <div className="pt-1">
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#111318] border border-white/[0.08] text-xs text-[#F5F5F7]">
                <span className="h-2 w-2 rounded-full bg-[#8B5CF6]" />
                <span>Owned by Sunil Shukla and Team</span>
              </div>
            </div>
          </div>

          {/* Col 2: Products (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-[#F5F5F7]">
              Product Catalogue
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/products" className="hover:text-[#F5F5F7] transition-colors">
                  All Lollipop Flange Signs
                </Link>
              </li>
              <li>
                <Link to="/products/standard" className="hover:text-[#F5F5F7] transition-colors">
                  Standard Lollipop Flange
                </Link>
              </li>
              <li>
                <Link to="/products/rotating" className="hover:text-[#F5F5F7] transition-colors">
                  Rotating Lollipop Flange
                </Link>
              </li>
              <li>
                <Link to="/product/standard-round-18x18" className="text-xs hover:text-[#38BDF8] transition-colors">
                  Standard Round — 18 × 18 inches
                </Link>
              </li>
              <li>
                <Link to="/product/standard-round-24x24" className="text-xs hover:text-[#38BDF8] transition-colors">
                  Standard Round — 24 × 24 inches
                </Link>
              </li>
              <li>
                <Link to="/product/standard-square-18x18" className="text-xs hover:text-[#38BDF8] transition-colors">
                  Standard Square — 18 × 18 inches
                </Link>
              </li>
              <li>
                <Link to="/product/standard-square-24x24" className="text-xs hover:text-[#38BDF8] transition-colors">
                  Standard Square — 24 × 24 inches
                </Link>
              </li>
              <li>
                <Link to="/product/rotating-round-12x12" className="text-xs hover:text-[#38BDF8] transition-colors">
                  Rotating Round — 12 × 12 inches
                </Link>
              </li>
              <li>
                <Link to="/product/rotating-round-24x24" className="text-xs hover:text-[#38BDF8] transition-colors">
                  Rotating Round — 24 × 24 inches
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Navigation & Policies (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-[#F5F5F7]">
              Navigation & Legal
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-[#F5F5F7] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#F5F5F7] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#F5F5F7] transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-[#F5F5F7] transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/account" className="hover:text-[#F5F5F7] transition-colors">
                  Customer Account
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-[#F5F5F7] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-and-conditions" className="hover:text-[#F5F5F7] transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/shipping-policy" className="hover:text-[#F5F5F7] transition-colors">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link to="/return-policy" className="hover:text-[#F5F5F7] transition-colors">
                  Return Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Social (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-[#F5F5F7]">
              Contact & Support
            </h3>
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[#F5F5F7] font-medium block">Phone / WhatsApp</span>
                  <span>{contact?.phone || contact?.whatsapp || 'Available upon inquiry'}</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-[#8B5CF6] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[#F5F5F7] font-medium block">Email</span>
                  <span>{contact?.email || 'Submit inquiry via Contact form'}</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[#F5F5F7] font-medium block">Business Address</span>
                  <span>{contact?.address || 'Shared upon order or inquiry confirmation'}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-2">
              {contact?.instagram ? (
                <a
                  href={contact.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-[#111318] border border-white/10 text-xs hover:text-[#F5F5F7]"
                >
                  Instagram
                </a>
              ) : null}
              {contact?.facebook ? (
                <a
                  href={contact.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-[#111318] border border-white/10 text-xs hover:text-[#F5F5F7]"
                >
                  Facebook
                </a>
              ) : null}
              <Link
                to="/contact"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1A1C22] hover:bg-[#242730] border border-white/10 text-xs font-medium text-[#F5F5F7] transition-colors"
              >
                Send Inquiry <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Strict Developer Credit */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A1A1AA]">
          <div className="flex flex-wrap items-center gap-2">
            <span>© {new Date().getFullYear()} Flange Craft. All rights reserved.</span>
            <span className="hidden sm:inline text-white/20">|</span>
            <span>Owned by Sunil Shukla and Team</span>
          </div>

          <p className="text-[11px] text-[#A1A1AA]/90 tracking-wide">
            Engineered &amp; Developed by{' '}
            <a
              href="https://tech-grower.web.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#F5F5F7] hover:text-[#38BDF8] underline underline-offset-4 decoration-white/25 hover:decoration-[#38BDF8] transition-colors font-medium"
            >
              Tech GROWER
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
