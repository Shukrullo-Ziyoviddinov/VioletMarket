import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Spin } from 'antd';
import { fetchAdminReturnedProducts } from '../../api/returnedProductsAdminApi';
import {
  ReturnedProductsFilterBar,
  ReturnedProductsReasonFilter,
  ReturnedProductsStats,
  ReturnedProductsGrowthChart,
  ReturnedProductsSellerRankings,
  ReturnedProductsList,
} from '../../components/ReturnedProducts';
import './ReturnedProductsPage.css';

const EMPTY_STATS = {
  allTime: {
    totalCount: 0,
    totalAmount: 0,
    totalQuantity: 0,
    returnCount: 0,
    defectiveCount: 0,
  },
  period: {
    totalCount: 0,
    totalAmount: 0,
    totalQuantity: 0,
    returnCount: 0,
    defectiveCount: 0,
  },
  day: {
    totalCount: 0,
    totalAmount: 0,
    totalQuantity: 0,
    returnCount: 0,
    defectiveCount: 0,
  },
  week: {
    totalCount: 0,
    totalAmount: 0,
    totalQuantity: 0,
    returnCount: 0,
    defectiveCount: 0,
  },
  month: {
    totalCount: 0,
    totalAmount: 0,
    totalQuantity: 0,
    returnCount: 0,
    defectiveCount: 0,
  },
};

const EMPTY_RANKINGS = { return: [], defective: [] };
const EMPTY_CHART = { granularity: 'day', points: [] };

export default function ReturnedProductsPage() {
  const isInitialLoadRef = useRef(true);
  const [filters, setFilters] = useState({ day: '', week: '', month: '' });
  const [filterOptions, setFilterOptions] = useState({
    days: [],
    weeks: [],
    months: [],
  });
  const [activePeriod, setActivePeriod] = useState('day');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [stats, setStats] = useState(EMPTY_STATS);
  const [sellerRankings, setSellerRankings] = useState(EMPTY_RANKINGS);
  const [chart, setChart] = useState(EMPTY_CHART);
  const [orders, setOrders] = useState([]);
  const [openFilter, setOpenFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReturnedProducts = useCallback(async (activeFilters = {}) => {
    setLoading(true);
    setError('');

    try {
      const payload = await fetchAdminReturnedProducts({
        day: activeFilters.day,
        week: activeFilters.week,
        month: activeFilters.month,
        period: activeFilters.period || activePeriod,
        reasonType: activeFilters.reasonType || reasonFilter,
      });

      setFilters(payload.filters);
      setFilterOptions(payload.filterOptions);
      setActivePeriod(payload.activePeriod || 'day');
      setReasonFilter(payload.reasonFilter || 'all');
      setStats(payload.stats || EMPTY_STATS);
      setSellerRankings(payload.sellerRankings || EMPTY_RANKINGS);
      setChart(payload.chart || EMPTY_CHART);
      setOrders(payload.orders || []);
    } catch (err) {
      setStats(EMPTY_STATS);
      setSellerRankings(EMPTY_RANKINGS);
      setChart(EMPTY_CHART);
      setOrders([]);
      setError(err.message || 'Qaytarilgan mahsulotlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, [activePeriod, reasonFilter]);

  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      loadReturnedProducts({ period: 'day', reasonType: 'all' });
    }
  }, [loadReturnedProducts]);

  const handleFilterChange = useCallback(
    (nextFilters) => {
      const period = nextFilters.period || activePeriod;
      setFilters(nextFilters);
      setActivePeriod(period);
      loadReturnedProducts({
        day: nextFilters.day,
        week: nextFilters.week,
        month: nextFilters.month,
        period,
        reasonType: reasonFilter,
      });
    },
    [activePeriod, loadReturnedProducts, reasonFilter],
  );

  const handleReasonChange = useCallback(
    (nextReason) => {
      setReasonFilter(nextReason);
      loadReturnedProducts({
        day: filters.day,
        week: filters.week,
        month: filters.month,
        period: activePeriod,
        reasonType: nextReason,
      });
    },
    [activePeriod, filters, loadReturnedProducts],
  );

  return (
    <section className="returned-products-page">
      <header className="returned-products-page__header">
        <h1 className="returned-products-page__title">Qaytarilgan buyumlar</h1>
        <p className="returned-products-page__subtitle">
          Barcha sillerlar bo‘yicha qaytarilgan va yaroqsiz mahsulotlar, statistika va dinamika
        </p>
      </header>

      <div className="returned-products-page__toolbar">
        <ReturnedProductsFilterBar
          filters={filters}
          filterOptions={filterOptions}
          openFilter={openFilter}
          activePeriod={activePeriod}
          onOpenFilterChange={setOpenFilter}
          onFilterChange={handleFilterChange}
        />
        <ReturnedProductsReasonFilter
          value={reasonFilter}
          onChange={handleReasonChange}
        />
      </div>

      {error ? (
        <Alert
          className="returned-products-page__alert"
          type="error"
          showIcon
          message={error}
        />
      ) : null}

      <div className="returned-products-page__stats-wrap">
        {loading ? (
          <div className="returned-products-page__loading-overlay">
            <Spin />
          </div>
        ) : null}
        <ReturnedProductsStats stats={stats} loading={loading} />
      </div>

      <ReturnedProductsGrowthChart chart={chart} loading={loading} />

      <ReturnedProductsSellerRankings
        rankings={sellerRankings}
        loading={loading}
      />

      <ReturnedProductsList orders={orders} loading={loading} />
    </section>
  );
}
