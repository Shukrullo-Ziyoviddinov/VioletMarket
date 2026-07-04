import React, { useEffect, useRef } from 'react';
import { DownOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import './SellerTopSellingProductsPeriodFilter.css';

export default function SellerTopSellingProductsPeriodFilter({
  value = 'day',
  onChange,
  open = false,
  onOpenChange,
}) {
  const { t } = useTranslation();
  const rootRef = useRef(null);

  const periodOptions = [
    { value: 'day', label: t('salesStatistics.topProducts.period.day') },
    { value: 'week', label: t('salesStatistics.topProducts.period.week') },
    { value: 'month', label: t('salesStatistics.topProducts.period.month') },
  ];

  const selectedLabel = periodOptions.find((item) => item.value === value)?.label
    || t('salesStatistics.topProducts.period.day');

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!rootRef.current?.contains(event.target)) {
        onOpenChange?.(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onOpenChange]);

  const handleSelect = (nextValue) => {
    onChange?.(nextValue);
    onOpenChange?.(false);
  };

  return (
    <div className="seller-top-selling-products-period-filter" ref={rootRef}>
      <button
        type="button"
        className={`seller-top-selling-products-period-filter__button${
          open ? ' seller-top-selling-products-period-filter__button--active' : ''
        }`}
        onClick={() => onOpenChange?.(!open)}
        aria-expanded={open}
      >
        <span className="seller-top-selling-products-period-filter__button-title">
          {t('salesStatistics.topProducts.filter')}
        </span>
        <span className="seller-top-selling-products-period-filter__button-value">{selectedLabel}</span>
        <DownOutlined
          className={`seller-top-selling-products-period-filter__button-icon${
            open ? ' seller-top-selling-products-period-filter__button-icon--open' : ''
          }`}
        />
      </button>

      {open ? (
        <div className="seller-top-selling-products-period-filter__dropdown" role="listbox">
          {periodOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={value === option.value}
              className={`seller-top-selling-products-period-filter__dropdown-item${
                value === option.value ? ' seller-top-selling-products-period-filter__dropdown-item--selected' : ''
              }`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
