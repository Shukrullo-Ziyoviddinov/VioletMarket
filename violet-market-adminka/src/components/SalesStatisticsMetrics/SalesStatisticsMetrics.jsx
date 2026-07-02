import React from 'react';
import SalesStatisticsMetricCard from '../SalesStatisticsMetricCard/SalesStatisticsMetricCard';
import { formatRevenue } from '../../utils/productDisplay';
import './SalesStatisticsMetrics.css';

export default function SalesStatisticsMetrics({ metrics, loading = false }) {
  const cards = [
    { id: 'daily', metric: metrics?.daily },
    { id: 'weekly', metric: metrics?.weekly },
    { id: 'monthly', metric: metrics?.monthly },
  ];

  return (
    <div className="sales-statistics-metrics">
      {cards.map(({ id, metric }) => (
        <SalesStatisticsMetricCard
          key={id}
          title={metric?.title || ''}
          value={formatRevenue(metric?.value)}
          growthFormatted={metric?.growthFormatted}
          growthLabel={metric?.growthLabel}
          tone={metric?.tone}
          loading={loading}
        />
      ))}
    </div>
  );
}
