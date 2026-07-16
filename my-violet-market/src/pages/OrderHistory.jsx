import React, { useEffect, useState } from 'react';
import { fetchMyUzbOrderTracking } from '../api/orderTrackingApi';
import UserDeliveredOrdersList from '../components/UserOrderTracking/UserDeliveredOrdersList/UserDeliveredOrdersList';
import UserOrderHistoryFilter from '../components/UserOrderTracking/UserOrderHistoryFilter/UserOrderHistoryFilter';
import UserOrderTrackingList from '../components/UserOrderTracking/UserOrderTrackingList/UserOrderTrackingList';
import { useUser } from '../contexts/UserContext';
import './OrderHistory.css';

const OrderHistory = () => {
  const { authToken, authLoading } = useUser();
  const [filter, setFilter] = useState('in_progress');
  const [inProgressOrders, setInProgressOrders] = useState([]);
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!authToken) {
      setInProgressOrders([]);
      setDeliveredOrders([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchMyUzbOrderTracking(authToken)
      .then((data) => {
        if (cancelled) return;
        setInProgressOrders(data.inProgressItems);
        setDeliveredOrders(data.deliveredItems);
      })
      .catch(() => {
        if (!cancelled) {
          setInProgressOrders([]);
          setDeliveredOrders([]);
        }
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
        <UserOrderHistoryFilter value={filter} onChange={setFilter} />

        {loading || authLoading ? (
          <UserOrderTrackingList orders={[]} loading />
        ) : filter === 'in_progress' ? (
          <UserOrderTrackingList orders={inProgressOrders} />
        ) : (
          <UserDeliveredOrdersList orders={deliveredOrders} />
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
