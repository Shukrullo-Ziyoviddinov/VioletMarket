import React from 'react';
import './ReturnedProductsReasonFilter.css';

const OPTIONS = [
  { key: 'all', label: 'Barchasi' },
  { key: 'return', label: 'Qaytarilgan' },
  { key: 'defective', label: 'Yaroqsiz' },
];

export default function ReturnedProductsReasonFilter({ value = 'all', onChange }) {
  return (
    <div className="returned-products-reason-filter" role="tablist">
      {OPTIONS.map((option) => (
        <button
          key={option.key}
          type="button"
          role="tab"
          aria-selected={value === option.key}
          className={`returned-products-reason-filter__btn${
            value === option.key ? ' returned-products-reason-filter__btn--active' : ''
          }`}
          onClick={() => onChange?.(option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
