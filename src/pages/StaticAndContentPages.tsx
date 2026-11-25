import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Search,
  ChevronDown,
  Shield,
  Layers,
  RotateCw,
  Sun,
  Eye
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { SEO } from '../components/SEO';

// --- 1. ABOUT US PAGE (/about) ---
export function AboutPage() {
  const { siteConfig } = useStore();

  return (
    <div className="bg-[#08090B] min-h-screen pt-28 pb-24">
      <SEO
        title="About Us — Flange Craft Illuminated Storefront Signage"
        description="Crafting Visibility for Modern Businesses. Learn about Flange Craft, led by Sunil Shukla and Team, specializing in illuminated Lollipop Flange signage."
        canonicalPath="/about"
      />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 border-b border-white/[0.08]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111318] border border-white/10 text-xs font-medium text-[#38BDF8]">
              Flange Craft • Owned by {siteConfig.ownerName || 'Sunil Shukla and Team'}
            </div>
            <h1 className="font-display text-4xl sm:text-6xl font-bold text-[#F5F5F7] tracking-tight leading-[1.06]">
              {siteConfig.aboutHeroHeadline || 'Crafting Visibility for Modern Businesses.'}
            </h1>
            <p className="text-base sm:text-lg text-[#A1A1AA] leading-relaxed max-w-2xl">
              {siteConfig.aboutIntroduction ||
                'Flange Craft is a commercial signage brand focused on visibility, craftsmanship, modern design, and premium storefront presentation through illuminated Lollipop Flange signs.'}
            </p>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            <img
              src="/images/product/standard/18x18/round/image-2.jpg"
              alt="Standard Round Lollipop Flange Sign"
              className="rounded-2xl border border-white/10 w-full aspect-[4/5] object-cover bg-[#111318]"
            />
            <img
              src="/images/product/standard/18x18/square/image-2.jpg"
              alt="Standard Square Lollipop Flange Sign"
              className="rounded-2xl border border-white/10 w-full aspect-[4/5] object-cover bg-[#111318] mt-8"
            />
          </div>
        </div>
      </section>

      {/* What Flange Craft Offers & Product Philosophy */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-b border-white/[0.08]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="p-8 sm:p-10 rounded-3xl bg-[#111318] border border-white/10 space-y-4">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8B5CF6]">
              What Flange Craft Offers
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F5F5F7]">
              Specialized Illuminated Lollipop Flange Signage
            </h2>
            <p className="text-sm sm:text-base text-[#A1A1AA] leading-relaxed">
              Rather than diluting focus across unrelated display hardware, Flange Craft concentrates exclusively on illuminated projecting Lollipop Flange signs. Our catalogue consists of six verified commercial variants across Standard Round, Standard Square, and Rotating Round configurations.
            </p>
          </div>

          <div className="p-8 sm:p-10 rounded-3xl bg-[#111318] border border-white/10 space-y-4">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#38BDF8]">
              Product Philosophy
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F5F5F7]">
              Storefront Clarity from Every Approach Angle
            </h2>
            <p className="text-sm sm:text-base text-[#A1A1AA] leading-relaxed">
              {siteConfig.aboutPhilosophy ||
                'A projecting wall-mounted sign solves the fundamental challenge of flat fascia boards: pedestrians walking along a sidewalk cannot easily read signage flush with the wall. By projecting outward with internal double-sided illumination, a Flange Craft sign commands attention down the entire corridor.'}
            </p>
          </div>
        </div>
      </section>

      {/* Craftsmanship & Product Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-b border-white/[0.08]">
        <div className="max-w-2xl mb-12 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#38BDF8]">
            Craftsmanship &amp; Portfolio
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F5F7]">
            Built for Real Storefronts
          </h2>
          <p className="text-sm text-[#A1A1AA] leading-relaxed">
            Every Flange Craft sign combines formed acrylic display surfaces, perimeter framing, internal illumination, and a rigid wall-mounting flange.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              img: '/images/product/standard/24x24/round/image-1.jpg',
              title: 'Standard Round — 24 × 24 inches',
              sub: 'Large-format circular double-sided display'
            },
            {
              img: '/images/product/standard/18x18/square/image-1.jpg',
              title: 'Formed Housing & Mounting Flange',
              sub: 'Precision molded frame and heavy-duty wall bracket'
            },
            {
              img: '/images/product/rotating/12x12/round/image-1.jpg',
              title: 'Rotating Round — 12 × 12 inches',
              sub: 'Dynamic rotating round illuminated projection'
            }
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl bg-[#111318] border border-white/10 overflow-hidden flex flex-col"
            >
              <div className="aspect-[4/3] bg-[#1A1C22]">
                <img src={card.img} alt={card.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-5">
                <h3 className="font-display text-base font-bold text-[#F5F5F7]">{card.title}</h3>
                <p className="text-xs text-[#A1A1AA] mt-1">{card.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Brand Values */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-b border-white/[0.08]">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8B5CF6] mb-3">
          Core Principles
        </div>
        <h2 className="font-display text-3xl font-bold text-[#F5F5F7] mb-10">Brand Values</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Eye,
              title: 'Product Clarity',
              desc: 'Honest representation of our six verified variants—Standard Round, Standard Square, and Rotating Round—with zero exaggerated specifications.'
            },
            {
              icon: Sun,
              title: 'Storefront Visibility',
              desc: 'Internal illumination and double-sided projection designed to make commercial businesses stand out day and night.'
            },
            {
              icon: Layers,
              title: 'Quality Craftsmanship',
              desc: 'Clean structural borders, balanced proportions, and sturdy mounting flange construction.'
            },
            {
              icon: RotateCw,
              title: 'Reliable Presentation',
              desc: 'Led by Sunil Shukla and Team with a commitment to straightforward ordering and responsive customer support.'
            }
          ].map((val) => {
            const Icon = val.icon;
            return (
              <div key={val.title} className="p-6 rounded-2xl bg-[#111318] border border-white/10 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-[#1A1C22] border border-white/10 flex items-center justify-center text-[#38BDF8]">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-base font-bold text-[#F5F5F7]">{val.title}</h3>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">{val.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 text-center space-y-6">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F5F7]">
          Ready to Elevate Your Storefront?
        </h2>
        <p className="text-sm sm:text-base text-[#A1A1AA] max-w-xl mx-auto">
          Browse our complete six-variant catalogue or reach out to Sunil Shukla and Team for assistance with your signage requirements.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/products"
            className="px-7 py-3.5 rounded-xl bg-[#F5F5F7] hover:bg-white text-[#08090B] font-display text-xs font-bold inline-flex items-center gap-2"
          >
            Explore Catalogue <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/contact"
            className="px-7 py-3.5 rounded-xl bg-[#111318] hover:bg-[#1A1C22] border border-white/15 text-xs font-semibold text-[#F5F5F7] inline-flex items-center gap-2"
          >
            Contact Us <ArrowUpRight className="w-4 h-4 text-[#38BDF8]" />
          </Link>
        </div>
      </section>
    </div>
  );
}

// --- 2. CONTACT US PAGE (/contact) ---
export function ContactPage() {
  const { siteConfig, showToast } = useStore();
  const contact = siteConfig?.contact;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError('Please complete all required fields (Name, Email, Subject, and Message).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          subject: subject.trim(),
          message: message.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit inquiry.');
      } else {
        setSubmittedId(data.inquiryId);
        showToast('Inquiry Sent', 'Your message has been saved and forwarded to Sunil Shukla and Team.');
        setName('');
        setEmail('');
        setPhone('');
        setSubject('');
        setMessage('');
      }
    } catch {
      setError('Network error while submitting contact form.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#08090B] min-h-screen pt-28 pb-24">
      <SEO
        title="Contact Us — Flange Craft Customer Support"
        description="Get in touch with Sunil Shukla and Team at Flange Craft for illuminated Lollipop Flange signage orders and inquiries."
        canonicalPath="/contact"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl pb-12">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#38BDF8] mb-2">
            Direct Support &amp; Inquiries
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-[#F5F5F7] tracking-tight">
            Contact Flange Craft
          </h1>
          <p className="text-sm sm:text-base text-[#A1A1AA] mt-3 leading-relaxed">
            Have questions about our Standard or Rotating Lollipop Flange sizes, pricing configuration, or commercial orders? Send a message to Sunil Shukla and Team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Configurable Business Contact Info (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-7 rounded-3xl bg-[#111318] border border-white/10 space-y-6">
              <div>
                <div className="text-xs uppercase tracking-wider text-[#A1A1AA]">Ownership &amp; Management</div>
                <div className="font-display text-lg font-bold text-[#F5F5F7] mt-1">
                  {siteConfig.ownerName || 'Sunil Shukla and Team'}
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="p-4 rounded-2xl bg-[#1A1C22] border border-white/[0.06] flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[#F5F5F7]">Phone</div>
                    <div className="text-[#A1A1AA] mt-0.5">
                      {contact?.phone || 'Not yet configured — Set in Admin Dashboard'}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#1A1C22] border border-white/[0.06] flex items-start gap-3">
                  <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[#F5F5F7]">WhatsApp</div>
                    <div className="text-[#A1A1AA] mt-0.5">
                      {contact?.whatsapp || 'Not yet configured — Set in Admin Dashboard'}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#1A1C22] border border-white/[0.06] flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#8B5CF6] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[#F5F5F7]">Email</div>
                    <div className="text-[#A1A1AA] mt-0.5">
                      {contact?.email || 'Not yet configured — Set in Admin Dashboard'}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#1A1C22] border border-white/[0.06] flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[#F5F5F7]">Business Address</div>
                    <div className="text-[#A1A1AA] mt-0.5">
                      {contact?.address || 'Not yet configured — Set in Admin Dashboard'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-[#A1A1AA]">
                <span>Social Media &amp; Contact Config</span>
                <Link to="/admin" className="text-[#38BDF8] hover:underline inline-flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> Configure in Admin
                </Link>
              </div>
            </div>
          </div>

          {/* Right: Validated Contact Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="p-7 sm:p-10 rounded-3xl bg-[#111318] border border-white/10 space-y-6">
              <h2 className="font-display text-2xl font-bold text-[#F5F5F7]">Send an Inquiry</h2>

              {submittedId && (
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-xs sm:text-sm text-emerald-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Inquiry Received (Reference: {submittedId})</div>
                    <p className="mt-1 text-emerald-300/80">
                      Thank you for contacting Flange Craft. Your inquiry has been recorded in our database for Sunil Shukla and Team.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-xs sm:text-sm text-red-300">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full Name"
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 rounded-xl bg-[#1A1C22] border border-white/10 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#38BDF8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">Subject *</label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Pricing for Standard Round 24x24"
                      className="w-full px-4 py-3 rounded-xl bg-[#1A1C22] border border-white/10 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#38BDF8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">Message *</label>
                  <textarea
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Share your required signage variant (Standard or Rotating), dimensions, quantity, and delivery city..."
                    className="w-full px-4 py-3 rounded-xl bg-[#1A1C22] border border-white/10 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-4 rounded-xl bg-[#F5F5F7] hover:bg-white disabled:opacity-50 text-[#08090B] font-display text-sm font-bold transition-all"
                >
                  {submitting ? 'Sending Message...' : 'Submit Inquiry'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 3. FAQ PAGE (/faq) ---
export function FaqPage() {
  const { faqs } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id || 'faq-1');

  const categories = ['All', 'Products', 'Sizes', 'Illumination', 'Orders', 'Payments', 'Shipping', 'Installation', 'Returns'];

  const filteredFaqs = useMemo(() => {
    return faqs.filter((f) => {
      if (selectedCategory !== 'All' && f.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
      }
      return true;
    });
  }, [faqs, selectedCategory, searchQuery]);

  return (
    <div className="bg-[#08090B] min-h-screen pt-28 pb-24">
      <SEO
        title="Frequently Asked Questions — Flange Craft"
        description="Answers to common questions about Flange Craft Standard and Rotating Lollipop Flange signage sizes, illumination, ordering, shipping, and returns."
        canonicalPath="/faq"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8B5CF6]">
            Knowledge Base
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-[#F5F5F7]">
            Frequently Asked Questions
          </h1>
          <p className="text-sm sm:text-base text-[#A1A1AA]">
            Everything you need to know about our six verified Lollipop Flange signage variants, illumination, ordering, payments, and delivery.
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-[#A1A1AA] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions (e.g. rotating, sizes, mounting, Razorpay)..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#111318] border border-white/10 text-sm text-[#F5F5F7] placeholder-[#A1A1AA] focus:outline-none focus:border-[#38BDF8]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#F5F5F7] text-[#08090B]'
                    : 'bg-[#111318] border border-white/10 text-[#A1A1AA] hover:text-[#F5F5F7]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="p-10 rounded-2xl bg-[#111318] border border-white/10 text-center text-sm text-[#A1A1AA]">
              No FAQ entries match your filter.{' '}
              <Link to="/contact" className="text-[#38BDF8] underline">
                Ask our team directly
              </Link>
              .
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-2xl bg-[#111318] border border-white/10 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-white/[0.02]"
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
                      className={`w-4 h-4 text-[#A1A1AA] shrink-0 transition-transform ${
                        isOpen ? 'rotate-180 text-[#F5F5F7]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-2 text-sm text-[#A1A1AA] leading-relaxed border-t border-white/[0.06]">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// --- 4. POLICY PAGES (/privacy-policy, /terms-and-conditions, /shipping-policy, /return-policy) ---
export function PolicyPage({
  type
}: {
  type: 'privacy' | 'terms' | 'shipping' | 'return';
}) {
  const { siteConfig } = useStore();

  const meta = {
    privacy: {
      title: 'Privacy Policy',
      path: '/privacy-policy',
      content: siteConfig?.policies?.privacyPolicy
    },
    terms: {
      title: 'Terms & Conditions',
      path: '/terms-and-conditions',
      content: siteConfig?.policies?.termsConditions
    },
    shipping: {
      title: 'Shipping Policy',
      path: '/shipping-policy',
      content: siteConfig?.policies?.shippingPolicy
    },
    return: {
      title: 'Return Policy',
      path: '/return-policy',
      content: siteConfig?.policies?.returnPolicy
    }
  }[type];

  return (
    <div className="bg-[#08090B] min-h-screen pt-28 pb-24">
      <SEO
        title={`${meta.title} — Flange Craft`}
        description={`${meta.title} for Flange Craft, owned by Sunil Shukla and Team.`}
        canonicalPath={meta.path}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="pb-8 border-b border-white/[0.08] flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#38BDF8] mb-2">
              Store Policy • Configurable Business Information
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-bold text-[#F5F5F7]">
              {meta.title}
            </h1>
          </div>
          <Link
            to="/admin"
            className="px-3.5 py-2 rounded-xl bg-[#111318] border border-white/10 text-xs text-[#A1A1AA] hover:text-[#F5F5F7] inline-flex items-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5 text-[#8B5CF6]" /> Edit Policy in Admin
          </Link>
        </div>

        <div className="p-8 sm:p-10 rounded-3xl bg-[#111318] border border-white/10">
          <div className="prose prose-invert max-w-none text-sm sm:text-base text-[#A1A1AA] whitespace-pre-line leading-relaxed">
            {meta.content}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-xs">
          <Link
            to="/privacy-policy"
            className="px-4 py-2 rounded-xl bg-[#111318] border border-white/10 text-[#A1A1AA] hover:text-[#F5F5F7]"
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms-and-conditions"
            className="px-4 py-2 rounded-xl bg-[#111318] border border-white/10 text-[#A1A1AA] hover:text-[#F5F5F7]"
          >
            Terms &amp; Conditions
          </Link>
          <Link
            to="/shipping-policy"
            className="px-4 py-2 rounded-xl bg-[#111318] border border-white/10 text-[#A1A1AA] hover:text-[#F5F5F7]"
          >
            Shipping Policy
          </Link>
          <Link
            to="/return-policy"
            className="px-4 py-2 rounded-xl bg-[#111318] border border-white/10 text-[#A1A1AA] hover:text-[#F5F5F7]"
          >
            Return Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
