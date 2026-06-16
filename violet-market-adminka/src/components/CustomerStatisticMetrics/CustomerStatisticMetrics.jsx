import React from 'react';
import { CUSTOMER_STATISTIC_MOCK_METRICS } from '../CustomerStatisticFilters/customerStatisticMock';
import CustomerStatisticMetricCard from '../CustomerStatisticMetricCard/CustomerStatisticMetricCard';
import './CustomerStatisticMetrics.css';

export default function CustomerStatisticMetrics({ metrics = CUSTOMER_STATISTIC_MOCK_METRICS }) {
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
