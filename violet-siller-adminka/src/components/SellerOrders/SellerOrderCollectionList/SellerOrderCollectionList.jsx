import React from 'react';
import { Empty, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import SellerOrderCollectionCard from '../SellerOrderCollectionCard/SellerOrderCollectionCard';
import './SellerOrderCollectionList.css';

export default function SellerOrderCollectionList({
  orders = [],
  loading = false,
  onOpenOrder,
}) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="seller-order-collection-list__state">
        <Spin />
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="seller-order-collection-list__state">
        <Empty description={t('orders.collection.empty')} />
      </div>
    );
  }

  return (
    <div className="seller-order-collection-list">
      {orders.map((order) => (
        <SellerOrderCollectionCard
          key={order.id}
          order={order}
          onOpen={onOpenOrder}
        />
      ))}
    </div>
  );
}
