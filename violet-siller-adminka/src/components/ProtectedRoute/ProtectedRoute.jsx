import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSellerAuth } from '../../context/SellerAuthContext';

export default function ProtectedRoute() {
  const { isAuthenticated } = useSellerAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
