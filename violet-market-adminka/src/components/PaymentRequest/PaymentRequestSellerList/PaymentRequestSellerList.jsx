import React from 'react';
import PaymentRequestTableRow from '../PaymentRequestTableRow/PaymentRequestTableRow';
import PaymentRequestPagination from '../PaymentRequestPagination/PaymentRequestPagination';
import './PaymentRequestSellerList.css';

const TABLE_COLUMNS = [
  "So'rov raqami",
  'Seller',
  'Sana',
  'Mahsulotlar soni',
  'Jami summa',
  'Holati',
  'Amallar',
];

export default function PaymentRequestSellerList({
  requests,
  activeRequestId,
  onSelect,
  page,
  totalPages,
  total = 0,
  limit = 10,
  onPageChange,
  loading,
}) {
  return (
    <section className="payment-request-seller-list">
      <div className="payment-request-seller-list__table-wrap">
        <table className="payment-request-seller-list__table">
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
                <td colSpan={TABLE_COLUMNS.length} className="payment-request-seller-list__empty">
                  Yuklanmoqda...
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={TABLE_COLUMNS.length} className="payment-request-seller-list__empty">
                  So&apos;rovlar topilmadi
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <PaymentRequestTableRow
                  key={request.id}
                  request={request}
                  isActive={activeRequestId === request.id}
                  onSelect={onSelect}
                  onView={onSelect}
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
