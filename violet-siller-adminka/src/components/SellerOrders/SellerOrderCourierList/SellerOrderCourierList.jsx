import React, { useMemo } from 'react';
import { Empty, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { groupSellerOrdersByFulfillment } from '../../../utils/sellerOrderGroups';
import SellerOrderCourierCard from '../SellerOrderCourierCard/SellerOrderCourierCard';
import './SellerOrderCourierList.css';

export default function SellerOrderCourierList({
  orders = [],
  loading = false,
  onOpenOrder,
  emptyKey = 'orders.courier.empty',
  /** Bir checkout + bir siller UI bloki (courier / cargo). */
  groupByFulfillment = false,
}) {
  const { t } = useTranslation();

  const displayOrders = useMemo(() => {
    if (!groupByFulfillment) return orders;
    return groupSellerOrdersByFulfillment(orders);
  }, [groupByFulfillment, orders]);

  if (loading) {
    return (
      <div className="seller-order-courier-list__state">
        <Spin />
      </div>
    );
  }

  if (!displayOrders.length) {
    return (
      <div className="seller-order-courier-list__state">
        <Empty description={t(emptyKey)} />
      </div>
    );
  }

  return (
    <div className="seller-order-courier-list">
      {displayOrders.map((order) => (
        <SellerOrderCourierCard
          key={order.id || order.groupKey}
          order={order}
          onOpen={onOpenOrder}
        />
      ))}
    </div>
  );
}
