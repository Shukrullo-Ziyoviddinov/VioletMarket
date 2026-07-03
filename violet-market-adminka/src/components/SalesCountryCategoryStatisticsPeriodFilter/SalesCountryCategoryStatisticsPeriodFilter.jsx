import React from 'react';
import './SalesCountryCategoryStatisticsPeriodFilter.css';

const PERIOD_OPTIONS = [
  { key: 'day', label: 'Kun' },
  { key: 'week', label: 'Hafta' },
  { key: 'month', label: 'Oy' },
];

export default function SalesCountryCategoryStatisticsPeriodFilter({
  value = 'day',
  onChange,
}) {
  return (
    <div className="sales-country-category-statistics-period-filter">
      {PERIOD_OPTIONS.map((option) => (
        <button
          key={option.key}
          type="button"
          className={`sales-country-category-statistics-period-filter__btn${
            value === option.key ? ' sales-country-category-statistics-period-filter__btn--active' : ''
          }`}
          onClick={() => {
            if (typeof onChange === 'function') {
              onChange(option.key);
            }
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
