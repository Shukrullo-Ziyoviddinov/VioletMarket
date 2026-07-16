import React, { useEffect, useRef } from 'react';
import { DownOutlined } from '@ant-design/icons';
import '../PaymentRequestFilterShared.css';

export default function PaymentRequestStatusFilter({
  value = 'all',
  onChange,
  isOpen = false,
  onOpenChange,
}) {
  const rootRef = useRef(null);
  const options = [
    { value: 'all', label: 'Barcha holatlar' },
    { value: 'in_process', label: 'Jarayonda' },
    { value: 'withdrawn', label: 'Yechilgan' },
    { value: 'rejected', label: 'Rad etilgan' },
  ];

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleOutsideClick(event) {
      if (!rootRef.current?.contains(event.target)) onOpenChange?.(false);
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onOpenChange]);

  const selectedLabel = options.find((item) => item.value === value)?.label || options[0].label;

  return (
    <div className="payment-request-filter" ref={rootRef}>
      <button
        type="button"
        className={`payment-request-filter__trigger${isOpen ? ' payment-request-filter__trigger--open' : ''}`}
        onClick={() => onOpenChange?.(!isOpen)}
      >
        <span>{selectedLabel}</span>
        <DownOutlined />
      </button>
      {isOpen ? (
        <div className="payment-request-filter__panel">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`payment-request-filter__option${
                value === option.value ? ' payment-request-filter__option--active' : ''
              }`}
              onClick={() => {
                onChange?.(option.value);
                onOpenChange?.(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
