import React, { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import {
  approvePaymentRequest,
  fetchPaymentRequestDetail,
  fetchPaymentRequests,
  fetchPaymentRequestSellerOptions,
  fetchPaymentRequestStats,
  rejectPaymentRequest,
} from '../../../api/paymentRequestsAdminApi';
import PaymentRequestFiltersBar, {
  formatPaymentRequestDateParam,
  getDefaultPaymentRequestDateRange,
} from '../PaymentRequestFiltersBar/PaymentRequestFiltersBar';
import PaymentRequestSellerList from '../PaymentRequestSellerList/PaymentRequestSellerList';
import PaymentRequestDetailsPanel from '../PaymentRequestDetailsPanel/PaymentRequestDetailsPanel';
import PaymentRequestViewModal from '../PaymentRequestViewModal/PaymentRequestViewModal';
import PaymentRequestRejectModal from '../PaymentRequestRejectModal/PaymentRequestRejectModal';
import './PaymentRequestWorkspace.css';

const EMPTY_STATS = {
  totalCount: 0,
  inProcessCount: 0,
  inProcessAmount: 0,
  withdrawnCount: 0,
  withdrawnAmount: 0,
  rejectedCount: 0,
  rejectedUniqueProductCount: 0,
  rejectedAmount: 0,
};

const PAGE_SIZE = 10;

export default function PaymentRequestWorkspace({ onStatsChange }) {
  const [dateRange, setDateRange] = useState(getDefaultPaymentRequestDateRange);
  const [sellerId, setSellerId] = useState('all');
  const [status, setStatus] = useState('all');
  const [openFilter, setOpenFilter] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [listLoading, setListLoading] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalRequestId, setModalRequestId] = useState(null);
  const [modalRequest, setModalRequest] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      const stats = await fetchPaymentRequestStats();
      onStatsChange?.(stats);
      return stats;
    } catch {
      onStatsChange?.(EMPTY_STATS);
      return EMPTY_STATS;
    }
  }, [onStatsChange]);

  const loadSellerOptions = useCallback(async () => {
    try {
      const options = await fetchPaymentRequestSellerOptions();
      setSellers(options);
    } catch {
      setSellers([]);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setListLoading(true);
    try {
      const [start, end] = dateRange || [];
      const data = await fetchPaymentRequests({
        page,
        status,
        sellerId,
        dateFrom: start ? formatPaymentRequestDateParam(start) : '',
        dateTo: end ? formatPaymentRequestDateParam(end) : '',
      });
      setRequests(data.requests);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setPage(data.page);

      setActiveRequestId((currentId) => {
        if (!data.requests.length) return null;
        if (data.requests.some((row) => row.id === currentId)) return currentId;
        return data.requests[0].id;
      });
    } catch {
      setRequests([]);
      setTotalPages(1);
      setTotal(0);
      setActiveRequestId(null);
      setActiveRequest(null);
    } finally {
      setListLoading(false);
    }
  }, [dateRange, page, sellerId, status]);

  const loadDetail = useCallback(async (paymentRequestId) => {
    if (!paymentRequestId) {
      setActiveRequest(null);
      return;
    }

    setDetailLoading(true);
    try {
      const detail = await fetchPaymentRequestDetail(paymentRequestId);
      setActiveRequest(detail);
    } catch {
      setActiveRequest(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadSellerOptions();
  }, [loadStats, loadSellerOptions]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    loadDetail(activeRequestId);
  }, [activeRequestId, loadDetail]);

  const loadModalDetail = useCallback(async (paymentRequestId) => {
    if (!paymentRequestId) {
      setModalRequest(null);
      return;
    }

    setModalLoading(true);
    try {
      const detail = await fetchPaymentRequestDetail(paymentRequestId);
      setModalRequest(detail);
    } catch {
      setModalRequest(null);
    } finally {
      setModalLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!modalRequestId) {
      setModalRequest(null);
      return;
    }
    loadModalDetail(modalRequestId);
  }, [modalRequestId, loadModalDetail]);

  const handleFilterChange = (updater) => {
    setPage(1);
    updater();
  };

  const refreshAll = async (nextRequestId = activeRequestId, nextModalRequestId = modalRequestId) => {
    await loadStats();
    await loadSellerOptions();
    await loadRequests();
    if (nextRequestId) {
      await loadDetail(nextRequestId);
    }
    if (nextModalRequestId) {
      await loadModalDetail(nextModalRequestId);
    }
  };

  const handleOpenViewModal = (paymentRequestId) => {
    setModalRequestId(paymentRequestId);
  };

  const handleCloseViewModal = () => {
    setModalRequestId(null);
    setModalRequest(null);
  };

  const handleOpenRejectModal = (paymentRequestId) => {
    if (!paymentRequestId) return;
    setRejectTargetId(paymentRequestId);
    setRejectModalOpen(true);
  };

  const handleCloseRejectModal = () => {
    if (actionLoading) return;
    setRejectModalOpen(false);
    setRejectTargetId(null);
  };

  const handleRejectSubmit = async (comment) => {
    if (!rejectTargetId) return;

    const targetId = rejectTargetId;
    setActionLoading(true);
    try {
      const detail = await rejectPaymentRequest(targetId, comment);
      setRejectModalOpen(false);
      setRejectTargetId(null);

      if (activeRequestId === targetId) {
        setActiveRequest(detail);
      }
      if (modalRequestId === targetId) {
        setModalRequest(detail);
      }
      setActiveRequestId(targetId);

      message.success("So'rov rad etildi");
      await refreshAll(targetId, modalRequestId === targetId ? targetId : modalRequestId);
    } catch (error) {
      message.error(error?.message || 'Rad etishda xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  const handleModalApprove = async () => {
    if (!modalRequestId) return;
    setActionLoading(true);
    try {
      const detail = await approvePaymentRequest(modalRequestId);
      setModalRequest(detail);
      setActiveRequestId(modalRequestId);
      setActiveRequest(detail);
      message.success("So'rov tasdiqlandi");
      await refreshAll(modalRequestId, modalRequestId);
    } catch (error) {
      message.error(error?.message || 'Tasdiqlashda xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  const handleModalReject = () => {
    handleOpenRejectModal(modalRequestId);
  };

  const handleApprove = async () => {
    if (!activeRequestId) return;
    setActionLoading(true);
    try {
      const detail = await approvePaymentRequest(activeRequestId);
      setActiveRequest(detail);
      message.success("So'rov tasdiqlandi");
      await refreshAll(activeRequestId);
    } catch (error) {
      message.error(error?.message || 'Tasdiqlashda xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = () => {
    handleOpenRejectModal(activeRequestId);
  };

  return (
    <div className="payment-request-workspace">
      <PaymentRequestFiltersBar
        dateRange={dateRange}
        onDateRangeChange={(nextRange) => handleFilterChange(() => setDateRange(nextRange))}
        sellerId={sellerId}
        onSellerIdChange={(nextSellerId) => handleFilterChange(() => setSellerId(nextSellerId))}
        sellers={sellers}
        status={status}
        onStatusChange={(nextStatus) => handleFilterChange(() => setStatus(nextStatus))}
        openFilter={openFilter}
        onOpenFilterChange={setOpenFilter}
      />

      <div className="payment-request-workspace__grid">
        <PaymentRequestSellerList
          requests={requests}
          activeRequestId={activeRequestId}
          onSelect={setActiveRequestId}
          onView={handleOpenViewModal}
          page={page}
          totalPages={totalPages}
          total={total}
          limit={PAGE_SIZE}
          onPageChange={setPage}
          loading={listLoading}
        />
        <PaymentRequestDetailsPanel
          request={activeRequest}
          loading={detailLoading}
          actionLoading={actionLoading}
          onApprove={handleApprove}
          onReject={handleReject}
          onClose={() => setActiveRequestId(null)}
        />
      </div>

      <PaymentRequestViewModal
        open={Boolean(modalRequestId)}
        request={modalRequest}
        loading={modalLoading}
        actionLoading={actionLoading}
        onClose={handleCloseViewModal}
        onApprove={handleModalApprove}
        onReject={handleModalReject}
      />

      <PaymentRequestRejectModal
        open={rejectModalOpen}
        loading={actionLoading}
        onClose={handleCloseRejectModal}
        onSubmit={handleRejectSubmit}
      />
    </div>
  );
}
