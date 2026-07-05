import React from 'react';
import {
  formatPaymentRequestAmount,
  formatPaymentRequestDateTime,
  getPaymentRequestProductTitle,
  PAYMENT_REQUEST_STATUS_LABELS,
} from '../../../utils/paymentRequestDisplay';
import './PaymentRequestDetailsPanel.css';

export default function PaymentRequestDetailsPanel({
  request,
  loading,
  actionLoading,
  onApprove,
  onReject,
}) {
  if (loading) {
    return (
      <section className="payment-request-details-panel payment-request-details-panel--empty">
        <p>Yuklanmoqda...</p>
      </section>
    );
  }

  if (!request) {
    return (
      <section className="payment-request-details-panel payment-request-details-panel--empty">
        <h2>So&apos;rov tafsilotlari</h2>
        <p>Ro&apos;yxatdan sotuvchini tanlang</p>
      </section>
    );
  }

  const canReview = request.status === 'in_process';

  return (
    <section className="payment-request-details-panel">
      <div className="payment-request-details-panel__head">
        <div>
          <h2>So&apos;rov tafsilotlari</h2>
          <p>{request.requestCode}</p>
        </div>
        <span className={`payment-request-details-panel__status payment-request-details-panel__status--${request.status}`}>
          {PAYMENT_REQUEST_STATUS_LABELS[request.status] || request.status}
        </span>
      </div>

      <div className="payment-request-details-panel__seller">
        <div className="payment-request-details-panel__avatar">
          {request.sellerLogoUrl ? (
            <img src={request.sellerLogoUrl} alt={request.sellerName} />
          ) : (
            <span>{request.sellerName?.charAt(0)?.toUpperCase() || 'S'}</span>
          )}
        </div>
        <div>
          <strong>{request.sellerName}</strong>
          <p>{formatPaymentRequestDateTime(request.submittedAt)}</p>
        </div>
      </div>

      <div className="payment-request-details-panel__summary">
        <div>
          <span>Mahsulotlar</span>
          <strong>{request.itemCount} ta</strong>
        </div>
        <div>
          <span>Jami summa</span>
          <strong>{formatPaymentRequestAmount(request.totalAmount)}</strong>
        </div>
      </div>

      <div className="payment-request-details-panel__items">
        {request.items?.map((item) => (
          <article key={item.id} className="payment-request-details-panel__item">
            <div className="payment-request-details-panel__item-image">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={getPaymentRequestProductTitle(item)} />
              ) : (
                <span>—</span>
              )}
            </div>
            <div className="payment-request-details-panel__item-content">
              <strong>{getPaymentRequestProductTitle(item)}</strong>
              <p>{formatPaymentRequestDateTime(item.soldAt)}</p>
            </div>
            <div className="payment-request-details-panel__item-price">
              {formatPaymentRequestAmount(item.amount || item.price)}
            </div>
          </article>
        ))}
      </div>

      {canReview ? (
        <div className="payment-request-details-panel__actions">
          <button
            type="button"
            className="payment-request-details-panel__btn payment-request-details-panel__btn--reject"
            onClick={onReject}
            disabled={actionLoading}
          >
            Rad etish
          </button>
          <button
            type="button"
            className="payment-request-details-panel__btn payment-request-details-panel__btn--approve"
            onClick={onApprove}
            disabled={actionLoading}
          >
            Tasdiqlash
          </button>
        </div>
      ) : null}
    </section>
  );
}
