import React from 'react';
import { useTranslation } from 'react-i18next';
import UserDeliveredOrderCard from '../UserDeliveredOrderCard/UserDeliveredOrderCard';
import './UserDeliveredOrdersList.css';

export default function UserDeliveredOrdersList({ orders = [] }) {
  const { t } = useTranslation();

  if (!orders.length) {
    return (
      <div className="user-delivered-orders-list__empty">
        {t('orderHistory.deliveredEmpty')}
      </div>
    );
  }

  return (
    <div className="user-delivered-orders-list">
      {orders.map((order) => (
        <UserDeliveredOrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
