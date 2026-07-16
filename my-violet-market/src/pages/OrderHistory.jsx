import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchMyUzbOrderTracking } from '../api/orderTrackingApi';
import UserOrderTrackingList from '../components/UserOrderTracking/UserOrderTrackingList/UserOrderTrackingList';
import { useUser } from '../contexts/UserContext';
import './OrderHistory.css';

const OrderHistory = () => {
  const { t } = useTranslation();
  const { authToken, authLoading } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!authToken) {
      setOrders([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchMyUzbOrderTracking(authToken)
      .then((items) => {
        if (!cancelled) setOrders(items);
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, authToken]);

  return (
    <div className="order-history-page">
      <div className="order-history-container">
        <h1>{t('orderHistory.title')}</h1>
        <UserOrderTrackingList orders={orders} loading={loading || authLoading} />
      </div>
    </div>
  );
};

export default OrderHistory;
