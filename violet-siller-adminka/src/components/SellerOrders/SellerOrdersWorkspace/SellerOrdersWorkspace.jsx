import React, { useCallback, useEffect, useState } from 'react';
import { fetchSellerOrders } from '../../../api/sellerOrdersApi';
import { useSellerAuth } from '../../../context/SellerAuthContext';
import SellerOrdersList from '../SellerOrdersList/SellerOrdersList';
import './SellerOrdersWorkspace.css';

export default function SellerOrdersWorkspace() {
  const { token } = useSellerAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    if (!token) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchSellerOrders(token, { page: 1, limit: 50 });
      setOrders(data.orders);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <div className="seller-orders-workspace">
      <SellerOrdersList orders={orders} loading={loading} />
    </div>
  );
}
