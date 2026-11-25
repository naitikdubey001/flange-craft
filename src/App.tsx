import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { AuthAndAccountPage } from './pages/AuthAndAccountPage';
import { AboutPage, ContactPage, FaqPage, PolicyPage } from './pages/StaticAndContentPages';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[#08090B] text-[#F5F5F7]">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage mode="all" />} />
          <Route path="/products/standard" element={<ProductsPage mode="standard" />} />
          <Route path="/products/rotating" element={<ProductsPage mode="rotating" />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/success" element={<OrderSuccessPage />} />
          <Route path="/login" element={<AuthAndAccountPage />} />
          <Route path="/register" element={<AuthAndAccountPage />} />
          <Route path="/account" element={<AuthAndAccountPage />} />
          <Route path="/orders" element={<AuthAndAccountPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/privacy-policy" element={<PolicyPage type="privacy" />} />
          <Route path="/terms-and-conditions" element={<PolicyPage type="terms" />} />
          <Route path="/shipping-policy" element={<PolicyPage type="shipping" />} />
          <Route path="/return-policy" element={<PolicyPage type="return" />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
export default App;
