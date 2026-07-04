import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { fetchSellerSalesRevenueChart, fetchSellerSalesStatistics } from '../../api/sellerSalesStatisticsApi';
import SellerSalesRevenueChart from '../../components/SellerSalesRevenueChart/SellerSalesRevenueChart';
import SellerSalesCategoryStatistics from '../../components/SellerSalesCategoryStatistics/SellerSalesCategoryStatistics';
import SellerSalesCountryCategoryStatistics from '../../components/SellerSalesCountryCategoryStatistics/SellerSalesCountryCategoryStatistics';
import SellerSalesBrandCategoryStatistics from '../../components/SellerSalesBrandCategoryStatistics/SellerSalesBrandCategoryStatistics';
import SellerTopSellingProductsSection from '../../components/SellerTopSellingProductsSection/SellerTopSellingProductsSection';
import SellerSalesStatisticsFilterBar from '../../components/SellerSalesStatisticsFilterBar/SellerSalesStatisticsFilterBar';
import SellerSalesStatisticsMetrics from '../../components/SellerSalesStatisticsMetrics/SellerSalesStatisticsMetrics';
import SellerSalesStatisticsTotalRevenue from '../../components/SellerSalesStatisticsTotalRevenue/SellerSalesStatisticsTotalRevenue';
import { useSellerAuth } from '../../context/SellerAuthContext';
import './SellerSalesStatisticsPage.css';

const EMPTY_METRICS = {
  daily: { value: 0, growthFormatted: '0%', tone: 'neutral' },
  weekly: { value: 0, growthFormatted: '0%', tone: 'neutral' },
  monthly: { value: 0, growthFormatted: '0%', tone: 'neutral' },
};

export default function SellerSalesStatisticsPage() {
  const { t } = useTranslation();
  const { token } = useSellerAuth();
  const isInitialLoadRef = useRef(true);
  const [filters, setFilters] = useState({ day: '', week: '', month: '' });
  const [filterOptions, setFilterOptions] = useState({ days: [], weeks: [], months: [] });
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [metrics, setMetrics] = useState(EMPTY_METRICS);
  const [chartGranularity, setChartGranularity] = useState('day');
  const [chartPoints, setChartPoints] = useState([]);
  const [chartTone, setChartTone] = useState('neutral');
  const [openFilter, setOpenFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState('');

  const loadChart = useCallback(async (activeFilters, granularity) => {
    if (!token) return;

    setChartLoading(true);
    try {
      const payload = await fetchSellerSalesRevenueChart(token, {
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
  }, [token]);

  const loadStatistics = useCallback(async (activeFilters, options = {}) => {
    if (!token) {
      setLoading(false);
      return;
    }

    const granularity = options?.granularity || chartGranularity;

    setLoading(true);
    setError('');

    try {
      const [statsPayload] = await Promise.all([
        fetchSellerSalesStatistics(token, activeFilters),
        loadChart(activeFilters, granularity),
      ]);

      setFilters(statsPayload.filters);
      setFilterOptions(statsPayload.filterOptions);
      setTotalRevenue(statsPayload.totalRevenue);
      setMetrics(statsPayload.metrics || EMPTY_METRICS);
    } catch (err) {
      setTotalRevenue(0);
      setMetrics(EMPTY_METRICS);
      setChartPoints([]);
      setError(err.message || t('salesStatistics.loadError'));
    } finally {
      setLoading(false);
    }
  }, [chartGranularity, loadChart, t, token]);

  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      loadStatistics({}, { granularity: 'day' });
    }
  }, [loadStatistics]);

  const handleFilterChange = useCallback(
    (nextFilters) => {
      setFilters(nextFilters);
      loadStatistics(nextFilters, { granularity: chartGranularity });
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

  const hasFilterOptions = filterOptions.days.length > 0
    || filterOptions.weeks.length > 0
    || filterOptions.months.length > 0;
  const isInitialLoading = loading && !hasFilterOptions && !error;

  return (
    <section className="seller-sales-statistics-page">
      {isInitialLoading ? (
        <div className="seller-sales-statistics-page__loading">
          <Spin size="large" />
        </div>
      ) : (
        <>
          {error ? (
            <Alert className="seller-sales-statistics-page__alert" type="error" message={error} showIcon />
          ) : null}

          <div className="seller-sales-statistics-page__toolbar">
            {loading ? (
              <div className="seller-sales-statistics-page__loading-overlay" aria-hidden="true">
                <Spin />
              </div>
            ) : null}
            <SellerSalesStatisticsFilterBar
              filters={filters}
              filterOptions={filterOptions}
              openFilter={openFilter}
              onOpenFilterChange={setOpenFilter}
              onFilterChange={handleFilterChange}
            />
            <SellerSalesStatisticsTotalRevenue value={totalRevenue} loading={loading} />
          </div>

          <div className="seller-sales-statistics-page__metrics-wrap">
            {loading ? <Spin className="seller-sales-statistics-page__spinner" /> : null}
            <SellerSalesStatisticsMetrics metrics={metrics} loading={loading} />
          </div>

          <SellerSalesRevenueChart
            granularity={chartGranularity}
            onGranularityChange={handleChartGranularityChange}
            points={chartPoints}
            overallTone={chartTone}
            loading={chartLoading}
          />

          <div className="seller-sales-statistics-page__stats-grid">
            <SellerSalesCategoryStatistics token={token} pageFilters={filters} />
            <SellerSalesCountryCategoryStatistics token={token} pageFilters={filters} />
            <SellerSalesBrandCategoryStatistics token={token} pageFilters={filters} />
          </div>

          <SellerTopSellingProductsSection token={token} pageFilters={filters} />
        </>
      )}
    </section>
  );
}
