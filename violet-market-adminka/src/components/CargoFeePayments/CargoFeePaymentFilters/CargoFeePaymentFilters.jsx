import React from 'react';
import CargoFeePaymentFilterAll from '../CargoFeePaymentFilterAll/CargoFeePaymentFilterAll';
import CargoFeePaymentFilterPaid from '../CargoFeePaymentFilterPaid/CargoFeePaymentFilterPaid';
import CargoFeePaymentFilterUnpaid from '../CargoFeePaymentFilterUnpaid/CargoFeePaymentFilterUnpaid';
import './CargoFeePaymentFilters.css';

const FILTERS = ['all', 'paid', 'unpaid'];

export default function CargoFeePaymentFilters({ value = 'all', onChange }) {
  const activeIndex = Math.max(0, FILTERS.indexOf(value));

  return (
    <div className="cargo-fee-payment-filters" role="tablist">
      <span
        className="cargo-fee-payment-filters__slide"
        style={{
          transform: `translateX(calc(${activeIndex} * (100% + 6px)))`,
          width: 'calc((100% - 22px) / 3)',
        }}
        aria-hidden="true"
      />
      <CargoFeePaymentFilterAll
        active={value === 'all'}
        onSelect={onChange}
      />
      <CargoFeePaymentFilterPaid
        active={value === 'paid'}
        onSelect={onChange}
      />
      <CargoFeePaymentFilterUnpaid
        active={value === 'unpaid'}
        onSelect={onChange}
      />
    </div>
  );
}
