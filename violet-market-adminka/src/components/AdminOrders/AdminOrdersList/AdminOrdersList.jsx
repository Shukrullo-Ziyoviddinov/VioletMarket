import React from 'react';
import { Empty, Spin } from 'antd';
import AdminOrderCard from '../AdminOrderCard/AdminOrderCard';
import './AdminOrdersList.css';

export default function AdminOrdersList({ orders = [], loading = false, onOpenOrder }) {
  if (loading) {
    return (
      <div className="seller-orders-list seller-orders-list--loading">
        <Spin />
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="seller-orders-list seller-orders-list--empty">
        <Empty description="Hozircha buyurtmalar yo'q" />
      </div>
    );
  }

  return (
    <div className="seller-orders-list">
      {orders.map((order) => (
        <AdminOrderCard key={order.id} order={order} onOpen={onOpenOrder} />
      ))}
    </div>
  );
}
