import React from 'react';
import CargoFeePaymentCard from '../CargoFeePaymentCard/CargoFeePaymentCard';
import './CargoFeePaymentList.css';

export default function CargoFeePaymentList({ items = [], loading, onOpen }) {
  if (loading) {
    return <div className="cargo-fee-payment-list__state">Yuklanmoqda...</div>;
  }

  if (!items.length) {
    return <div className="cargo-fee-payment-list__state">So‘rovlar yo‘q</div>;
  }

  return (
    <div className="cargo-fee-payment-list">
      {items.map((item) => (
        <CargoFeePaymentCard key={item.id} item={item} onOpen={onOpen} />
      ))}
    </div>
  );
}
