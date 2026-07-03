import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DownOutlined } from '@ant-design/icons';
import './SalesStatisticsChartsPeriodFilter.css';

const PERIOD_OPTIONS = [
  { key: 'day', label: 'Kun' },
  { key: 'week', label: 'Hafta' },
  { key: 'month', label: 'Oy' },
];

export default function SalesStatisticsChartsPeriodFilter({
  value = 'day',
  onChange,
}) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedLabel = useMemo(() => {
    const match = PERIOD_OPTIONS.find((item) => item.key === value);
    return match?.label || 'Kun';
  }, [value]);

  const handleSelect = (nextValue) => {
    setOpen(false);
    if (typeof onChange === 'function' && nextValue !== value) {
      onChange(nextValue);
    }
  };

  return (
    <div className="sales-statistics-charts-period-filter" ref={rootRef}>
      <button
        type="button"
        className={`sales-statistics-charts-period-filter__button${
          open ? ' sales-statistics-charts-period-filter__button--active' : ''
        }`}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span className="sales-statistics-charts-period-filter__button-label">
          Filter: {selectedLabel}
        </span>
        <DownOutlined
          className={`sales-statistics-charts-period-filter__button-icon${
            open ? ' sales-statistics-charts-period-filter__button-icon--open' : ''
          }`}
        />
      </button>

      {open ? (
        <div className="sales-statistics-charts-period-filter__dropdown" role="listbox">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              role="option"
              aria-selected={value === option.key}
              className={`sales-statistics-charts-period-filter__dropdown-item${
                value === option.key
                  ? ' sales-statistics-charts-period-filter__dropdown-item--selected'
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
