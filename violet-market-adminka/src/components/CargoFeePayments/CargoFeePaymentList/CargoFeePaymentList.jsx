import React from 'react';
import { Empty } from 'antd';
import CargoFeePaymentCard from '../CargoFeePaymentCard/CargoFeePaymentCard';
import './CargoFeePaymentList.css';

export default function CargoFeePaymentList({ items = [], loading, onOpen }) {
  if (loading) {
    return null;
  }

  if (!items.length) {
    return (
      <div className="cargo-fee-payment-list__state">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Hozircha cargo to‘lov so‘rovlari yo‘q"
        />
      </div>
    );
  }

  return (
    <div className="cargo-fee-payment-list">
      {items.map((item) => (
        <CargoFeePaymentCard key={item.id} item={item} onOpen={onOpen} />
      ))}
    </div>
  );
}
