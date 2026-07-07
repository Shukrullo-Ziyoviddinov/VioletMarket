import React from 'react';
import './PaymentRequestViewModalActions.css';

export default function PaymentRequestViewModalActions({
  canReview,
  actionLoading,
  onApprove,
  onReject,
  onClose,
}) {
  return (
    <div className="payment-request-view-modal-actions">
      {canReview ? (
        <div className="payment-request-view-modal-actions__primary">
          <button
            type="button"
            className="payment-request-view-modal-actions__btn payment-request-view-modal-actions__btn--approve"
            onClick={onApprove}
            disabled={actionLoading}
          >
            Tasdiqlash
          </button>
          <button
            type="button"
            className="payment-request-view-modal-actions__btn payment-request-view-modal-actions__btn--reject"
            onClick={onReject}
            disabled={actionLoading}
          >
            Rad etish
          </button>
        </div>
      ) : null}
      <button
        type="button"
        className="payment-request-view-modal-actions__btn payment-request-view-modal-actions__btn--close"
        onClick={onClose}
        disabled={actionLoading}
      >
        Yopish
      </button>
    </div>
  );
}
