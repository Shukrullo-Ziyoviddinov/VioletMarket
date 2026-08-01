import React, { useMemo } from 'react';
import { Empty, Spin } from 'antd';
import { groupAdminOrdersByFulfillment } from '../../../utils/adminOrderGroups';
import AdminOrderCard from '../AdminOrderCard/AdminOrderCard';
import './AdminOrdersList.css';

export default function AdminOrdersList({
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
      <div className="seller-orders-list seller-orders-list--loading">
        <Spin />
      </div>
    );
  }

  if (!displayOrders.length) {
    return (
      <div className="seller-orders-list seller-orders-list--empty">
        <Empty description="Hozircha buyurtmalar yo'q" />
      </div>
    );
  }

  return (
    <div className="seller-orders-list">
      {displayOrders.map((order) => (
        <AdminOrderCard
          key={order.id || order.groupKey}
          order={order}
          onOpen={onOpenOrder}
        />
      ))}
    </div>
  );
}
