import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Spin } from 'antd';
import { fetchCustomerStatistics } from '../../api/customerStatisticsAdminApi';
import CustomerActivityChartsSection from '../../components/CustomerActivityChartsSection/CustomerActivityChartsSection';
import CustomerStatisticFilters from '../../components/CustomerStatisticFilters/CustomerStatisticFilters';
import {
  CUSTOMER_STATISTIC_DEFAULT_FILTERS,
} from '../../components/CustomerStatisticFilters/customerStatisticMock';
import CustomerStatisticMetrics from '../../components/CustomerStatisticMetrics/CustomerStatisticMetrics';
import './CustomerStatisticPage.css';

function formatMetricNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value) || 0);
}

function buildMetricsFromApi(apiData) {
  const stats = apiData?.metrics || {};
  return [
    {
      id: 'registered',
      title: "Ro'yxatdan o'tgan foydalanuvchilar",
      value: formatMetricNumber(stats?.registeredUsers?.value),
      footerLabel: stats?.registeredUsers?.compareLabel || "O'tgan oydan: ",
      footerHighlight: stats?.registeredUsers?.compareValue || '0%',
      footerTone: stats?.registeredUsers?.compareTone || 'neutral',
      showChart: true,
    },
    {
      id: 'dau',
      title: 'Kunlik Faol Foydalanuvchilar (DAU)',
      value: formatMetricNumber(stats?.dau?.value),
      footerLabel: stats?.dau?.compareLabel || "O'tgan kundan: ",
      footerHighlight: stats?.dau?.compareValue || '0%',
      footerTone: stats?.dau?.compareTone || 'neutral',
      showChart: false,
    },
    {
      id: 'wau',
      title: 'Haftalik Faol Foydalanuvchilar (WAU)',
      value: formatMetricNumber(stats?.wau?.value),
      footerLabel: stats?.wau?.compareLabel || "O'tgan haftadan: ",
      footerHighlight: stats?.wau?.compareValue || '0%',
      footerTone: stats?.wau?.compareTone || 'neutral',
      showChart: false,
    },
    {
      id: 'mau',
      title: 'Oylik Faol Foydalanuvchilar (MAU)',
      value: formatMetricNumber(stats?.mau?.value),
      footerLabel: stats?.mau?.compareLabel || "O'tgan oydan: ",
      footerHighlight: stats?.mau?.compareValue || '0%',
      footerTone: stats?.mau?.compareTone || 'neutral',
      showChart: false,
    },
  ];
}

export default function CustomerStatisticPage() {
  const [filters, setFilters] = useState(CUSTOMER_STATISTIC_DEFAULT_FILTERS);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadStatistics = useCallback(async (activeFilters) => {
    setLoading(true);
    setError('');
    try {
      const payload = await fetchCustomerStatistics(activeFilters);
      if (payload?.filters) {
        setFilters((prev) => ({ ...prev, ...payload.filters }));
      }
      setMetrics(buildMetricsFromApi(payload));
    } catch (err) {
      setMetrics([]);
      setError(err.message || "Statistikani yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatistics(filters);
  }, [loadStatistics]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = useCallback(
    (nextFilters) => {
      setFilters(nextFilters);
      loadStatistics(nextFilters);
    },
    [loadStatistics],
  );

  const displayMetrics = useMemo(() => metrics, [metrics]);

  return (
    <section className="customer-statistic-page">
      <CustomerStatisticFilters value={filters} onChange={handleFilterChange} />
      {loading ? (
        <div className="customer-statistic-page__state">
          <Spin />
        </div>
      ) : null}
      {error ? <div className="customer-statistic-page__state customer-statistic-page__state--error">{error}</div> : null}
      <CustomerStatisticMetrics metrics={displayMetrics} />
      <CustomerActivityChartsSection />
    </section>
  );
}
