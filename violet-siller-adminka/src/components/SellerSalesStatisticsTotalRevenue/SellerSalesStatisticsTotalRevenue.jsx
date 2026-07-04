import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatSellerRevenue } from '../../utils/sellerSalesDisplay';
import './SellerSalesStatisticsTotalRevenue.css';

export default function SellerSalesStatisticsTotalRevenue({ value, loading = false }) {
  const { t } = useTranslation();

  return (
    <article className="seller-sales-statistics-total-revenue">
      <p className="seller-sales-statistics-total-revenue__label">
        {t('salesStatistics.totalRevenue')}
      </p>
      <p className="seller-sales-statistics-total-revenue__value">
        {loading ? '...' : formatSellerRevenue(value)}
      </p>
    </article>
  );
}
