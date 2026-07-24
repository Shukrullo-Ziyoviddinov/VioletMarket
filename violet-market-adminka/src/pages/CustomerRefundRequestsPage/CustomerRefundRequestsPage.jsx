import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Modal, Spin } from 'antd';
import {
  fetchAdminCustomerRefunds,
  confirmAdminCustomerRefund,
} from '../../api/customerRefundAdminApi';
import {
  CustomerRefundStatusFilter,
  CustomerRefundPeriodFilter,
  CustomerRefundSearch,
  CustomerRefundList,
} from '../../components/CustomerRefundRequests';
import { formatRevenue } from '../../utils/productDisplay';
import './CustomerRefundRequestsPage.css';

export default function CustomerRefundRequestsPage() {
  const isInitialLoadRef = useRef(true);
  const searchTimerRef = useRef(null);
  const [filters, setFilters] = useState({ day: '', week: '', month: '' });
  const [filterOptions, setFilterOptions] = useState({
    days: [],
    weeks: [],
    months: [],
  });
  const [activePeriod, setActivePeriod] = useState('day');
  const [status, setStatus] = useState('pending');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFilter, setOpenFilter] = useState(null);
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, refunded: 0 });
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async (activeFilters = {}) => {
    setLoading(true);
    setError('');
    try {
      const payload = await fetchAdminCustomerRefunds({
        day: activeFilters.day,
        week: activeFilters.week,
        month: activeFilters.month,
        period: activeFilters.period || activePeriod,
        status: activeFilters.status || status,
        search: activeFilters.search != null ? activeFilters.search : searchQuery,
      });
      setFilters(payload.filters);
      setFilterOptions(payload.filterOptions);
      setActivePeriod(payload.activePeriod || 'day');
      setStatus(payload.status || 'pending');
      setItems(payload.items || []);
      setCounts(payload.counts || { pending: 0, refunded: 0 });
    } catch (err) {
      setItems([]);
      setCounts({ pending: 0, refunded: 0 });
      setError(err.message || 'Pul qaytarish so‘rovlarini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, [activePeriod, searchQuery, status]);

  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      load({ period: 'day', status: 'pending', search: '' });
      return;
    }
    load({
      day: filters.day,
      week: filters.week,
      month: filters.month,
      period: activePeriod,
      status,
      search: searchQuery,
    });
    // faqat searchQuery o‘zgarganda (debounce dan keyin)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        window.clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  const handleFilterChange = useCallback(
    (nextFilters) => {
      const period = nextFilters.period || activePeriod;
      setFilters(nextFilters);
      setActivePeriod(period);
      load({
        day: nextFilters.day,
        week: nextFilters.week,
        month: nextFilters.month,
        period,
        status,
        search: searchQuery,
      });
    },
    [activePeriod, load, searchQuery, status],
  );

  const handleStatusChange = useCallback(
    (nextStatus) => {
      setStatus(nextStatus);
      load({
        day: filters.day,
        week: filters.week,
        month: filters.month,
        period: activePeriod,
        status: nextStatus,
        search: searchQuery,
      });
    },
    [activePeriod, filters, load, searchQuery],
  );

  const handleSearchChange = (value) => {
    setSearchInput(value);
    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = window.setTimeout(() => {
      setSearchQuery(String(value || '').trim());
    }, 350);
  };

  const handleSearchSubmit = (value) => {
    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current);
    }
    setSearchInput(value);
    setSearchQuery(value);
  };

  const handleConfirm = useCallback(
    (item) => {
      Modal.confirm({
        title: 'Mijozga summa qaytarildi?',
        content: `${formatRevenue(item.amount)} mijozga qaytarilganini tasdiqlaysizmi?`,
        okText: 'Ha, qaytarildi',
        cancelText: 'Yo‘q',
        onOk: async () => {
          setConfirmingId(item.id);
          try {
            await confirmAdminCustomerRefund(item.id);
            await load({
              day: filters.day,
              week: filters.week,
              month: filters.month,
              period: activePeriod,
              status,
              search: searchQuery,
            });
          } catch (err) {
            setError(err.message || 'Tasdiqlashda xatolik');
          } finally {
            setConfirmingId(null);
          }
        },
      });
    },
    [activePeriod, filters, load, searchQuery, status],
  );

  return (
    <section className="customer-refund-requests-page">
      <header className="customer-refund-requests-page__header">
        <div className="customer-refund-requests-page__heading">
          <h1 className="customer-refund-requests-page__title">
            Mijozga pul qaytarish
          </h1>
          <p className="customer-refund-requests-page__subtitle">
            To‘langan qaytarilgan / yaroqsiz mahsulotlar uchun mijozga summa qaytarish
            so‘rovlari
          </p>
        </div>
        <CustomerRefundSearch
          value={searchInput}
          onChange={handleSearchChange}
          onSubmit={handleSearchSubmit}
        />
      </header>

      <div className="customer-refund-requests-page__toolbar">
        <CustomerRefundPeriodFilter
          filters={filters}
          filterOptions={filterOptions}
          openFilter={openFilter}
          activePeriod={activePeriod}
          onOpenFilterChange={setOpenFilter}
          onFilterChange={handleFilterChange}
        />
        <CustomerRefundStatusFilter
          value={status}
          onChange={handleStatusChange}
          counts={counts}
        />
      </div>

      {error ? (
        <Alert
          className="customer-refund-requests-page__alert"
          type="error"
          showIcon
          message={error}
        />
      ) : null}

      <div className="customer-refund-requests-page__list-wrap">
        {loading ? (
          <div className="customer-refund-requests-page__loading-overlay">
            <Spin />
          </div>
        ) : null}
        <CustomerRefundList
          items={items}
          loading={loading}
          confirmingId={confirmingId}
          onConfirm={handleConfirm}
        />
      </div>
    </section>
  );
}
