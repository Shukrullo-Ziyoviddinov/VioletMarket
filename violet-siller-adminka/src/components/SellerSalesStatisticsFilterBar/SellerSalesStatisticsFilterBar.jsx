import React, { useEffect, useMemo, useRef } from 'react';
import { DownOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import './SellerSalesStatisticsFilterBar.css';

const FILTER_TYPES = [
  { key: 'day', labelKey: 'salesStatistics.filters.day' },
  { key: 'week', labelKey: 'salesStatistics.filters.week' },
  { key: 'month', labelKey: 'salesStatistics.filters.month' },
];

function getSelectedLabel(type, value, options) {
  const list = options?.[type === 'day' ? 'days' : type === 'week' ? 'weeks' : 'months'] || [];
  const match = list.find((item) => item.value === value);
  return match?.label || value || type;
}

export default function SellerSalesStatisticsFilterBar({
  filters,
  filterOptions,
  openFilter,
  onOpenFilterChange,
  onFilterChange,
}) {
  const { t } = useTranslation();
  const rootRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!rootRef.current?.contains(event.target)) {
        onOpenFilterChange(null);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onOpenFilterChange]);

  const selectedLabels = useMemo(
    () => ({
      day: getSelectedLabel('day', filters?.day, filterOptions),
      week: getSelectedLabel('week', filters?.week, filterOptions),
      month: getSelectedLabel('month', filters?.month, filterOptions),
    }),
    [filters, filterOptions],
  );

  const activeOptions = useMemo(() => {
    if (openFilter === 'day') return filterOptions?.days || [];
    if (openFilter === 'week') return filterOptions?.weeks || [];
    if (openFilter === 'month') return filterOptions?.months || [];
    return [];
  }, [openFilter, filterOptions]);

  const handleButtonClick = (type) => {
    onOpenFilterChange(openFilter === type ? null : type);
  };

  const handleOptionSelect = (type, value) => {
    onFilterChange({ ...filters, [type]: value });
    onOpenFilterChange(null);
  };

  return (
    <div className="seller-sales-statistics-filter-bar" ref={rootRef}>
      <div className="seller-sales-statistics-filter-bar__buttons">
        {FILTER_TYPES.map((item) => {
          const isOpen = openFilter === item.key;
          return (
            <div key={item.key} className="seller-sales-statistics-filter-bar__button-wrap">
              <button
                type="button"
                className={`seller-sales-statistics-filter-bar__button${
                  isOpen ? ' seller-sales-statistics-filter-bar__button--active' : ''
                }`}
                onClick={() => handleButtonClick(item.key)}
                aria-expanded={isOpen}
              >
                <span className="seller-sales-statistics-filter-bar__button-title">
                  {t(item.labelKey)}
                </span>
                <span className="seller-sales-statistics-filter-bar__button-value">
                  {selectedLabels[item.key]}
                </span>
                <DownOutlined
                  className={`seller-sales-statistics-filter-bar__button-icon${
                    isOpen ? ' seller-sales-statistics-filter-bar__button-icon--open' : ''
                  }`}
                />
              </button>

              {isOpen ? (
                <div className="seller-sales-statistics-filter-bar__dropdown" role="listbox">
                  {activeOptions.length === 0 ? (
                    <p className="seller-sales-statistics-filter-bar__dropdown-empty">
                      {t('salesStatistics.filters.empty')}
                    </p>
                  ) : (
                    activeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={filters?.[item.key] === option.value}
                        className={`seller-sales-statistics-filter-bar__dropdown-item${
                          filters?.[item.key] === option.value
                            ? ' seller-sales-statistics-filter-bar__dropdown-item--selected'
                            : ''
                        }`}
                        onClick={() => handleOptionSelect(item.key, option.value)}
                      >
                        {option.label}
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
