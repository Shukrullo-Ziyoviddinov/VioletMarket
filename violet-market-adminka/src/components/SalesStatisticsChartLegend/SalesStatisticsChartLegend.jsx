import React from 'react';
import './SalesStatisticsChartLegend.css';

export const LEGEND_PREVIEW_LIMIT = 6;

export function formatStatPercentage(value) {
  const amount = Number(value) || 0;
  if (Number.isInteger(amount)) {
    return `${amount}%`;
  }
  return `${amount.toFixed(1)}%`;
}

export default function SalesStatisticsChartLegend({
  items = [],
  limit = LEGEND_PREVIEW_LIMIT,
  scrollable = false,
}) {
  const visibleItems = Number.isFinite(limit) ? items.slice(0, limit) : items;

  return (
    <ul
      className={`sales-statistics-chart-legend${
        scrollable ? ' sales-statistics-chart-legend--scrollable' : ''
      }${Number.isFinite(limit) ? ' sales-statistics-chart-legend--preview' : ''}`}
    >
      {visibleItems.map((item) => (
        <li key={item.id} className="sales-statistics-chart-legend__item">
          <span
            className="sales-statistics-chart-legend__dot"
            style={{ backgroundColor: item.color }}
          />
          <span className="sales-statistics-chart-legend__label">{item.label}</span>
          <span className="sales-statistics-chart-legend__value">
            {formatStatPercentage(item.percentage)}
          </span>
        </li>
      ))}
    </ul>
  );
}
