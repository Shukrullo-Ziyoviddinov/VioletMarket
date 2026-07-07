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
import SellerEarningsSoldProductsStatusFilter from '../SellerEarningsSoldProductsStatusFilter/SellerEarningsSoldProductsStatusFilter';
import SellerEarningsSoldProductsTable from '../SellerEarningsSoldProductsTable/SellerEarningsSoldProductsTable';
import SellerEarningsRejectionCommentModal from '../SellerEarningsRejectionCommentModal/SellerEarningsRejectionCommentModal';
import './SellerEarningsSoldProductsSection.css';

export default function SellerEarningsSoldProductsSection({ token, onSummaryChange }) {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const [dateRange, setDateRange] = useState(getDefaultSoldProductsDateRange);
  const [rows, setRows] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [activeComment, setActiveComment] = useState('');

  const loadSoldItems = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const items = await fetchSellerSoldItems(token, {
        status: statusFilter,
        dateFrom: formatSoldProductsDateParam(dateRange?.[0]),
        dateTo: formatSoldProductsDateParam(dateRange?.[1]),
      });
      setRows(items);
      setSelectedIds((prev) => prev.filter((id) => items.some((item) => item.id === id)));
    } catch {
      setRows([]);
      setSelectedIds([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange, statusFilter, token]);

  useEffect(() => {
    loadSoldItems();
  }, [loadSoldItems]);

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIds.includes(row.id)),
    [rows, selectedIds],
  );

  const selectedTotal = selectedRows.reduce((sum, row) => sum + (Number(row.price) || 0), 0);

  const handleToggleRow = (rowId) => {
    setSelectedIds((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId],
    );
  };

  const handleToggleAll = (checked, selectableRows) => {
    if (!checked) {
      setSelectedIds((prev) =>
        prev.filter((id) => !selectableRows.some((row) => row.id === id)),
      );
      return;
    }

    setSelectedIds((prev) => {
      const next = new Set(prev);
      selectableRows.forEach((row) => next.add(row.id));
      return [...next];
    });
  };

  const handleSubmit = async () => {
    if (!token || !selectedIds.length) return;

    setSubmitting(true);
    try {
      const result = await submitSellerWithdrawalRequest(token, selectedIds);
      setSelectedIds([]);
      await loadSoldItems();
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
            onChange={setStatusFilter}
            isOpen={statusFilterOpen}
            onOpenChange={setStatusFilterOpen}
          />
          <SellerEarningsSoldProductsDateFilter value={dateRange} onChange={setDateRange} />
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
