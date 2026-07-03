import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Spin } from 'antd';
import { fetchCategorySalesStatistics, fetchSalesRevenueChart, fetchSalesStatistics } from '../../api/salesStatisticsAdminApi';
import SalesCategoryStatistics from '../../components/SalesCategoryStatistics/SalesCategoryStatistics';
import SalesRevenueChart from '../../components/SalesRevenueChart/SalesRevenueChart';
import TopSellersSection from '../../components/TopSellersSection/TopSellersSection';
import TopSellingProductsSection from '../../components/TopSellingProductsSection/TopSellingProductsSection';
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
  const [categoryStats, setCategoryStats] = useState({
    categories: [],
    period: 'day',
    periodLabel: '',
    scopeLabel: '',
  });
  const [categoryPeriod, setCategoryPeriod] = useState('day');
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [openFilter, setOpenFilter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState('');

  const loadCategoryStats = useCallback(async (activeFilters, period) => {
    setCategoryLoading(true);
    try {
      const payload = await fetchCategorySalesStatistics({
        ...activeFilters,
        period,
      });
      setCategoryStats(payload);
      if (payload.period) {
        setCategoryPeriod(payload.period);
      }
    } catch {
      setCategoryStats({
        categories: [],
        period,
        periodLabel: '',
        scopeLabel: '',
      });
    } finally {
      setCategoryLoading(false);
    }
  }, []);

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
    const categoryGranularity = options?.categoryPeriod || categoryPeriod;
    setLoading(true);
    setError('');
    if (useGlobalLoader) {
      setGlobalLoading(true);
    }

    try {
      const [statsPayload] = await Promise.all([
        fetchSalesStatistics(activeFilters),
        loadChart(activeFilters, granularity),
        loadCategoryStats(activeFilters, categoryGranularity),
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
  }, [categoryPeriod, chartGranularity, loadCategoryStats, loadChart, setGlobalLoading]);

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
      loadStatistics(nextFilters, { useGlobalLoader: false, granularity: chartGranularity, categoryPeriod });
    },
    [categoryPeriod, chartGranularity, loadStatistics],
  );

  const handleChartGranularityChange = useCallback(
    (nextGranularity) => {
      setChartGranularity(nextGranularity);
      loadChart(filters, nextGranularity);
    },
    [filters, loadChart],
  );

  const handleCategoryPeriodChange = useCallback(
    (nextPeriod) => {
      setCategoryPeriod(nextPeriod);
      loadCategoryStats(filters, nextPeriod);
    },
    [filters, loadCategoryStats],
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

      <SalesCategoryStatistics
        categories={categoryStats.categories}
        period={categoryPeriod}
        periodLabel={categoryStats.periodLabel}
        scopeLabel={categoryStats.scopeLabel}
        loading={categoryLoading}
        onPeriodChange={handleCategoryPeriodChange}
      />

      <div className="sales-statistics-page__rankings">
        <TopSellersSection pageFilters={filters} />
        <TopSellingProductsSection pageFilters={filters} />
      </div>
    </section>
  );
}
