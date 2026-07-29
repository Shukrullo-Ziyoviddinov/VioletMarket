import React from 'react';
import './CargoFeePaymentFilterUnpaid.css';

export default function CargoFeePaymentFilterUnpaid({ active, onSelect }) {
  return (
    <button
      type="button"
      className={`cargo-fee-filter-unpaid${
        active ? ' cargo-fee-filter-unpaid--active' : ''
      }`}
      onClick={() => onSelect?.('unpaid')}
    >
      To‘lanmagan
    </button>
  );
}
