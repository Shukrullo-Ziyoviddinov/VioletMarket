import React from 'react';
import { useTranslation } from 'react-i18next';
import './UserOrderHistoryFilter.css';

const FILTERS = ['in_progress', 'all'];

export default function UserOrderHistoryFilter({ value, onChange }) {
  const { t } = useTranslation();

  return (
    <div className="user-order-history-filter" role="tablist" aria-label={t('orderHistory.filter.label')}>
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
