import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Spin } from 'antd';
import { fetchSalesRevenueChart, fetchSalesStatistics } from '../../api/salesStatisticsAdminApi';
import SalesRevenueChart from '../../components/SalesRevenueChart/SalesRevenueChart';
import SalesStatisticsFilterBar from '../../components/SalesStatisticsFilterBar/SalesStatisticsFilterBar';
import SalesStatisticsMetrics from '../../components/SalesStatisticsMetrics/SalesStatisticsMetrics';
import SalesStatisticsTotalRevenue from '../../components/SalesStatisticsTotalRevenue/SalesStatisticsTotalRevenue';
import { useGlobalLoader } from '../../context/GlobalLoaderContext';
import './SalesStatisticsPage.css';

const EMPTY_METRICS = {
  daily: { title: 'Kunlik Savdo', value: 0, growthFormatted: '0%', tone: 'neutral' },
  weekly: { title: 'Haftalik Savdo', value: 0, growthFormatted: '0%', tone: 'neutral' },
  monthly: { title: 'Oylik Savdo', value: 0, growthFormatted: '0%', tone: 'neutral' },
};

export default function SalesStatisticsPage() {
  const { setGlobalLoading } = useGlobalLoader();
  const isInitialLoadRef = useRef(true);
  const [filters, setFilters] = useState({ day: '', week: '', month: '' });
  const [filterOptions, setFilterOptions] = useState({ days: [], weeks: [], months: [] });
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [metrics, setMetrics] = useState(EMPTY_METRICS);
  const [chartGranularity, setChartGranularity] = useState('day');
  const [chartPoints, setChartPoints] = useState([]);
  const [chartTone, setChartTone] = useState('neutral');
  const [openFilter, setOpenFilter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState('');

  const loadChart = useCallback(async (activeFilters, granularity) => {
    setChartLoading(true);
    try {
      const payload = await fetchSalesRevenueChart({
        ...activeFilters,
        granularity,
      });
      setChartPoints(payload.points || []);
      setChartTone(payload.overallTone || 'neutral');
      if (payload.granularity) {
        setChartGranularity(payload.granularity);
      }
    } catch {
      setChartPoints([]);
      setChartTone('neutral');
    } finally {
      setChartLoading(false);
    }
  }, []);

  const loadStatistics = useCallback(async (activeFilters, options = {}) => {
    const useGlobalLoader = options?.useGlobalLoader === true;
    const granularity = options?.granularity || chartGranularity;
    setLoading(true);
    setError('');
    if (useGlobalLoader) {
      setGlobalLoading(true);
    }

    try {
      const [statsPayload] = await Promise.all([
        fetchSalesStatistics(activeFilters),
        loadChart(activeFilters, granularity),
      ]);

      if (statsPayload?.filters) {
        setFilters(statsPayload.filters);
      }
      setFilterOptions(statsPayload.filterOptions || { days: [], weeks: [], months: [] });
      setTotalRevenue(statsPayload.totalRevenue || 0);
      setMetrics(statsPayload.metrics || EMPTY_METRICS);
    } catch (err) {
      setMetrics(EMPTY_METRICS);
      setTotalRevenue(0);
      setChartPoints([]);
      setError(err.message || "Sotuv statistikasini yuklashda xatolik yuz berdi");
    } finally {
      if (useGlobalLoader) {
        setGlobalLoading(false);
      }
      setLoading(false);
    }
  }, [chartGranularity, loadChart, setGlobalLoading]);

  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      loadStatistics({}, { useGlobalLoader: true, granularity: 'day' });
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
      loadStatistics(nextFilters, { useGlobalLoader: false, granularity: chartGranularity });
    },
    [chartGranularity, loadStatistics],
  );

  const handleChartGranularityChange = useCallback(
    (nextGranularity) => {
      setChartGranularity(nextGranularity);
      loadChart(filters, nextGranularity);
    },
    [filters, loadChart],
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

      <SalesRevenueChart
        granularity={chartGranularity}
        onGranularityChange={handleChartGranularityChange}
        points={chartPoints}
        overallTone={chartTone}
        loading={chartLoading}
      />
    </section>
  );
}
