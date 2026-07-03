import React from 'react';
import SalesStatisticsChartLegend from '../SalesStatisticsChartLegend/SalesStatisticsChartLegend';
import './SalesStatisticsLegendModalContent.css';

export default function SalesStatisticsLegendModalContent({
  visible = false,
  periodLabel = '',
  scopeLabel = '',
  items = [],
}) {
  if (!visible) return null;

  return (
    <div className="sales-statistics-legend-modal">
      {scopeLabel ? (
        <p className="sales-statistics-legend-modal__subtitle">
          {periodLabel ? `${periodLabel} · ` : ''}
          {scopeLabel}
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="sales-statistics-legend-modal__empty">
          Tanlangan davr uchun ma&apos;lumot topilmadi
        </p>
      ) : (
        <SalesStatisticsChartLegend items={items} limit={null} scrollable />
      )}
    </div>
  );
}
