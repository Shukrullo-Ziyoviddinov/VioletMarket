import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { fetchSellerSalesStatistics } from '../../api/sellerSalesStatisticsApi';
import SellerSalesStatisticsFilterBar from '../../components/SellerSalesStatisticsFilterBar/SellerSalesStatisticsFilterBar';
import SellerSalesStatisticsTotalRevenue from '../../components/SellerSalesStatisticsTotalRevenue/SellerSalesStatisticsTotalRevenue';
import { useSellerAuth } from '../../context/SellerAuthContext';
import './SellerSalesStatisticsPage.css';

const { Title, Text } = Typography;

export default function SellerSalesStatisticsPage() {
  const { t } = useTranslation();
  const { token } = useSellerAuth();
  const isInitialLoadRef = useRef(true);
  const [filters, setFilters] = useState({ day: '', week: '', month: '' });
  const [filterOptions, setFilterOptions] = useState({ days: [], weeks: [], months: [] });
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [openFilter, setOpenFilter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadStatistics = useCallback(async (activeFilters) => {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const payload = await fetchSellerSalesStatistics(token, activeFilters);
      setFilters(payload.filters);
      setFilterOptions(payload.filterOptions);
      setTotalRevenue(payload.totalRevenue);
    } catch (err) {
      setTotalRevenue(0);
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

      {error ? (
        <Alert className="seller-sales-statistics-page__alert" type="error" message={error} showIcon />
      ) : null}

      <div className="seller-sales-statistics-page__toolbar">
        <SellerSalesStatisticsFilterBar
          filters={filters}
          filterOptions={filterOptions}
          openFilter={openFilter}
          onOpenFilterChange={setOpenFilter}
          onFilterChange={handleFilterChange}
        />
        <SellerSalesStatisticsTotalRevenue value={totalRevenue} loading={loading} />
      </div>
    </section>
  );
}
