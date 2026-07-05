import React from 'react';
import { CloseOutlined } from '@ant-design/icons';
import {
  formatPaymentRequestAmount,
  formatPaymentRequestDateTime,
  getPaymentRequestProductTitle,
} from '../../../utils/paymentRequestDisplay';
import PaymentRequestStatusBadge from '../PaymentRequestStatusBadge/PaymentRequestStatusBadge';
import './PaymentRequestDetailsPanel.css';

function formatRequestCode(code) {
  const value = String(code || '').trim();
  if (!value) return '—';
  return value.startsWith('#') ? value : `#${value}`;
}

function formatProductCode(code) {
  const value = String(code || '').trim();
  if (!value) return '';
  return value.startsWith('#') ? value : `#${value}`;
}

export default function PaymentRequestDetailsPanel({
  request,
  loading,
  actionLoading,
  onApprove,
  onReject,
  onClose,
}) {
  if (loading) {
    return (
      <aside className="payment-request-details-panel payment-request-details-panel--empty">
        <div className="payment-request-details-panel__empty-body">
          <p>Yuklanmoqda...</p>
        </div>
      </aside>
    );
  }

  if (!request) {
    return (
      <aside className="payment-request-details-panel payment-request-details-panel--empty">
        <div className="payment-request-details-panel__head">
          <h2>So&apos;rov tafsilotlari</h2>
        </div>
        <div className="payment-request-details-panel__empty-body">
          <p>Ro&apos;yxatdan so&apos;rovni tanlang</p>
        </div>
      </aside>
    );
  }

  const canReview = request.status === 'in_process';

  return (
    <aside className="payment-request-details-panel">
      <div className="payment-request-details-panel__head">
        <h2>So&apos;rov tafsilotlari</h2>
        <button
          type="button"
          className="payment-request-details-panel__close"
          aria-label="Yopish"
          onClick={onClose}
        >
          <CloseOutlined />
        </button>
      </div>

      <div className="payment-request-details-panel__hero">
        <strong>{formatRequestCode(request.requestCode)}</strong>
        <PaymentRequestStatusBadge status={request.status} withIcon />
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
          <span className="payment-request-details-panel__seller-label">Seller</span>
          <strong>{request.sellerName}</strong>
        </div>
      </div>

      <div className="payment-request-details-panel__summary">
        <div className="payment-request-details-panel__summary-item">
          <span>So&apos;rov sanasi</span>
          <strong>{formatPaymentRequestDateTime(request.submittedAt)}</strong>
        </div>
        <div className="payment-request-details-panel__summary-item">
          <span>Mahsulotlar soni</span>
          <strong>{request.itemCount} ta</strong>
        </div>
        <div className="payment-request-details-panel__summary-item payment-request-details-panel__summary-item--wide">
          <span>Jami summa</span>
          <strong>{formatPaymentRequestAmount(request.totalAmount)}</strong>
        </div>
      </div>

      <div className="payment-request-details-panel__items-head">
        <h3>Mahsulotlar ro&apos;yxati</h3>
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
              <p>{formatProductCode(item.productCode)}</p>
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
            className="payment-request-details-panel__btn payment-request-details-panel__btn--approve"
            onClick={onApprove}
            disabled={actionLoading}
          >
            Tasdiqlash
          </button>
          <button
            type="button"
            className="payment-request-details-panel__btn payment-request-details-panel__btn--reject"
            onClick={onReject}
            disabled={actionLoading}
          >
            Rad etish
          </button>
        </div>
      ) : null}
    </aside>
  );
}
