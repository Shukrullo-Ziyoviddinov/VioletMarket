import React, { useCallback, useEffect, useState } from 'react';
import { fetchSellerWithdrawals } from '../../../api/sellerWithdrawalsApi';
import { useSellerAuth } from '../../../context/SellerAuthContext';
import SellerWithdrawalsFiltersBar, {
  formatSellerWithdrawalsDateParam,
  getDefaultSellerWithdrawalsDateRange,
} from '../SellerWithdrawalsFiltersBar/SellerWithdrawalsFiltersBar';
import SellerWithdrawalsList from '../SellerWithdrawalsList/SellerWithdrawalsList';
import SellerWithdrawalsModal from '../SellerWithdrawalsModal/SellerWithdrawalsModal';
import './SellerWithdrawalsWorkspace.css';

const PAGE_SIZE = 10;

export default function SellerWithdrawalsWorkspace() {
  const { token } = useSellerAuth();
  const [dateRange, setDateRange] = useState(getDefaultSellerWithdrawalsDateRange);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [withdrawals, setWithdrawals] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [activeWithdrawal, setActiveWithdrawal] = useState(null);

  const loadWithdrawals = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const [start, end] = dateRange || [];
      const data = await fetchSellerWithdrawals(token, {
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        dateFrom: start ? formatSellerWithdrawalsDateParam(start) : '',
        dateTo: end ? formatSellerWithdrawalsDateParam(end) : '',
      });
      setWithdrawals(data.withdrawals);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setPage(data.page);
    } catch {
      setWithdrawals([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [dateRange, debouncedSearch, page, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadWithdrawals();
  }, [loadWithdrawals]);

  const handleFilterChange = (updater) => {
    setPage(1);
    updater();
  };

  return (
    <div className="seller-withdrawals-workspace">
      <SellerWithdrawalsFiltersBar
        dateRange={dateRange}
        onDateRangeChange={(nextRange) => handleFilterChange(() => setDateRange(nextRange))}
        search={search}
        onSearchChange={(value) => handleFilterChange(() => setSearch(value))}
      />

      <SellerWithdrawalsList
        withdrawals={withdrawals}
        page={page}
        totalPages={totalPages}
        total={total}
        limit={PAGE_SIZE}
        onPageChange={setPage}
        loading={loading}
        onView={setActiveWithdrawal}
      />

      <SellerWithdrawalsModal
        open={Boolean(activeWithdrawal)}
        withdrawal={activeWithdrawal}
        onClose={() => setActiveWithdrawal(null)}
      />
    </div>
  );
}
