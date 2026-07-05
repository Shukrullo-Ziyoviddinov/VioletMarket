import React, { useEffect, useRef } from 'react';
import { DownOutlined } from '@ant-design/icons';
import '../PaymentRequestFilterShared.css';

export default function PaymentRequestSellerFilter({
  value = 'all',
  sellers = [],
  onChange,
  isOpen = false,
  onOpenChange,
}) {
  const rootRef = useRef(null);
  const options = [{ value: 'all', label: 'Barcha sellerlar' }].concat(
    sellers.map((seller) => ({
      value: seller.sellerId,
      label: seller.name || seller.sellerId,
    })),
  );

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!rootRef.current?.contains(event.target)) onOpenChange?.(false);
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onOpenChange]);

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
        <div className="payment-request-filter__panel payment-request-filter__panel--wide">
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
