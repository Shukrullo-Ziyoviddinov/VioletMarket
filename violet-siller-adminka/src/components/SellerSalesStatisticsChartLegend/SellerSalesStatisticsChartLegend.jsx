import React from 'react';
import './SellerSalesStatisticsChartLegend.css';

export const SELLER_LEGEND_PREVIEW_LIMIT = 6;

export function formatSellerStatPercentage(value) {
  const amount = Number(value) || 0;
  if (Number.isInteger(amount)) {
    return `${amount}%`;
  }
  return `${amount.toFixed(1)}%`;
}

export default function SellerSalesStatisticsChartLegend({
  items = [],
  limit = SELLER_LEGEND_PREVIEW_LIMIT,
  scrollable = false,
}) {
  const visibleItems = Number.isFinite(limit) ? items.slice(0, limit) : items;

  return (
    <ul
      className={`seller-sales-statistics-chart-legend${
        scrollable ? ' seller-sales-statistics-chart-legend--scrollable' : ''
      }${Number.isFinite(limit) ? ' seller-sales-statistics-chart-legend--preview' : ''}`}
    >
      {visibleItems.map((item) => (
        <li key={item.id} className="seller-sales-statistics-chart-legend__item">
          <span
            className="seller-sales-statistics-chart-legend__dot"
            style={{ backgroundColor: item.color }}
          />
          <span className="seller-sales-statistics-chart-legend__label">{item.label}</span>
          <span className="seller-sales-statistics-chart-legend__value">
            {formatSellerStatPercentage(item.percentage)}
          </span>
        </li>
      ))}
    </ul>
  );
}
