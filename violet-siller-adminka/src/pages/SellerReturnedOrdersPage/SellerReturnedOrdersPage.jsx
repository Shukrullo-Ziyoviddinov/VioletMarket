import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { fetchSellerReturnedOrders } from '../../api/sellerReturnedOrdersApi';
import SellerReturnedOrdersFilterBar from '../../components/SellerReturnedOrdersFilterBar/SellerReturnedOrdersFilterBar';
import SellerReturnedOrdersStats from '../../components/SellerReturnedOrdersStats/SellerReturnedOrdersStats';
import SellerReturnedOrdersList from '../../components/SellerReturnedOrdersList/SellerReturnedOrdersList';
import { useSellerAuth } from '../../context/SellerAuthContext';
import './SellerReturnedOrdersPage.css';

const EMPTY_STATS = {
  allTime: {
    totalCount: 0,
    totalAmount: 0,
    totalQuantity: 0,
    noAnswerCount: 0,
    returnCount: 0,
  },
  period: {
    totalCount: 0,
    totalAmount: 0,
    totalQuantity: 0,
    noAnswerCount: 0,
    returnCount: 0,
  },
  day: {
    totalCount: 0,
    totalAmount: 0,
    totalQuantity: 0,
    noAnswerCount: 0,
    returnCount: 0,
  },
  week: {
    totalCount: 0,
    totalAmount: 0,
    totalQuantity: 0,
    noAnswerCount: 0,
    returnCount: 0,
  },
  month: {
    totalCount: 0,
    totalAmount: 0,
    totalQuantity: 0,
    noAnswerCount: 0,
    returnCount: 0,
  },
};

export default function SellerReturnedOrdersPage() {
  const { t } = useTranslation();
  const { token } = useSellerAuth();
  const isInitialLoadRef = useRef(true);
  const [filters, setFilters] = useState({ day: '', week: '', month: '' });
  const [filterOptions, setFilterOptions] = useState({ days: [], weeks: [], months: [] });
  const [activePeriod, setActivePeriod] = useState('day');
  const [stats, setStats] = useState(EMPTY_STATS);
  const [orders, setOrders] = useState([]);
  const [openFilter, setOpenFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReturnedOrders = useCallback(
    async (activeFilters = {}) => {
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const payload = await fetchSellerReturnedOrders(token, {
          day: activeFilters.day,
          week: activeFilters.week,
          month: activeFilters.month,
          period: activeFilters.period || activePeriod,
        });

        setFilters(payload.filters);
        setFilterOptions(payload.filterOptions);
        setActivePeriod(payload.activePeriod || 'day');
        setStats(payload.stats || EMPTY_STATS);
        setOrders(payload.orders || []);
      } catch (err) {
        setStats(EMPTY_STATS);
        setOrders([]);
        setError(err.message || t('returnedOrders.loadError'));
      } finally {
        setLoading(false);
      }
    },
    [activePeriod, t, token],
  );

  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      loadReturnedOrders({ period: 'day' });
    }
  }, [loadReturnedOrders]);

  const handleFilterChange = useCallback(
    (nextFilters) => {
      const period = nextFilters.period || activePeriod;
      setFilters(nextFilters);
      setActivePeriod(period);
      loadReturnedOrders({
        day: nextFilters.day,
        week: nextFilters.week,
        month: nextFilters.month,
        period,
      });
    },
    [activePeriod, loadReturnedOrders],
  );

  return (
    <section className="seller-returned-orders-page">
      <header className="seller-returned-orders-page__header">
        <h1 className="seller-returned-orders-page__title">{t('returnedOrders.title')}</h1>
        <p className="seller-returned-orders-page__subtitle">{t('returnedOrders.subtitle')}</p>
      </header>

      <SellerReturnedOrdersFilterBar
        filters={filters}
        filterOptions={filterOptions}
        openFilter={openFilter}
        activePeriod={activePeriod}
        onOpenFilterChange={setOpenFilter}
        onFilterChange={handleFilterChange}
      />

      {error ? (
        <Alert
          className="seller-returned-orders-page__alert"
          type="error"
          showIcon
          message={error}
        />
      ) : null}

      <div className="seller-returned-orders-page__stats-wrap">
        {loading ? (
          <div className="seller-returned-orders-page__loading-overlay">
            <Spin />
          </div>
        ) : null}
        <SellerReturnedOrdersStats stats={stats} loading={loading} />
      </div>

      <SellerReturnedOrdersList orders={orders} loading={loading} />
    </section>
  );
}
