import React from 'react';
import { useTranslation } from 'react-i18next';
import './SellerSalesStatisticsMoreButton.css';

export default function SellerSalesStatisticsMoreButton({ onClick }) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className="seller-sales-statistics-more-button"
      onClick={onClick}
    >
      {t('salesStatistics.topProducts.more')}
    </button>
  );
}
