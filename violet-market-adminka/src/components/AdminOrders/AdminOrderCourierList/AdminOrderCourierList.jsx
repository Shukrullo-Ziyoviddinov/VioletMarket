import React, { useMemo } from 'react';
import { Empty, Spin } from 'antd';
import { groupAdminOrdersByFulfillment } from '../../../utils/adminOrderGroups';
import AdminOrderCourierCard from '../AdminOrderCourierCard/AdminOrderCourierCard';
import './AdminOrderCourierList.css';

export default function AdminOrderCourierList({
  orders = [],
  loading = false,
  onOpenOrder,
  showSellerCountry = false,
  emptyDescription,
  groupByFulfillment = false,
}) {
  const displayOrders = useMemo(() => {
    if (!groupByFulfillment) return orders;
    return groupAdminOrdersByFulfillment(orders);
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
        <Empty
          description={
            emptyDescription || "Kuryerga topshiriladigan mahsulotlar yo'q"
          }
        />
      </div>
    );
  }

  return (
    <div className="seller-order-courier-list">
      {displayOrders.map((order) => (
        <AdminOrderCourierCard
          key={order.id || order.groupKey}
          order={order}
          onOpen={onOpenOrder}
          showSellerCountry={showSellerCountry}
        />
      ))}
    </div>
  );
}
