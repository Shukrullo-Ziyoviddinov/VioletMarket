import React from 'react';
import { Empty, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import SellerOrderCard from '../SellerOrderCard/SellerOrderCard';
import './SellerOrdersList.css';

export default function SellerOrdersList({ orders = [], loading = false, onOpenOrder }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="seller-orders-list seller-orders-list--loading">
        <Spin />
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="seller-orders-list seller-orders-list--empty">
        <Empty description={t('orders.empty')} />
      </div>
    );
  }

  return (
    <div className="seller-orders-list">
      {orders.map((order) => (
        <SellerOrderCard key={order.id} order={order} onOpen={onOpenOrder} />
      ))}
    </div>
  );
}
