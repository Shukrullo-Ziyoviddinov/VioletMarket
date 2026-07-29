import React, { useEffect, useState } from 'react';
import { fetchMyOrderTracking } from '../api/orderTrackingApi';
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
    fetchMyOrderTracking(authToken)
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

  const panelIndex = filter === 'all' ? 1 : 0;

  return (
    <div className="order-history-page">
      <div className="order-history-container">
        <UserOrderHistoryFilter value={filter} onChange={setFilter} />

        <div className="order-history-panels">
          <div
            className="order-history-panels__track"
            style={{ transform: `translateX(-${panelIndex * 50}%)` }}
          >
            <div className="order-history-panels__panel" aria-hidden={panelIndex !== 0}>
              <UserOrderTrackingList
                orders={inProgressOrders}
                loading={loading || authLoading}
              />
            </div>
            <div className="order-history-panels__panel" aria-hidden={panelIndex !== 1}>
              <UserDeliveredOrdersList orders={deliveredOrders} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;
