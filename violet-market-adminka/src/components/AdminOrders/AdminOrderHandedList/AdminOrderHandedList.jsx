import React, { useMemo } from 'react';
import { Empty, Spin } from 'antd';
import { groupAdminOrdersByFulfillment } from '../../../utils/adminOrderGroups';
import AdminOrderHandedCard from '../AdminOrderHandedCard/AdminOrderHandedCard';
import './AdminOrderHandedList.css';

export default function AdminOrderHandedList({
  orders = [],
  loading = false,
  showSellerCountry = false,
  groupByFulfillment = false,
}) {
  const displayOrders = useMemo(() => {
    if (!groupByFulfillment) return orders;
    return groupAdminOrdersByFulfillment(orders);
  }, [groupByFulfillment, orders]);

  if (loading) {
    return (
      <div className="seller-order-handed-list__state">
        <Spin />
      </div>
    );
  }

  if (!displayOrders.length) {
    return (
      <div className="seller-order-handed-list__state">
        <Empty description="Kuryerga topshirilgan mahsulotlar yo'q" />
      </div>
    );
  }

  return (
    <div className="seller-order-handed-list">
      {displayOrders.map((order) => (
        <AdminOrderHandedCard
          key={order.id || order.groupKey}
          order={order}
          showSellerCountry={showSellerCountry}
        />
      ))}
    </div>
  );
}
