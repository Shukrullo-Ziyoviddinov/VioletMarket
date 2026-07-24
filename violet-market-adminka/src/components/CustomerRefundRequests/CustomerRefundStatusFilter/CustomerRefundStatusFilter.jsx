import React from 'react';
import './CustomerRefundStatusFilter.css';

const OPTIONS = [
  { key: 'pending', label: 'Kutilmoqda' },
  { key: 'refunded', label: 'Qaytarildi' },
  { key: 'all', label: 'Barchasi' },
];

export default function CustomerRefundStatusFilter({ value = 'pending', onChange, counts }) {
  return (
    <div className="customer-refund-status-filter" role="tablist">
      {OPTIONS.map((option) => {
        const count =
          option.key === 'pending'
            ? counts?.pending
            : option.key === 'refunded'
              ? counts?.refunded
              : null;
        return (
          <button
            key={option.key}
            type="button"
            role="tab"
            aria-selected={value === option.key}
            className={`customer-refund-status-filter__btn${
              value === option.key ? ' customer-refund-status-filter__btn--active' : ''
            }`}
            onClick={() => onChange?.(option.key)}
          >
            {option.label}
            {count != null ? (
              <span className="customer-refund-status-filter__count">{count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
