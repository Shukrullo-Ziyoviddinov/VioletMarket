import React, { useEffect, useMemo, useRef } from 'react';
import { DownOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import './SellerReturnedOrdersFilterBar.css';

const FILTER_TYPES = [
  { key: 'day', labelKey: 'returnedOrders.filters.day' },
  { key: 'week', labelKey: 'returnedOrders.filters.week' },
  { key: 'month', labelKey: 'returnedOrders.filters.month' },
];

function getSelectedLabel(type, value, options) {
  const list = options?.[type === 'day' ? 'days' : type === 'week' ? 'weeks' : 'months'] || [];
  const match = list.find((item) => item.value === value);
  return match?.label || value || type;
}

function getOptionsForType(type, filterOptions) {
  if (type === 'day') return filterOptions?.days || [];
  if (type === 'week') return filterOptions?.weeks || [];
  if (type === 'month') return filterOptions?.months || [];
  return [];
}

export default function SellerReturnedOrdersFilterBar({
  filters,
  filterOptions,
  openFilter,
  activePeriod,
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

  const handleButtonClick = (type) => {
    onOpenFilterChange(openFilter === type ? null : type);
  };

  const handleOptionSelect = (type, value) => {
    onFilterChange({
      ...filters,
      [type]: value,
      period: type,
    });
    onOpenFilterChange(null);
  };

  return (
    <div className="seller-returned-orders-filter-bar" ref={rootRef}>
      <div className="seller-returned-orders-filter-bar__buttons">
        {FILTER_TYPES.map((item) => {
          const isOpen = openFilter === item.key;
          const isActivePeriod = activePeriod === item.key;
          const options = getOptionsForType(item.key, filterOptions);

          return (
            <div key={item.key} className="seller-returned-orders-filter-bar__button-wrap">
              <button
                type="button"
                className={`seller-returned-orders-filter-bar__button${
                  isOpen || isActivePeriod
                    ? ' seller-returned-orders-filter-bar__button--active'
                    : ''
                }`}
                onClick={() => handleButtonClick(item.key)}
                aria-expanded={isOpen}
              >
                <span className="seller-returned-orders-filter-bar__button-title">
                  {t(item.labelKey)}
                </span>
                <span className="seller-returned-orders-filter-bar__button-value">
                  {selectedLabels[item.key]}
                </span>
                <DownOutlined
                  className={`seller-returned-orders-filter-bar__button-icon${
                    isOpen ? ' seller-returned-orders-filter-bar__button-icon--open' : ''
                  }`}
                />
              </button>

              {isOpen ? (
                <div className="seller-returned-orders-filter-bar__dropdown" role="listbox">
                  {options.length === 0 ? (
                    <p className="seller-returned-orders-filter-bar__dropdown-empty">
                      {t('returnedOrders.filters.empty')}
                    </p>
                  ) : (
                    options.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={filters?.[item.key] === option.value}
                        className={`seller-returned-orders-filter-bar__dropdown-item${
                          filters?.[item.key] === option.value
                            ? ' seller-returned-orders-filter-bar__dropdown-item--selected'
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
