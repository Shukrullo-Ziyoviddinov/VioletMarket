import React, { useEffect, useMemo, useRef } from 'react';
import { DownOutlined } from '@ant-design/icons';
import './CustomerRefundPeriodFilter.css';

const FILTER_TYPES = [
  { key: 'day', label: 'Kun' },
  { key: 'week', label: 'Hafta' },
  { key: 'month', label: 'Oy' },
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

export default function CustomerRefundPeriodFilter({
  filters,
  filterOptions,
  openFilter,
  activePeriod,
  onOpenFilterChange,
  onFilterChange,
}) {
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

  const handleOptionSelect = (type, value) => {
    onFilterChange({
      ...filters,
      [type]: value,
      period: type,
    });
    onOpenFilterChange(null);
  };

  return (
    <div className="customer-refund-period-filter" ref={rootRef}>
      <div className="customer-refund-period-filter__buttons">
        {FILTER_TYPES.map((item) => {
          const isOpen = openFilter === item.key;
          const isActivePeriod = activePeriod === item.key;
          const options = getOptionsForType(item.key, filterOptions);

          return (
            <div key={item.key} className="customer-refund-period-filter__button-wrap">
              <button
                type="button"
                className={`customer-refund-period-filter__button${
                  isOpen || isActivePeriod
                    ? ' customer-refund-period-filter__button--active'
                    : ''
                }`}
                onClick={() => onOpenFilterChange(isOpen ? null : item.key)}
                aria-expanded={isOpen}
              >
                <span className="customer-refund-period-filter__button-title">
                  {item.label}
                </span>
                <span className="customer-refund-period-filter__button-value">
                  {selectedLabels[item.key]}
                </span>
                <DownOutlined
                  className={`customer-refund-period-filter__button-icon${
                    isOpen ? ' customer-refund-period-filter__button-icon--open' : ''
                  }`}
                />
              </button>

              {isOpen ? (
                <div className="customer-refund-period-filter__dropdown" role="listbox">
                  {options.length === 0 ? (
                    <p className="customer-refund-period-filter__dropdown-empty">
                      Variantlar yo‘q
                    </p>
                  ) : (
                    options.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={filters?.[item.key] === option.value}
                        className={`customer-refund-period-filter__dropdown-item${
                          filters?.[item.key] === option.value
                            ? ' customer-refund-period-filter__dropdown-item--selected'
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
