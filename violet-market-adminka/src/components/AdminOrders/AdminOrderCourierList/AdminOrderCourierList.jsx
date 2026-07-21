import React from 'react';
import { Empty, Spin } from 'antd';
import AdminOrderCourierCard from '../AdminOrderCourierCard/AdminOrderCourierCard';
import './AdminOrderCourierList.css';

export default function AdminOrderCourierList({
  orders = [],
  loading = false,
  onOpenOrder,
}) {
  if (loading) {
    return (
      <div className="seller-order-courier-list__state">
        <Spin />
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="seller-order-courier-list__state">
        <Empty description="Kuryerga topshiriladigan mahsulotlar yo'q" />
      </div>
    );
  }

  return (
    <div className="seller-order-courier-list">
      {orders.map((order) => (
        <AdminOrderCourierCard key={order.id} order={order} onOpen={onOpenOrder} />
      ))}
    </div>
  );
}
