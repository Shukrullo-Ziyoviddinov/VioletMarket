import React, { useEffect, useRef } from 'react';
import { DownOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import './SellerEarningsSoldProductsStatusFilter.css';

const STATUS_OPTIONS = [
  { value: 'all', labelKey: 'sellerEarnings.soldProducts.status.all' },
  { value: 'available', labelKey: 'sellerEarnings.soldProducts.status.available' },
  { value: 'in_process', labelKey: 'sellerEarnings.soldProducts.status.inProcess' },
  { value: 'withdrawn', labelKey: 'sellerEarnings.soldProducts.status.withdrawn' },
  { value: 'rejected', labelKey: 'sellerEarnings.soldProducts.status.rejected' },
];

export default function SellerEarningsSoldProductsStatusFilter({
  value = 'all',
  onChange,
  isOpen = false,
  onOpenChange,
}) {
  const { t } = useTranslation();
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

  const selectedLabel =
    t(STATUS_OPTIONS.find((item) => item.value === value)?.labelKey || STATUS_OPTIONS[0].labelKey);

  return (
    <div className="seller-earnings-sold-products-status-filter" ref={rootRef}>
      <button
        type="button"
        className={`seller-earnings-sold-products-status-filter__trigger${
          isOpen ? ' seller-earnings-sold-products-status-filter__trigger--open' : ''
        }`}
        onClick={() => onOpenChange?.(!isOpen)}
      >
        <span>{selectedLabel}</span>
        <DownOutlined />
      </button>

      {isOpen ? (
        <div className="seller-earnings-sold-products-status-filter__panel">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`seller-earnings-sold-products-status-filter__option${
                value === option.value ? ' seller-earnings-sold-products-status-filter__option--active' : ''
              }`}
              onClick={() => {
                onChange?.(option.value);
                onOpenChange?.(false);
              }}
            >
              {t(option.labelKey)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
