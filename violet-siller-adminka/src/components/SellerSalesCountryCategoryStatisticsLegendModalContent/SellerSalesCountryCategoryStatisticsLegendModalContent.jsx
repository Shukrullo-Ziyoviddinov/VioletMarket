import React from 'react';
import { useTranslation } from 'react-i18next';
import SellerSalesStatisticsChartLegend from '../SellerSalesStatisticsChartLegend/SellerSalesStatisticsChartLegend';
import './SellerSalesCountryCategoryStatisticsLegendModalContent.css';

export default function SellerSalesCountryCategoryStatisticsLegendModalContent({
  periodLabel = '',
  scopeLabel = '',
  items = [],
}) {
  const { t } = useTranslation();

  return (
    <div className="seller-sales-country-category-statistics-legend-modal">
      {scopeLabel ? (
        <p className="seller-sales-country-category-statistics-legend-modal__subtitle">
          {periodLabel ? `${periodLabel} · ` : ''}
          {scopeLabel}
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="seller-sales-country-category-statistics-legend-modal__empty">
          {t('salesStatistics.countryStats.empty')}
        </p>
      ) : (
        <SellerSalesStatisticsChartLegend items={items} limit={null} scrollable />
      )}
    </div>
  );
}
