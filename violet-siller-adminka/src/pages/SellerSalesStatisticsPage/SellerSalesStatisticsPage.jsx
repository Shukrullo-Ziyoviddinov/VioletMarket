import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Spin, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { fetchSellerSalesStatistics } from '../../api/sellerSalesStatisticsApi';
import SellerSalesStatisticsFilterBar from '../../components/SellerSalesStatisticsFilterBar/SellerSalesStatisticsFilterBar';
import SellerSalesStatisticsMetrics from '../../components/SellerSalesStatisticsMetrics/SellerSalesStatisticsMetrics';
import SellerSalesStatisticsTotalRevenue from '../../components/SellerSalesStatisticsTotalRevenue/SellerSalesStatisticsTotalRevenue';
import { useSellerAuth } from '../../context/SellerAuthContext';
import './SellerSalesStatisticsPage.css';

const { Title, Text } = Typography;

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
  const [openFilter, setOpenFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStatistics = useCallback(async (activeFilters) => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = await fetchSellerSalesStatistics(token, activeFilters);
      setFilters(payload.filters);
      setFilterOptions(payload.filterOptions);
      setTotalRevenue(payload.totalRevenue);
      setMetrics(payload.metrics || EMPTY_METRICS);
    } catch (err) {
      setTotalRevenue(0);
      setMetrics(EMPTY_METRICS);
      setError(err.message || t('salesStatistics.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t, token]);

  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      loadStatistics({});
    }
  }, [loadStatistics]);

  const handleFilterChange = useCallback(
    (nextFilters) => {
      setFilters(nextFilters);
      loadStatistics(nextFilters);
    },
    [loadStatistics],
  );

  const hasFilterOptions = filterOptions.days.length > 0
    || filterOptions.weeks.length > 0
    || filterOptions.months.length > 0;
  const isInitialLoading = loading && !hasFilterOptions && !error;

  return (
    <section className="seller-sales-statistics-page">
      <div className="seller-sales-statistics-page__head">
        <div>
          <Title level={3} className="seller-sales-statistics-page__title">
            {t('salesStatistics.title')}
          </Title>
          <Text type="secondary" className="seller-sales-statistics-page__subtitle">
            {t('salesStatistics.subtitle')}
          </Text>
        </div>
      </div>

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
        </>
      )}
    </section>
  );
}
