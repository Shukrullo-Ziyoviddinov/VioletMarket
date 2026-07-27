import React from 'react';
import { Empty, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import SellerOrderCourierCard from '../SellerOrderCourierCard/SellerOrderCourierCard';
import './SellerOrderCourierList.css';

export default function SellerOrderCourierList({
  orders = [],
  loading = false,
  onOpenOrder,
  emptyKey = 'orders.courier.empty',
}) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="seller-order-courier-list__state">
        <Spin />
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="seller-order-courier-list__state">
        <Empty description={t(emptyKey)} />
      </div>
    );
  }

  return (
    <div className="seller-order-courier-list">
      {orders.map((order) => (
        <SellerOrderCourierCard
          key={order.id}
          order={order}
          onOpen={onOpenOrder}
        />
      ))}
    </div>
  );
}
