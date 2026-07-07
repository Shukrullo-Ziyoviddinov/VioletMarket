import React from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
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
  search,
  onSearchChange,
  openFilter,
  onOpenFilterChange,
}) {
  return (
    <div className="payment-request-withdrawal-filters-bar">
      <Input
        allowClear
        className="payment-request-withdrawal-filters-bar__search"
        placeholder="Seller nomi yoki ID"
        prefix={<SearchOutlined />}
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
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
