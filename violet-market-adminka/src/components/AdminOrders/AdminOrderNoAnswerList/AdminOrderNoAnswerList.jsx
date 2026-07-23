import React from 'react';
import { Empty, Spin } from 'antd';
import AdminOrderNoAnswerCard from '../AdminOrderNoAnswerCard/AdminOrderNoAnswerCard';
import './AdminOrderNoAnswerList.css';

export default function AdminOrderNoAnswerList({
  orders = [],
  loading = false,
  onReHandoff,
  onReactivate,
  onDeliver,
}) {
  if (loading && !orders.length) {
    return (
      <div className="seller-order-no-answer-list__state">
        <Spin />
      </div>
    );
  }

  if (!loading && !orders.length) {
    return (
      <div className="seller-order-no-answer-list__state">
        <Empty description="Javob bermagan buyurtmalar yo'q" />
      </div>
    );
  }

  return (
    <div className="seller-order-no-answer-list">
      {loading ? (
        <div className="seller-order-no-answer-list__loading-bar">
          <Spin size="small" />
        </div>
      ) : null}
      {orders.map((order) => (
        <AdminOrderNoAnswerCard
          key={order.id}
          order={order}
          onReHandoff={onReHandoff}
          onReactivate={onReactivate}
          onDeliver={onDeliver}
        />
      ))}
    </div>
  );
}
