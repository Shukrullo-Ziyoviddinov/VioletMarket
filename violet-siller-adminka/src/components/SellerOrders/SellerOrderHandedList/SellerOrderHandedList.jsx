import React from 'react';
import { Empty, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import SellerOrderHandedCard from '../SellerOrderHandedCard/SellerOrderHandedCard';
import './SellerOrderHandedList.css';

export default function SellerOrderHandedList({
  orders = [],
  loading = false,
}) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="seller-order-handed-list__state">
        <Spin />
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="seller-order-handed-list__state">
        <Empty description={t('orders.handed.empty')} />
      </div>
    );
  }

  return (
    <div className="seller-order-handed-list">
      {orders.map((order) => (
        <SellerOrderHandedCard key={order.id} order={order} />
      ))}
    </div>
  );
}
