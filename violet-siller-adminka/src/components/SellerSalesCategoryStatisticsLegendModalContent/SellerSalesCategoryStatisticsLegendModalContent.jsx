import React from 'react';
import { useTranslation } from 'react-i18next';
import SellerSalesStatisticsChartLegend from '../SellerSalesStatisticsChartLegend/SellerSalesStatisticsChartLegend';
import './SellerSalesCategoryStatisticsLegendModalContent.css';

export default function SellerSalesCategoryStatisticsLegendModalContent({
  periodLabel = '',
  scopeLabel = '',
  items = [],
}) {
  const { t } = useTranslation();

  return (
    <div className="seller-sales-category-statistics-legend-modal">
      {scopeLabel ? (
        <p className="seller-sales-category-statistics-legend-modal__subtitle">
          {periodLabel ? `${periodLabel} · ` : ''}
          {scopeLabel}
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="seller-sales-category-statistics-legend-modal__empty">
          {t('salesStatistics.categoryStats.empty')}
        </p>
      ) : (
        <SellerSalesStatisticsChartLegend items={items} limit={null} scrollable />
      )}
    </div>
  );
}
