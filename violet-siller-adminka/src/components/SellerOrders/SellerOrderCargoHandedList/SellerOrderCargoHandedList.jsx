import React from 'react';
import { Empty, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import SellerOrderCargoHandedCard from '../SellerOrderCargoHandedCard/SellerOrderCargoHandedCard';
import '../SellerOrderHandedList/SellerOrderHandedList.css';

export default function SellerOrderCargoHandedList({
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
        <Empty description={t('orders.cargoHanded.empty')} />
      </div>
    );
  }

  return (
    <div className="seller-order-handed-list">
      {orders.map((order) => (
        <SellerOrderCargoHandedCard key={order.id} order={order} />
      ))}
    </div>
  );
}
