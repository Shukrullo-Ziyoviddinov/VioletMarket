import React from 'react';
import PaymentRequestDateFilter, {
  formatPaymentRequestDateParam,
  getDefaultPaymentRequestDateRange,
} from '../PaymentRequestDateFilter/PaymentRequestDateFilter';
import PaymentRequestSellerFilter from '../PaymentRequestSellerFilter/PaymentRequestSellerFilter';
import PaymentRequestStatusFilter from '../PaymentRequestStatusFilter/PaymentRequestStatusFilter';
import './PaymentRequestFiltersBar.css';

export { getDefaultPaymentRequestDateRange, formatPaymentRequestDateParam };

export default function PaymentRequestFiltersBar({
  dateRange,
  onDateRangeChange,
  sellerId,
  onSellerIdChange,
  sellers,
  status,
  onStatusChange,
  openFilter,
  onOpenFilterChange,
}) {
  return (
    <div className="payment-request-filters-bar">
      <PaymentRequestDateFilter value={dateRange} onChange={onDateRangeChange} />
      <PaymentRequestSellerFilter
        value={sellerId}
        sellers={sellers}
        onChange={onSellerIdChange}
        isOpen={openFilter === 'seller'}
        onOpenChange={(next) => onOpenFilterChange(next ? 'seller' : null)}
      />
      <PaymentRequestStatusFilter
        value={status}
        onChange={onStatusChange}
        isOpen={openFilter === 'status'}
        onOpenChange={(next) => onOpenFilterChange(next ? 'status' : null)}
      />
    </div>
  );
}
