import React from 'react';
import PaymentRequestWithdrawalTableRow from '../PaymentRequestWithdrawalTableRow/PaymentRequestWithdrawalTableRow';
import PaymentRequestPagination from '../PaymentRequestPagination/PaymentRequestPagination';
import './PaymentRequestWithdrawalList.css';

const TABLE_COLUMNS = [
  "So'rov raqami",
  'Seller',
  'Mahsulot',
  'Yechilgan sana',
  'Summa',
  'Amallar',
];

export default function PaymentRequestWithdrawalList({
  withdrawals,
  page,
  totalPages,
  total = 0,
  limit = 10,
  onPageChange,
  loading,
  onView,
}) {
  return (
    <section className="payment-request-withdrawal-list">
      <div className="payment-request-withdrawal-list__table-wrap">
        <table className="payment-request-withdrawal-list__table">
          <thead>
            <tr>
              {TABLE_COLUMNS.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={TABLE_COLUMNS.length} className="payment-request-withdrawal-list__empty">
                  Yuklanmoqda...
                </td>
              </tr>
            ) : withdrawals.length === 0 ? (
              <tr>
                <td colSpan={TABLE_COLUMNS.length} className="payment-request-withdrawal-list__empty">
                  Yechilgan mahsulotlar topilmadi
                </td>
              </tr>
            ) : (
              withdrawals.map((withdrawal) => (
                <PaymentRequestWithdrawalTableRow
                  key={withdrawal.id}
                  withdrawal={withdrawal}
                  onView={onView}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <PaymentRequestPagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onChange={onPageChange}
      />
    </section>
  );
}
