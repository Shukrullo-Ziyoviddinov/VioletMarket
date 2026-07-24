import React from 'react';
import { useTranslation } from 'react-i18next';
import SellerSalesStatisticsChartLegend from '../SellerSalesStatisticsChartLegend/SellerSalesStatisticsChartLegend';
import './SellerReturnedStatisticsLegendModalContent.css';

export default function SellerReturnedStatisticsLegendModalContent({
  periodLabel = '',
  scopeLabel = '',
  items = [],
  emptyKey = 'returnedOrders.categoryStats.empty',
}) {
  const { t } = useTranslation();

  return (
    <div className="seller-returned-statistics-legend-modal">
      {scopeLabel ? (
        <p className="seller-returned-statistics-legend-modal__subtitle">
          {periodLabel ? `${periodLabel} · ` : ''}
          {scopeLabel}
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="seller-returned-statistics-legend-modal__empty">{t(emptyKey)}</p>
      ) : (
        <SellerSalesStatisticsChartLegend items={items} limit={null} scrollable />
      )}
    </div>
  );
}
