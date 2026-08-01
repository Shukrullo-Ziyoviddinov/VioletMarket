import React, { useMemo } from 'react';
import { Empty, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { groupSellerOrdersByFulfillment } from '../../../utils/sellerOrderGroups';
import SellerOrderCard from '../SellerOrderCard/SellerOrderCard';
import './SellerOrdersList.css';

export default function SellerOrdersList({
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
      <div className="seller-orders-list seller-orders-list--loading">
        <Spin />
      </div>
    );
  }

  if (!displayOrders.length) {
    return (
      <div className="seller-orders-list seller-orders-list--empty">
        <Empty description={t('orders.empty')} />
      </div>
    );
  }

  return (
    <div className="seller-orders-list">
      {displayOrders.map((order) => (
        <SellerOrderCard
          key={order.id || order.groupKey}
          order={order}
          onOpen={onOpenOrder}
        />
      ))}
    </div>
  );
}
