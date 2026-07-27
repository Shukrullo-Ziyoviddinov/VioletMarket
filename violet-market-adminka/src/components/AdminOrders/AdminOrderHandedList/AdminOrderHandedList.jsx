import React from 'react';
import { Empty, Spin } from 'antd';
import AdminOrderHandedCard from '../AdminOrderHandedCard/AdminOrderHandedCard';
import './AdminOrderHandedList.css';

export default function AdminOrderHandedList({
  orders = [],
  loading = false,
  showSellerCountry = false,
}) {
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
        <Empty description="Kuryerga topshirilgan mahsulotlar yo'q" />
      </div>
    );
  }

  return (
    <div className="seller-order-handed-list">
      {orders.map((order) => (
        <AdminOrderHandedCard
          key={order.id}
          order={order}
          showSellerCountry={showSellerCountry}
        />
      ))}
    </div>
  );
}
