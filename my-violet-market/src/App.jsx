import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { UserProvider } from './contexts/UserContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { NavbarProvider } from './contexts/NavbarContext';
import { SearchHistoryProvider } from './contexts/SearchHistoryContext';
import { CommentsProvider } from './contexts/CommentsContext';
import { TestOrderModalProvider, useTestOrderModal } from './contexts/TestOrderModalContext';
import './i18n';
import Navbar from './components/Navbar';
import CheckoutNavbar from './components/CheckoutNavbar';
import MobileNavigation from './components/MobileNavigation';
import Toast from './components/Toast';
import TestOrderModal from './components/TestOrderModal';
import Home from './pages/Home';
import ProductPage from './pages/ProductPage';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Wishlist from './pages/Wishlist';
import Profile from './pages/Profile';
import OrderHistory from './pages/OrderHistory';
import './App.css';

const AppContent = () => {
  const location = useLocation();
  const isCheckout = location.pathname === '/checkout';
  const { toast } = useToast();
  const { isOpen, closeModal, cartSnapshot, pendingOpenOnHome, openModal, clearPendingOpenOnHome } = useTestOrderModal();

  useEffect(() => {
    if (location.pathname === '/' && pendingOpenOnHome) {
      openModal({
        cartSnapshot: pendingOpenOnHome.cartSnapshot,
        onCloseExtra: pendingOpenOnHome.onCloseExtra,
      });
      clearPendingOpenOnHome();
    }
  }, [location.pathname, pendingOpenOnHome]);

  return (
    <div className="App">
      {isCheckout ? <CheckoutNavbar /> : <Navbar />}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new-collection" element={<ProductPage />} />
          <Route path="/cheapest" element={<ProductPage />} />
          <Route path="/women-collection" element={<ProductPage />} />
          <Route path="/men-collection" element={<ProductPage />} />
          <Route path="/electronics" element={<ProductPage />} />
          <Route path="/trending" element={<ProductPage />} />
          <Route path="/books" element={<ProductPage />} />
          <Route path="/stationery" element={<ProductPage />} />
          <Route path="/beauty-care" element={<ProductPage />} />
          <Route path="/accessories" element={<ProductPage />} />
          <Route path="/gifts-toys" element={<ProductPage />} />
          <Route path="/vitamins-health" element={<ProductPage />} />
          <Route path="/active-lifestyle" element={<ProductPage />} />
          <Route path="/travel-gear" element={<ProductPage />} />
          <Route path="/household-appliances" element={<ProductPage />} />
          <Route path="/all-kinds-products" element={<ProductPage />} />
          <Route path="/big-discount" element={<ProductPage />} />
          <Route path="/category/:slug" element={<ProductPage />} />
          <Route path="/search" element={<ProductPage />} />
          <Route path="/product-detail" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/order-history" element={<OrderHistory />} />
        </Routes>
      </main>
      <MobileNavigation />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => {}}
        />
      )}
      {/* Test Order Modal - Global, appears on any page */}
      <TestOrderModal
        isOpen={isOpen}
        onClose={closeModal}
        cartSnapshot={cartSnapshot}
      />
    </div>
  );
};

function App() {
  return (
    <Router>
      <CartProvider>
        <WishlistProvider>
          <UserProvider>
            <ToastProvider>
              <NavbarProvider>
                <SearchHistoryProvider>
                  <CommentsProvider>
                  <TestOrderModalProvider>
                    <AppContent />
                  </TestOrderModalProvider>
                  </CommentsProvider>
                </SearchHistoryProvider>
              </NavbarProvider>
            </ToastProvider>
          </UserProvider>
        </WishlistProvider>
      </CartProvider>
    </Router>
  );
}

export default App;

