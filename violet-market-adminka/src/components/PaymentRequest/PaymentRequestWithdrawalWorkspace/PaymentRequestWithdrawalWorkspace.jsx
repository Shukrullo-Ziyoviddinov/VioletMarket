import React, { useCallback, useEffect, useState } from 'react';
import {
  fetchWithdrawalSellerOptions,
  fetchWithdrawals,
} from '../../../api/withdrawalsAdminApi';
import PaymentRequestWithdrawalFiltersBar, {
  formatPaymentRequestDateParam,
  getDefaultPaymentRequestDateRange,
} from '../PaymentRequestWithdrawalFiltersBar/PaymentRequestWithdrawalFiltersBar';
import PaymentRequestWithdrawalList from '../PaymentRequestWithdrawalList/PaymentRequestWithdrawalList';
import PaymentRequestWithdrawalModal from '../PaymentRequestWithdrawalModal/PaymentRequestWithdrawalModal';
import './PaymentRequestWithdrawalWorkspace.css';

const PAGE_SIZE = 10;

export default function PaymentRequestWithdrawalWorkspace() {
  const [dateRange, setDateRange] = useState(getDefaultPaymentRequestDateRange);
  const [sellerId, setSellerId] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [openFilter, setOpenFilter] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [activeWithdrawal, setActiveWithdrawal] = useState(null);

  const loadSellerOptions = useCallback(async () => {
    try {
      const options = await fetchWithdrawalSellerOptions();
      setSellers(options);
    } catch {
      setSellers([]);
    }
  }, []);

  const loadWithdrawals = useCallback(async () => {
    setLoading(true);
    try {
      const [start, end] = dateRange || [];
      const data = await fetchWithdrawals({
        page,
        sellerId,
        search: debouncedSearch,
        dateFrom: start ? formatPaymentRequestDateParam(start) : '',
        dateTo: end ? formatPaymentRequestDateParam(end) : '',
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
  }, [dateRange, debouncedSearch, page, sellerId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadSellerOptions();
  }, [loadSellerOptions]);

  useEffect(() => {
    loadWithdrawals();
  }, [loadWithdrawals]);

  const handleFilterChange = (updater) => {
    setPage(1);
    updater();
  };

  return (
    <div className="payment-request-withdrawal-workspace">
      <PaymentRequestWithdrawalFiltersBar
        dateRange={dateRange}
        onDateRangeChange={(nextRange) => handleFilterChange(() => setDateRange(nextRange))}
        sellerId={sellerId}
        onSellerIdChange={(nextSellerId) => handleFilterChange(() => setSellerId(nextSellerId))}
        sellers={sellers}
        search={search}
        onSearchChange={(value) => handleFilterChange(() => setSearch(value))}
        openFilter={openFilter}
        onOpenFilterChange={setOpenFilter}
      />

      <PaymentRequestWithdrawalList
        withdrawals={withdrawals}
        page={page}
        totalPages={totalPages}
        total={total}
        limit={PAGE_SIZE}
        onPageChange={setPage}
        loading={loading}
        onView={setActiveWithdrawal}
      />

      <PaymentRequestWithdrawalModal
        open={Boolean(activeWithdrawal)}
        withdrawal={activeWithdrawal}
        onClose={() => setActiveWithdrawal(null)}
      />
    </div>
  );
}
