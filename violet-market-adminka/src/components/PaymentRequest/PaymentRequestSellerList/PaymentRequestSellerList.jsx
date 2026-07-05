import React from 'react';
import PaymentRequestListItem from '../PaymentRequestListItem/PaymentRequestListItem';
import PaymentRequestPagination from '../PaymentRequestPagination/PaymentRequestPagination';
import './PaymentRequestSellerList.css';

export default function PaymentRequestSellerList({
  requests,
  activeRequestId,
  onSelect,
  page,
  totalPages,
  onPageChange,
  loading,
}) {
  return (
    <section className="payment-request-seller-list">
      <div className="payment-request-seller-list__head">
        <h2>So&apos;rov yuborgan sotuvchilar</h2>
      </div>
      <div className="payment-request-seller-list__body">
        {loading ? (
          <p className="payment-request-seller-list__empty">Yuklanmoqda...</p>
        ) : requests.length === 0 ? (
          <p className="payment-request-seller-list__empty">So&apos;rovlar topilmadi</p>
        ) : (
          requests.map((request) => (
            <PaymentRequestListItem
              key={request.id}
              request={request}
              isActive={activeRequestId === request.id}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
      <PaymentRequestPagination page={page} totalPages={totalPages} onChange={onPageChange} />
    </section>
  );
}
