import React from 'react';
import { useTranslation } from 'react-i18next';
import './SellerOrdersFilter.css';

const FILTERS = ['confirmation', 'collection', 'courier', 'handed'];

export default function SellerOrdersFilter({ value, onChange }) {
  const { t } = useTranslation();

  return (
    <div className="seller-orders-filter" role="tablist" aria-label={t('orders.filter.label')}>
      {FILTERS.map((filter) => (
        <button
          key={filter}
          type="button"
          role="tab"
          aria-selected={value === filter}
          className={`seller-orders-filter__button${
            value === filter ? ' seller-orders-filter__button--active' : ''
          }`}
          onClick={() => onChange?.(filter)}
        >
          {t(`orders.filter.${filter}`)}
        </button>
      ))}
    </div>
  );
}
