import React from 'react';
import { useTranslation } from 'react-i18next';
import SellerEarningsSoldProductsPagination from '../../SellerEarnings/SellerEarningsSoldProductsPagination/SellerEarningsSoldProductsPagination';
import SellerWithdrawalsTableRow from '../SellerWithdrawalsTableRow/SellerWithdrawalsTableRow';
import './SellerWithdrawalsList.css';

export default function SellerWithdrawalsList({
  withdrawals,
  page,
  totalPages,
  total = 0,
  limit = 10,
  onPageChange,
  loading,
  onView,
}) {
  const { t } = useTranslation();
  const columns = [
    t('sellerWithdrawals.columns.requestCode'),
    t('sellerWithdrawals.columns.product'),
    t('sellerWithdrawals.columns.withdrawnAt'),
    t('sellerWithdrawals.columns.amount'),
    t('sellerWithdrawals.columns.actions'),
  ];

  return (
    <section className="seller-withdrawals-list">
      <div className="seller-withdrawals-list__table-wrap">
        <table className="seller-withdrawals-list__table">
          <colgroup>
            <col className="seller-withdrawals-list__col-code" />
            <col className="seller-withdrawals-list__col-product" />
            <col className="seller-withdrawals-list__col-date" />
            <col className="seller-withdrawals-list__col-amount" />
            <col className="seller-withdrawals-list__col-actions" />
          </colgroup>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="seller-withdrawals-list__empty">
                  {t('sellerWithdrawals.loading')}
                </td>
              </tr>
            ) : withdrawals.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="seller-withdrawals-list__empty">
                  {t('sellerWithdrawals.empty')}
                </td>
              </tr>
            ) : (
              withdrawals.map((withdrawal) => (
                <SellerWithdrawalsTableRow
                  key={withdrawal.id}
                  withdrawal={withdrawal}
                  onView={onView}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <SellerEarningsSoldProductsPagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onChange={onPageChange}
      />
    </section>
  );
}
