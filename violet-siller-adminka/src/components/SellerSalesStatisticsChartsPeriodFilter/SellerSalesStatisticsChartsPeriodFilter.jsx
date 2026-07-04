import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DownOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import './SellerSalesStatisticsChartsPeriodFilter.css';

export default function SellerSalesStatisticsChartsPeriodFilter({
  value = 'day',
  onChange,
  i18nNamespace = 'salesStatistics.categoryStats',
}) {
  const { t } = useTranslation();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);

  const periodOptions = useMemo(
    () => [
      { key: 'day', label: t(`${i18nNamespace}.period.day`) },
      { key: 'week', label: t(`${i18nNamespace}.period.week`) },
      { key: 'month', label: t(`${i18nNamespace}.period.month`) },
    ],
    [i18nNamespace, t],
  );

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedLabel = periodOptions.find((item) => item.key === value)?.label
    || t(`${i18nNamespace}.period.day`);

  const handleSelect = (nextValue) => {
    setOpen(false);
    if (typeof onChange === 'function' && nextValue !== value) {
      onChange(nextValue);
    }
  };

  return (
    <div className="seller-sales-statistics-charts-period-filter" ref={rootRef}>
      <button
        type="button"
        className={`seller-sales-statistics-charts-period-filter__button${
          open ? ' seller-sales-statistics-charts-period-filter__button--active' : ''
        }`}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span className="seller-sales-statistics-charts-period-filter__button-label">
          {t(`${i18nNamespace}.filterLabel`, { period: selectedLabel })}
        </span>
        <DownOutlined
          className={`seller-sales-statistics-charts-period-filter__button-icon${
            open ? ' seller-sales-statistics-charts-period-filter__button-icon--open' : ''
          }`}
        />
      </button>

      {open ? (
        <div className="seller-sales-statistics-charts-period-filter__dropdown" role="listbox">
          {periodOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              role="option"
              aria-selected={value === option.key}
              className={`seller-sales-statistics-charts-period-filter__dropdown-item${
                value === option.key
                  ? ' seller-sales-statistics-charts-period-filter__dropdown-item--selected'
                  : ''
              }`}
              onClick={() => handleSelect(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
