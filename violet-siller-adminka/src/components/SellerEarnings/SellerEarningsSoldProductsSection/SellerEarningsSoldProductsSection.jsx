import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  fetchSellerSoldItems,
  submitSellerWithdrawalRequest,
} from '../../../api/sellerEarningsApi';
import { SELLER_EARNINGS_SOLD_PRODUCT_STATUS } from '../../../utils/sellerEarningsDisplay';
import SellerEarningsSoldProductsDateFilter, {
  formatSoldProductsDateParam,
  getDefaultSoldProductsDateRange,
} from '../SellerEarningsSoldProductsDateFilter/SellerEarningsSoldProductsDateFilter';
import SellerEarningsSoldProductsFooter from '../SellerEarningsSoldProductsFooter/SellerEarningsSoldProductsFooter';
import SellerEarningsSoldProductsPagination from '../SellerEarningsSoldProductsPagination/SellerEarningsSoldProductsPagination';
import SellerEarningsSoldProductsStatusFilter from '../SellerEarningsSoldProductsStatusFilter/SellerEarningsSoldProductsStatusFilter';
import SellerEarningsSoldProductsTable from '../SellerEarningsSoldProductsTable/SellerEarningsSoldProductsTable';
import SellerEarningsRejectionCommentModal from '../SellerEarningsRejectionCommentModal/SellerEarningsRejectionCommentModal';
import './SellerEarningsSoldProductsSection.css';

const PAGE_SIZE = 10;

export default function SellerEarningsSoldProductsSection({ token, onSummaryChange }) {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const [dateRange, setDateRange] = useState(getDefaultSoldProductsDateRange);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedById, setSelectedById] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [activeComment, setActiveComment] = useState('');

  const loadSoldItems = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const data = await fetchSellerSoldItems(token, {
        page,
        limit: PAGE_SIZE,
        status: statusFilter,
        dateFrom: formatSoldProductsDateParam(dateRange?.[0]),
        dateTo: formatSoldProductsDateParam(dateRange?.[1]),
      });
      setRows(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setPage(data.page);
    } catch {
      setRows([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [dateRange, page, statusFilter, token]);

  useEffect(() => {
    loadSoldItems();
  }, [loadSoldItems]);

  const selectedIds = useMemo(() => Object.keys(selectedById), [selectedById]);

  const selectedRows = useMemo(() => Object.values(selectedById), [selectedById]);

  const selectedTotal = selectedRows.reduce((sum, row) => sum + (Number(row.price) || 0), 0);

  const handleFilterChange = (updater) => {
    setPage(1);
    setSelectedById({});
    updater();
  };

  const handleToggleRow = (rowId) => {
    setSelectedById((prev) => {
      if (prev[rowId]) {
        const next = { ...prev };
        delete next[rowId];
        return next;
      }

      const row = rows.find((item) => String(item.id) === String(rowId));
      if (!row) return prev;
      return { ...prev, [rowId]: row };
    });
  };

  const handleToggleAll = (checked, selectableRows) => {
    setSelectedById((prev) => {
      const next = { ...prev };

      if (!checked) {
        selectableRows.forEach((row) => {
          delete next[row.id];
        });
        return next;
      }

      selectableRows.forEach((row) => {
        next[row.id] = row;
      });
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!token || !selectedIds.length) return;

    setSubmitting(true);
    try {
      const result = await submitSellerWithdrawalRequest(token, selectedIds);
      setSelectedById({});
      if (page !== 1) {
        setPage(1);
      } else {
        await loadSoldItems();
      }
      if (typeof onSummaryChange === 'function') {
        await onSummaryChange(result.summary);
      }
      message.success(
        t('sellerEarnings.soldProducts.footer.submitSuccess', { count: result.updatedCount }),
      );
    } catch (err) {
      message.error(err.message || t('sellerEarnings.soldProducts.footer.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewComment = (comment) => {
    setActiveComment(comment);
    setCommentModalOpen(true);
  };

  const handleCloseCommentModal = () => {
    setCommentModalOpen(false);
    setActiveComment('');
  };

  return (
    <section className="seller-earnings-sold-products-section">
      <div className="seller-earnings-sold-products-section__header">
        <h2 className="seller-earnings-sold-products-section__title">
          {t('sellerEarnings.soldProducts.title')}
        </h2>

        <div className="seller-earnings-sold-products-section__filters">
          <SellerEarningsSoldProductsStatusFilter
            value={statusFilter}
            onChange={(nextStatus) => handleFilterChange(() => setStatusFilter(nextStatus))}
            isOpen={statusFilterOpen}
            onOpenChange={setStatusFilterOpen}
          />
          <SellerEarningsSoldProductsDateFilter
            value={dateRange}
            onChange={(nextRange) => handleFilterChange(() => setDateRange(nextRange))}
          />
        </div>
      </div>

      <SellerEarningsSoldProductsTable
        rows={rows}
        selectedIds={selectedIds}
        loading={loading}
        onToggleRow={handleToggleRow}
        onToggleAll={handleToggleAll}
        onViewComment={handleViewComment}
      />

      <SellerEarningsSoldProductsPagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={PAGE_SIZE}
        onChange={setPage}
      />

      <SellerEarningsRejectionCommentModal
        open={commentModalOpen}
        comment={activeComment}
        onClose={handleCloseCommentModal}
      />

      <SellerEarningsSoldProductsFooter
        selectedCount={selectedRows.filter(
          (row) =>
            row.status === SELLER_EARNINGS_SOLD_PRODUCT_STATUS.AVAILABLE
            || row.status === SELLER_EARNINGS_SOLD_PRODUCT_STATUS.REJECTED,
        ).length}
        selectedTotal={selectedTotal}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
