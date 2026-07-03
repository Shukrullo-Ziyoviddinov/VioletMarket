import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Spin } from 'antd';
import { fetchBrandCategorySalesStatistics, fetchCategorySalesStatistics, fetchCountryCategorySalesStatistics, fetchSalesRevenueChart, fetchSalesStatistics } from '../../api/salesStatisticsAdminApi';
import SalesBrandCategoryStatistics from '../../components/SalesBrandCategoryStatistics/SalesBrandCategoryStatistics';
import SalesCategoryStatistics from '../../components/SalesCategoryStatistics/SalesCategoryStatistics';
import SalesCountryCategoryStatistics from '../../components/SalesCountryCategoryStatistics/SalesCountryCategoryStatistics';
import SalesRevenueChart from '../../components/SalesRevenueChart/SalesRevenueChart';
import SalesStatisticsChartsPeriodFilter from '../../components/SalesStatisticsChartsPeriodFilter/SalesStatisticsChartsPeriodFilter';
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
  const [chartsPeriod, setChartsPeriod] = useState('day');
  const [categoryStats, setCategoryStats] = useState({
    categories: [],
    periodLabel: '',
    scopeLabel: '',
  });
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [countryCategoryStats, setCountryCategoryStats] = useState({
    countries: [],
    periodLabel: '',
    scopeLabel: '',
  });
  const [countryCategoryLoading, setCountryCategoryLoading] = useState(false);
  const [brandCategoryStats, setBrandCategoryStats] = useState({
    brands: [],
    periodLabel: '',
    scopeLabel: '',
  });
  const [brandCategoryLoading, setBrandCategoryLoading] = useState(false);
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
    } catch {
      setCategoryStats({
        categories: [],
        periodLabel: '',
        scopeLabel: '',
      });
    } finally {
      setCategoryLoading(false);
    }
  }, []);

  const loadCountryCategoryStats = useCallback(async (activeFilters, period) => {
    setCountryCategoryLoading(true);
    try {
      const payload = await fetchCountryCategorySalesStatistics({
        ...activeFilters,
        period,
      });
      setCountryCategoryStats(payload);
    } catch {
      setCountryCategoryStats({
        countries: [],
        periodLabel: '',
        scopeLabel: '',
      });
    } finally {
      setCountryCategoryLoading(false);
    }
  }, []);

  const loadBrandCategoryStats = useCallback(async (activeFilters, period) => {
    setBrandCategoryLoading(true);
    try {
      const payload = await fetchBrandCategorySalesStatistics({
        ...activeFilters,
        period,
      });
      setBrandCategoryStats(payload);
    } catch {
      setBrandCategoryStats({
        brands: [],
        periodLabel: '',
        scopeLabel: '',
      });
    } finally {
      setBrandCategoryLoading(false);
    }
  }, []);

  const loadChartsStats = useCallback(async (activeFilters, period) => {
    await Promise.all([
      loadCategoryStats(activeFilters, period),
      loadCountryCategoryStats(activeFilters, period),
      loadBrandCategoryStats(activeFilters, period),
    ]);
  }, [loadBrandCategoryStats, loadCategoryStats, loadCountryCategoryStats]);

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
    const chartsGranularity = options?.chartsPeriod || chartsPeriod;
    setLoading(true);
    setError('');
    if (useGlobalLoader) {
      setGlobalLoading(true);
    }

    try {
      const [statsPayload] = await Promise.all([
        fetchSalesStatistics(activeFilters),
        loadChart(activeFilters, granularity),
        loadChartsStats(activeFilters, chartsGranularity),
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
  }, [chartGranularity, chartsPeriod, loadChart, loadChartsStats, setGlobalLoading]);

  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      loadStatistics({}, { useGlobalLoader: true, granularity: 'day', chartsPeriod: 'day' });
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
      loadStatistics(nextFilters, {
        useGlobalLoader: false,
        granularity: chartGranularity,
        chartsPeriod,
      });
    },
    [chartGranularity, chartsPeriod, loadStatistics],
  );

  const handleChartGranularityChange = useCallback(
    (nextGranularity) => {
      setChartGranularity(nextGranularity);
      loadChart(filters, nextGranularity);
    },
    [filters, loadChart],
  );

  const handleChartsPeriodChange = useCallback(
    (nextPeriod) => {
      setChartsPeriod(nextPeriod);
      loadChartsStats(filters, nextPeriod);
    },
    [filters, loadChartsStats],
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

      <div className="sales-statistics-page__charts-section">
        <div className="sales-statistics-page__charts-toolbar">
          <SalesStatisticsChartsPeriodFilter
            value={chartsPeriod}
            onChange={handleChartsPeriodChange}
          />
        </div>

        <div className="sales-statistics-page__category-grid">
          <SalesCategoryStatistics
            categories={categoryStats.categories}
            periodLabel={categoryStats.periodLabel}
            scopeLabel={categoryStats.scopeLabel}
            loading={categoryLoading}
          />

          <SalesCountryCategoryStatistics
            countries={countryCategoryStats.countries}
            periodLabel={countryCategoryStats.periodLabel}
            scopeLabel={countryCategoryStats.scopeLabel}
            loading={countryCategoryLoading}
          />

          <SalesBrandCategoryStatistics
            brands={brandCategoryStats.brands}
            periodLabel={brandCategoryStats.periodLabel}
            scopeLabel={brandCategoryStats.scopeLabel}
            loading={brandCategoryLoading}
          />
        </div>
      </div>

      <div className="sales-statistics-page__rankings">
        <TopSellersSection pageFilters={filters} />
        <TopSellingProductsSection pageFilters={filters} />
      </div>
    </section>
  );
}
