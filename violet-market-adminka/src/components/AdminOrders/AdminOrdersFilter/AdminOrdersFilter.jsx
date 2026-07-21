import React from 'react';
import './AdminOrdersFilter.css';

const FILTERS = [
  { key: 'confirmation', label: 'Tasdiqlash' },
  { key: 'collection', label: "Mahsulotni yig'ish" },
  { key: 'courier', label: 'Kuryerga topshirish' },
  { key: 'handed', label: 'Kuryerga topshirilgan' },
  { key: 'noAnswer', label: 'Javob bermadi' },
];

export default function AdminOrdersFilter({ value, onChange, counts = {} }) {
  return (
    <div className="seller-orders-filter" role="tablist" aria-label="Buyurtmalar filtri">
      {FILTERS.map((filter) => {
        const count = Number(counts?.[filter.key]);
        const hasCount = Number.isFinite(count);
        return (
          <button
            key={filter.key}
            type="button"
            role="tab"
            aria-selected={value === filter.key}
            className={`seller-orders-filter__button${
              value === filter.key ? ' seller-orders-filter__button--active' : ''
            }`}
            onClick={() => onChange?.(filter.key)}
          >
            <span className="seller-orders-filter__label">{filter.label}</span>
            {hasCount ? (
              <span className="seller-orders-filter__count">{count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
