import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Spin } from 'antd';
import { fetchSalesStatistics } from '../../api/salesStatisticsAdminApi';
import SalesStatisticsFilterBar from '../../components/SalesStatisticsFilterBar/SalesStatisticsFilterBar';
import SalesStatisticsMetrics from '../../components/SalesStatisticsMetrics/SalesStatisticsMetrics';
import SalesStatisticsTotalRevenue from '../../components/SalesStatisticsTotalRevenue/SalesStatisticsTotalRevenue';
import { useGlobalLoader } from '../../context/GlobalLoaderContext';
import './SalesStatisticsPage.css';

const EMPTY_METRICS = {
  daily: { title: 'Kunlik Savdo', value: 0, growthFormatted: '0%', growthLabel: 'tekis', tone: 'neutral' },
  weekly: { title: 'Haftalik Savdo', value: 0, growthFormatted: '0%', growthLabel: 'tekis', tone: 'neutral' },
  monthly: { title: 'Oylik Savdo', value: 0, growthFormatted: '0%', growthLabel: 'tekis', tone: 'neutral' },
};

export default function SalesStatisticsPage() {
  const { setGlobalLoading } = useGlobalLoader();
  const isInitialLoadRef = useRef(true);
  const [filters, setFilters] = useState({ day: '', week: '', month: '' });
  const [filterOptions, setFilterOptions] = useState({ days: [], weeks: [], months: [] });
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [metrics, setMetrics] = useState(EMPTY_METRICS);
  const [openFilter, setOpenFilter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadStatistics = useCallback(async (activeFilters, options = {}) => {
    const useGlobalLoader = options?.useGlobalLoader === true;
    setLoading(true);
    setError('');
    if (useGlobalLoader) {
      setGlobalLoading(true);
    }

    try {
      const payload = await fetchSalesStatistics(activeFilters);
      if (payload?.filters) {
        setFilters(payload.filters);
      }
      setFilterOptions(payload.filterOptions || { days: [], weeks: [], months: [] });
      setTotalRevenue(payload.totalRevenue || 0);
      setMetrics(payload.metrics || EMPTY_METRICS);
    } catch (err) {
      setMetrics(EMPTY_METRICS);
      setTotalRevenue(0);
      setError(err.message || "Sotuv statistikasini yuklashda xatolik yuz berdi");
    } finally {
      if (useGlobalLoader) {
        setGlobalLoading(false);
      }
      setLoading(false);
    }
  }, [setGlobalLoading]);

  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      loadStatistics({}, { useGlobalLoader: true });
    }
  }, [loadStatistics]);

  useEffect(
    () => () => {
      setGlobalLoading(false);
    },
    [setGlobalLoading],
  );

  const handleFilterChange = useCallback(
    (nextFilters) => {
      setFilters(nextFilters);
      loadStatistics(nextFilters, { useGlobalLoader: false });
    },
    [loadStatistics],
  );

  return (
    <section className="sales-statistics-page">
      {error ? (
        <Alert className="sales-statistics-page__alert" type="error" message={error} showIcon />
      ) : null}

      <div className="sales-statistics-page__toolbar">
        <SalesStatisticsFilterBar
          filters={filters}
          filterOptions={filterOptions}
          openFilter={openFilter}
          onOpenFilterChange={setOpenFilter}
          onFilterChange={handleFilterChange}
        />
        <SalesStatisticsTotalRevenue value={totalRevenue} loading={loading} />
      </div>

      <div className="sales-statistics-page__metrics-wrap">
        {loading ? <Spin className="sales-statistics-page__spinner" /> : null}
        <SalesStatisticsMetrics metrics={metrics} loading={loading} />
      </div>
    </section>
  );
}
