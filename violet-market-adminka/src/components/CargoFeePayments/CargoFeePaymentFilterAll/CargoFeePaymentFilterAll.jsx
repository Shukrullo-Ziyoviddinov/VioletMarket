import React from 'react';
import './CargoFeePaymentFilterAll.css';

export default function CargoFeePaymentFilterAll({ active, onSelect }) {
  return (
    <button
      type="button"
      className={`cargo-fee-filter-all${active ? ' cargo-fee-filter-all--active' : ''}`}
      onClick={() => onSelect?.('all')}
    >
      Barchasi
    </button>
  );
}
