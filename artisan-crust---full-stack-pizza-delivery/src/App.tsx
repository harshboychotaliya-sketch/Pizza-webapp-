import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { DevMailboxModal } from './components/DevMailboxModal';

import { HomePage } from './pages/HomePage';
import { MenuPage } from './pages/MenuPage';
import { CustomBuilderPage } from './pages/CustomBuilderPage';
import { CartCheckoutPage } from './pages/CartCheckoutPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { OrderHistoryPage } from './pages/OrderHistoryPage';
import { LoginPage, RegisterPage, VerifyEmailPage, ForgotPasswordPage, ResetPasswordPage } from './pages/AuthPages';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

export default function App() {
  const [isMailboxOpen, setIsMailboxOpen] = useState(false);

  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#242424] font-sans antialiased selection:bg-[#E23722] selection:text-white">
            {/* Top Navigation */}
            <Navbar onOpenMailbox={() => setIsMailboxOpen(true)} />

            {/* Main Content Area */}
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/menu" element={<MenuPage />} />
                <Route path="/builder" element={<CustomBuilderPage />} />
                <Route path="/checkout" element={<CartCheckoutPage />} />
                <Route path="/track" element={<OrderTrackingPage />} />
                <Route path="/orders" element={<OrderHistoryPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Persistent Cart Drawer */}
            <CartDrawer />

            {/* Dev Mailbox Modal for previewing sent emails/tokens */}
            <DevMailboxModal
              isOpen={isMailboxOpen}
              onClose={() => setIsMailboxOpen(false)}
            />

            {/* Footer */}
            <Footer />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
