import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './i18n';
import AuthLayout from './components/AuthLayout/AuthLayout';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import SellerLayout from './components/SellerLayout/SellerLayout';
import ApplicationStatusPage from './pages/ApplicationStatusPage/ApplicationStatusPage';
import ApplicationSubmitPage from './pages/ApplicationSubmitPage/ApplicationSubmitPage';
import HomePage from './pages/HomePage/HomePage';
import AddProductsPage from './pages/AddProductsPage/AddProductsPage';
import DiscontinuedProductsPage from './pages/DiscontinuedProductsPage/DiscontinuedProductsPage';
import EditProductPage from './pages/EditProductPage/EditProductPage';
import MessagesPage from './pages/MessagesPage/MessagesPage';
import MyProductsPage from './pages/MyProductsPage/MyProductsPage';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterStartPage from './pages/RegisterStartPage/RegisterStartPage';
import RegisterVerifyPage from './pages/RegisterVerifyPage/RegisterVerifyPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterStartPage />} />
          <Route path="/register/verify" element={<RegisterVerifyPage />} />
          <Route path="/application" element={<ApplicationSubmitPage />} />
          <Route path="/application/status" element={<ApplicationStatusPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<SellerLayout />}>
            <Route index element={<HomePage />} />
            <Route path="products" element={<MyProductsPage />} />
            <Route path="products/discontinued" element={<DiscontinuedProductsPage />} />
            <Route path="products/add" element={<AddProductsPage />} />
            <Route path="products/:productId/edit" element={<EditProductPage />} />
            <Route path="messages" element={<MessagesPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
