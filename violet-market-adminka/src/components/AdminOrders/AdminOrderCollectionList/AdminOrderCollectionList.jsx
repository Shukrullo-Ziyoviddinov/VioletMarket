import React, { useMemo } from 'react';
import { Empty, Spin } from 'antd';
import { groupAdminOrdersByFulfillment } from '../../../utils/adminOrderGroups';
import AdminOrderCollectionCard from '../AdminOrderCollectionCard/AdminOrderCollectionCard';
import './AdminOrderCollectionList.css';

export default function AdminOrderCollectionList({
  orders = [],
  loading = false,
  onOpenOrder,
  groupByFulfillment = false,
}) {
  const displayOrders = useMemo(() => {
    if (!groupByFulfillment) return orders;
    return groupAdminOrdersByFulfillment(orders);
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
        <Empty description="Yig'ish uchun mahsulotlar yo'q" />
      </div>
    );
  }

  return (
    <div className="seller-order-collection-list">
      {displayOrders.map((order) => (
        <AdminOrderCollectionCard
          key={order.id || order.groupKey}
          order={order}
          onOpen={onOpenOrder}
        />
      ))}
    </div>
  );
}
