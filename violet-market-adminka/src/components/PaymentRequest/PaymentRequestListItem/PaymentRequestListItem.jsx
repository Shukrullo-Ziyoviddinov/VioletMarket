import React from 'react';
import {
  formatPaymentRequestDateTime,
  PAYMENT_REQUEST_STATUS_LABELS,
} from '../../../utils/paymentRequestDisplay';
import './PaymentRequestListItem.css';

export default function PaymentRequestListItem({ request, isActive, onSelect }) {
  const statusClass = `payment-request-list-item__status payment-request-list-item__status--${request.status}`;

  return (
    <button
      type="button"
      className={`payment-request-list-item${isActive ? ' payment-request-list-item--active' : ''}`}
      onClick={() => onSelect?.(request.id)}
    >
      <div className="payment-request-list-item__avatar">
        {request.sellerLogoUrl ? (
          <img src={request.sellerLogoUrl} alt={request.sellerName} />
        ) : (
          <span>{request.sellerName?.charAt(0)?.toUpperCase() || 'S'}</span>
        )}
      </div>
      <div className="payment-request-list-item__content">
        <div className="payment-request-list-item__head">
          <strong>{request.sellerName || 'Sotuvchi'}</strong>
          <span className="payment-request-list-item__code">{request.requestCode}</span>
        </div>
        <div className="payment-request-list-item__meta">
          <span>{formatPaymentRequestDateTime(request.submittedAt)}</span>
          <span>{request.itemCount} ta mahsulot</span>
        </div>
      </div>
      <span className={statusClass}>
        {PAYMENT_REQUEST_STATUS_LABELS[request.status] || request.status}
      </span>
    </button>
  );
}
