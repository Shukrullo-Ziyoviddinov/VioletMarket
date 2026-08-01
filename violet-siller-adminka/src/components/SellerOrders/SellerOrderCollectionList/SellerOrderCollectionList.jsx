import React, { useMemo } from 'react';
import { Empty, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { groupSellerOrdersByFulfillment } from '../../../utils/sellerOrderGroups';
import SellerOrderCollectionCard from '../SellerOrderCollectionCard/SellerOrderCollectionCard';
import './SellerOrderCollectionList.css';

export default function SellerOrderCollectionList({
  orders = [],
  loading = false,
  onOpenOrder,
  groupByFulfillment = false,
}) {
  const { t } = useTranslation();

  const displayOrders = useMemo(() => {
    if (!groupByFulfillment) return orders;
    return groupSellerOrdersByFulfillment(orders);
  }, [groupByFulfillment, orders]);

  if (loading) {
    return (
      <div className="seller-order-collection-list__state">
        <Spin />
      </div>
    );
  }

  if (!displayOrders.length) {
    return (
      <div className="seller-order-collection-list__state">
        <Empty description={t('orders.collection.empty')} />
      </div>
    );
  }

  return (
    <div className="seller-order-collection-list">
      {displayOrders.map((order) => (
        <SellerOrderCollectionCard
          key={order.id || order.groupKey}
          order={order}
          onOpen={onOpenOrder}
        />
      ))}
    </div>
  );
}
