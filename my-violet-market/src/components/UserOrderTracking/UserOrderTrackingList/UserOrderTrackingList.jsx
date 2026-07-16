import React from 'react';
import { useTranslation } from 'react-i18next';
import UserOrderTrackingCard from '../UserOrderTrackingCard/UserOrderTrackingCard';
import './UserOrderTrackingList.css';

export default function UserOrderTrackingList({ orders = [], loading = false }) {
  const { t } = useTranslation();

  if (loading) {
    return <div className="user-order-tracking-list__state">{t('orderHistory.loading')}</div>;
  }

  if (!orders.length) {
    return <div className="user-order-tracking-list__state">{t('orderHistory.empty')}</div>;
  }

  return (
    <div className="user-order-tracking-list">
      {orders.map((order) => (
        <UserOrderTrackingCard key={order.id} order={order} />
      ))}
    </div>
  );
}
