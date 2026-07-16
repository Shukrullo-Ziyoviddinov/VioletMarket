import React from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import SellerEarningsSoldProductsDateFilter, {
  formatSoldProductsDateParam,
  getDefaultSoldProductsDateRange,
} from '../../SellerEarnings/SellerEarningsSoldProductsDateFilter/SellerEarningsSoldProductsDateFilter';
import './SellerWithdrawalsFiltersBar.css';

export { getDefaultSoldProductsDateRange as getDefaultSellerWithdrawalsDateRange };
export { formatSoldProductsDateParam as formatSellerWithdrawalsDateParam };

export default function SellerWithdrawalsFiltersBar({
  dateRange,
  onDateRangeChange,
  search,
  onSearchChange,
}) {
  const { t } = useTranslation();

  return (
    <div className="seller-withdrawals-filters-bar">
      <Input
        allowClear
        className="seller-withdrawals-filters-bar__search"
        placeholder={t('sellerWithdrawals.filters.searchPlaceholder')}
        prefix={<SearchOutlined />}
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <SellerEarningsSoldProductsDateFilter value={dateRange} onChange={onDateRangeChange} />
    </div>
  );
}
