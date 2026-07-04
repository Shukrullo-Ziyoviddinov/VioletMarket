import React from 'react';
import { useTranslation } from 'react-i18next';
import SellerSalesStatisticsMetricCard from '../SellerSalesStatisticsMetricCard/SellerSalesStatisticsMetricCard';
import { formatSellerRevenue } from '../../utils/sellerSalesDisplay';
import './SellerSalesStatisticsMetrics.css';

export default function SellerSalesStatisticsMetrics({ metrics, loading = false }) {
  const { t } = useTranslation();

  const cards = [
    { id: 'daily', title: t('salesStatistics.metrics.daily'), metric: metrics?.daily },
    { id: 'weekly', title: t('salesStatistics.metrics.weekly'), metric: metrics?.weekly },
    { id: 'monthly', title: t('salesStatistics.metrics.monthly'), metric: metrics?.monthly },
  ];

  return (
    <div className="seller-sales-statistics-metrics">
      {cards.map(({ id, title, metric }) => (
        <SellerSalesStatisticsMetricCard
          key={id}
          title={title}
          value={formatSellerRevenue(metric?.value)}
          growthFormatted={metric?.growthFormatted}
          tone={metric?.tone}
          loading={loading}
        />
      ))}
    </div>
  );
}
