import React from 'react';
import CustomerStatisticMetricCard from '../CustomerStatisticMetricCard/CustomerStatisticMetricCard';
import './CustomerStatisticMetrics.css';

export default function CustomerStatisticMetrics({ metrics = [] }) {
  return (
    <div className="customer-statistic-metrics">
      {metrics.map((metric) => (
        <CustomerStatisticMetricCard
          key={metric.id}
          title={metric.title}
          value={metric.value}
          footerLabel={metric.footerLabel}
          footerHighlight={metric.footerHighlight}
          footerTone={metric.footerTone}
          showChart={metric.showChart}
        />
      ))}
    </div>
  );
}
