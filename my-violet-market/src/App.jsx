import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { UserProvider } from './contexts/UserContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { NavbarProvider } from './contexts/NavbarContext';
import { SearchHistoryProvider } from './contexts/SearchHistoryContext';
import { ViewedAtProvider } from './contexts/ViewedAtContext';
import { SellerSubscriptionProvider } from './contexts/SellerSubscriptionContext';
import { CommentsProvider } from './contexts/CommentsContext';
import { AppDataProvider } from './contexts/AppDataContext';
import { TestOrderModalProvider, useTestOrderModal } from './contexts/TestOrderModalContext';
import { consumePendingPostOrderReviewOnHome } from './productManagement';
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
import Login from './pages/Login';
import OrderHistory from './pages/OrderHistory';
import UzWarehousePage from './pages/UzWarehousePage';
import ChinaWarehousePage from './pages/ChinaWarehousePage';
import SellerProfile from './pages/SellerProfile';
import './App.css';
import MessageChatSocketBridge from './components/MessageChatSocketBridge/MessageChatSocketBridge';

const AppContent = () => {
  const location = useLocation();
  const isCheckout = location.pathname === '/checkout';
  const { toast } = useToast();
  const { isOpen, closeModal, cartSnapshot, pendingOpenOnHome, openModal, clearPendingOpenOnHome } = useTestOrderModal();

  useEffect(() => {
    consumePendingPostOrderReviewOnHome({
      pathname: location.pathname,
      pendingOpenOnHome,
      openModal,
      clearPendingOpenOnHome,
    });
  }, [location.pathname, pendingOpenOnHome, openModal, clearPendingOpenOnHome]);

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
          <Route path="/login" element={<Login />} />
          <Route path="/order-history" element={<OrderHistory />} />
          <Route path="/uzWarehousePage" element={<UzWarehousePage />} />
          <Route path="/chinaWarehousePage" element={<ChinaWarehousePage />} />
          <Route path="/seller/:sellerId" element={<SellerProfile />} />
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
      {/* SOTILDI MODAL (.test-order-modal-content) — UI bloki; keyin real to'lov joyiga ko'chiriladi */}
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
      <AppDataProvider>
          <UserProvider>
            <ToastProvider>
              <SellerSubscriptionProvider>
              <WishlistProvider>
              <CartProvider>
                <ViewedAtProvider>
                <NavbarProvider>
                  <SearchHistoryProvider>
                    <CommentsProvider>
                      <TestOrderModalProvider>
                        <MessageChatSocketBridge />
                        <AppContent />
                      </TestOrderModalProvider>
                    </CommentsProvider>
                  </SearchHistoryProvider>
                </NavbarProvider>
                </ViewedAtProvider>
              </CartProvider>
              </WishlistProvider>
              </SellerSubscriptionProvider>
            </ToastProvider>
          </UserProvider>
      </AppDataProvider>
    </Router>
  );
}

export default App;

