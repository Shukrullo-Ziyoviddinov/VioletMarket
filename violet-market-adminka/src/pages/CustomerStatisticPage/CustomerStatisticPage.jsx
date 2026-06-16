import React from 'react';
import CustomerStatisticFilters from '../../components/CustomerStatisticFilters/CustomerStatisticFilters';
import CustomerStatisticMetrics from '../../components/CustomerStatisticMetrics/CustomerStatisticMetrics';
import './CustomerStatisticPage.css';

export default function CustomerStatisticPage() {
  return (
    <section className="customer-statistic-page">
      <CustomerStatisticFilters />
      <CustomerStatisticMetrics />
    </section>
  );
}
