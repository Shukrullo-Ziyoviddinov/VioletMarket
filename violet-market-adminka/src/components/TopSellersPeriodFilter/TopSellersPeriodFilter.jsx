import React, { useEffect, useRef } from 'react';
import { DownOutlined } from '@ant-design/icons';
import './TopSellersPeriodFilter.css';

const PERIOD_OPTIONS = [
  { value: 'day', label: 'Kunlik' },
  { value: 'week', label: 'Haftalik' },
  { value: 'month', label: 'Oylik' },
];

function getPeriodLabel(value) {
  return PERIOD_OPTIONS.find((item) => item.value === value)?.label || 'Kunlik';
}

export default function TopSellersPeriodFilter({
  value = 'day',
  onChange,
  open = false,
  onOpenChange,
}) {
  const rootRef = useRef(null);

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
    <div className="top-sellers-period-filter" ref={rootRef}>
      <button
        type="button"
        className={`top-sellers-period-filter__button${open ? ' top-sellers-period-filter__button--active' : ''}`}
        onClick={() => onOpenChange?.(!open)}
        aria-expanded={open}
      >
        <span className="top-sellers-period-filter__button-title">Filter</span>
        <span className="top-sellers-period-filter__button-value">{getPeriodLabel(value)}</span>
        <DownOutlined
          className={`top-sellers-period-filter__button-icon${
            open ? ' top-sellers-period-filter__button-icon--open' : ''
          }`}
        />
      </button>

      {open ? (
        <div className="top-sellers-period-filter__dropdown" role="listbox">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={value === option.value}
              className={`top-sellers-period-filter__dropdown-item${
                value === option.value ? ' top-sellers-period-filter__dropdown-item--selected' : ''
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
