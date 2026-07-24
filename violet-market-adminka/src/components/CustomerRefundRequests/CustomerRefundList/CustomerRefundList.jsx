import React from 'react';
import CustomerRefundCard from '../CustomerRefundCard/CustomerRefundCard';
import './CustomerRefundList.css';

export default function CustomerRefundList({
  items = [],
  loading = false,
  confirmingId = null,
  onConfirm,
}) {
  if (loading) {
    return (
      <div className="customer-refund-list customer-refund-list--empty">
        Yuklanmoqda...
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="customer-refund-list customer-refund-list--empty">
        Pul qaytarish so‘rovlari yo‘q
      </div>
    );
  }

  return (
    <div className="customer-refund-list">
      {items.map((item) => (
        <CustomerRefundCard
          key={item.id}
          item={item}
          confirming={confirmingId === item.id}
          onConfirm={onConfirm}
        />
      ))}
    </div>
  );
}
