import React from 'react';
import './CargoFeePaymentFilterPaid.css';

export default function CargoFeePaymentFilterPaid({ active, onSelect }) {
  return (
    <button
      type="button"
      className={`cargo-fee-filter-paid${active ? ' cargo-fee-filter-paid--active' : ''}`}
      onClick={() => onSelect?.('paid')}
    >
      To‘langan
    </button>
  );
}
