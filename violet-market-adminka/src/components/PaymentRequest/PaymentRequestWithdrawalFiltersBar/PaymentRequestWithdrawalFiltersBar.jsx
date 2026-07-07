import React from 'react';
import PaymentRequestDateFilter, {
  formatPaymentRequestDateParam,
  getDefaultPaymentRequestDateRange,
} from '../PaymentRequestDateFilter/PaymentRequestDateFilter';
import PaymentRequestSellerFilter from '../PaymentRequestSellerFilter/PaymentRequestSellerFilter';
import './PaymentRequestWithdrawalFiltersBar.css';

export { getDefaultPaymentRequestDateRange, formatPaymentRequestDateParam };

export default function PaymentRequestWithdrawalFiltersBar({
  dateRange,
  onDateRangeChange,
  sellerId,
  onSellerIdChange,
  sellers,
  openFilter,
  onOpenFilterChange,
}) {
  return (
    <div className="payment-request-withdrawal-filters-bar">
      <PaymentRequestDateFilter value={dateRange} onChange={onDateRangeChange} />
      <PaymentRequestSellerFilter
        value={sellerId}
        sellers={sellers}
        onChange={onSellerIdChange}
        isOpen={openFilter === 'seller'}
        onOpenChange={(next) => onOpenFilterChange(next ? 'seller' : null)}
      />
    </div>
  );
}
