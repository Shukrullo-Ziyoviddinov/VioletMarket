import React from 'react';
import { useTranslation } from 'react-i18next';
import './UserOrderHistoryFilter.css';

const FILTERS = ['in_progress', 'all'];

export default function UserOrderHistoryFilter({ value, onChange }) {
  const { t } = useTranslation();
  const activeIndex = Math.max(0, FILTERS.indexOf(value));

  return (
    <div
      className="user-order-history-filter"
      role="tablist"
      aria-label={t('orderHistory.filter.label')}
    >
      <span
        className="user-order-history-filter__slide"
        style={{ transform: `translateX(calc(${activeIndex} * (100% + 6px)))` }}
        aria-hidden="true"
      />
      {FILTERS.map((filter) => (
        <button
          key={filter}
          type="button"
          role="tab"
          aria-selected={value === filter}
          className={`user-order-history-filter__button${
            value === filter ? ' user-order-history-filter__button--active' : ''
          }`}
          onClick={() => onChange?.(filter)}
        >
          {t(`orderHistory.filter.${filter}`)}
        </button>
      ))}
    </div>
  );
}
