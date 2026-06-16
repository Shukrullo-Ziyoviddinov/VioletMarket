import React from 'react';
import CustomerActivityChartsSection from '../../components/CustomerActivityChartsSection/CustomerActivityChartsSection';
import CustomerStatisticFilters from '../../components/CustomerStatisticFilters/CustomerStatisticFilters';
import CustomerStatisticMetrics from '../../components/CustomerStatisticMetrics/CustomerStatisticMetrics';
import './CustomerStatisticPage.css';

export default function CustomerStatisticPage() {
  return (
    <section className="customer-statistic-page">
      <CustomerStatisticFilters />
      <CustomerStatisticMetrics />
      <CustomerActivityChartsSection />
    </section>
  );
}
