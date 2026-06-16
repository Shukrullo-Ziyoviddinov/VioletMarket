import React, { useState } from 'react';
import { Select } from 'antd';
import {
  CUSTOMER_STATISTIC_DAY_OPTIONS,
  CUSTOMER_STATISTIC_DEFAULT_FILTERS,
  CUSTOMER_STATISTIC_MONTH_OPTIONS,
  CUSTOMER_STATISTIC_VIEW_OPTIONS,
  CUSTOMER_STATISTIC_WEEK_OPTIONS,
} from './customerStatisticMock';
import './CustomerStatisticFilters.css';

export default function CustomerStatisticFilters({
  value = CUSTOMER_STATISTIC_DEFAULT_FILTERS,
  onChange,
}) {
  const [filters, setFilters] = useState(value);

  const updateFilter = (key, nextValue) => {
    const nextFilters = { ...filters, [key]: nextValue };
    setFilters(nextFilters);
    if (typeof onChange === 'function') {
      onChange(nextFilters);
    }
  };

  return (
    <div className="customer-statistic-filters">
      <div className="customer-statistic-filters__item">
        <span className="customer-statistic-filters__label">Ko&apos;rinishni tanlash:</span>
        <Select
          className="customer-statistic-filters__select"
          value={filters.view}
          options={CUSTOMER_STATISTIC_VIEW_OPTIONS}
          onChange={(nextValue) => updateFilter('view', nextValue)}
        />
      </div>

      <div className="customer-statistic-filters__item">
        <span className="customer-statistic-filters__label">Kun:</span>
        <Select
          className="customer-statistic-filters__select"
          value={filters.day}
          options={CUSTOMER_STATISTIC_DAY_OPTIONS}
          onChange={(nextValue) => updateFilter('day', nextValue)}
        />
      </div>

      <div className="customer-statistic-filters__item">
        <span className="customer-statistic-filters__label">Hafta:</span>
        <Select
          className="customer-statistic-filters__select"
          value={filters.week}
          options={CUSTOMER_STATISTIC_WEEK_OPTIONS}
          onChange={(nextValue) => updateFilter('week', nextValue)}
        />
      </div>

      <div className="customer-statistic-filters__item">
        <span className="customer-statistic-filters__label">Oy:</span>
        <Select
          className="customer-statistic-filters__select"
          value={filters.month}
          options={CUSTOMER_STATISTIC_MONTH_OPTIONS}
          onChange={(nextValue) => updateFilter('month', nextValue)}
        />
      </div>
    </div>
  );
}
