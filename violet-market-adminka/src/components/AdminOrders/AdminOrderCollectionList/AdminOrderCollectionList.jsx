import React from 'react';
import { Empty, Spin } from 'antd';
import AdminOrderCollectionCard from '../AdminOrderCollectionCard/AdminOrderCollectionCard';
import './AdminOrderCollectionList.css';

export default function AdminOrderCollectionList({
  orders = [],
  loading = false,
  onOpenOrder,
}) {
  if (loading) {
    return (
      <div className="seller-order-collection-list__state">
        <Spin />
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="seller-order-collection-list__state">
        <Empty description="Yig'ish uchun mahsulotlar yo'q" />
      </div>
    );
  }

  return (
    <div className="seller-order-collection-list">
      {orders.map((order) => (
        <AdminOrderCollectionCard key={order.id} order={order} onOpen={onOpenOrder} />
      ))}
    </div>
  );
}
