import React from 'react';
import GlobalModal from '../../GlobalModal/GlobalModal';
import {
  formatPaymentRequestAmount,
  formatPaymentRequestDateTime,
  getPaymentRequestModalStatusLabel,
} from '../../../utils/paymentRequestDisplay';
import PaymentRequestStatusBadge from '../PaymentRequestStatusBadge/PaymentRequestStatusBadge';
import PaymentRequestViewModalActions from '../PaymentRequestViewModalActions/PaymentRequestViewModalActions';
import './PaymentRequestViewModal.css';

function formatRequestCode(code) {
  const value = String(code || '').trim();
  if (!value) return '—';
  return value.startsWith('#') ? value : `#${value}`;
}

export default function PaymentRequestViewModal({
  open,
  request,
  loading,
  actionLoading,
  onClose,
  onApprove,
  onReject,
}) {
  const canReview = request?.status === 'in_process';

  return (
    <GlobalModal
      open={open}
      title={request ? `So'rov ${formatRequestCode(request.requestCode)}` : "So'rov ma'lumotlari"}
      onClose={onClose}
    >
      {loading ? (
        <p className="payment-request-view-modal__loading">Yuklanmoqda...</p>
      ) : !request ? (
        <p className="payment-request-view-modal__loading">Ma&apos;lumot topilmadi</p>
      ) : (
        <>
          <div className="payment-request-view-modal__info">
            <div className="payment-request-view-modal__row">
              <span className="payment-request-view-modal__label">👤 Seller:</span>
              <strong>{request.sellerName || 'Sotuvchi'}</strong>
            </div>
            <div className="payment-request-view-modal__row">
              <span className="payment-request-view-modal__label">📅 Yuborilgan sana:</span>
              <strong>{formatPaymentRequestDateTime(request.submittedAt)}</strong>
            </div>
            <div className="payment-request-view-modal__row">
              <span className="payment-request-view-modal__label">💰 Jami summa:</span>
              <strong>{formatPaymentRequestAmount(request.totalAmount)}</strong>
            </div>
            <div className="payment-request-view-modal__row payment-request-view-modal__row--status">
              <span className="payment-request-view-modal__label">📌 Status:</span>
              <PaymentRequestStatusBadge
                status={request.status}
                label={getPaymentRequestModalStatusLabel(request.status)}
                withIcon
              />
            </div>
          </div>

          <PaymentRequestViewModalActions
            canReview={canReview}
            actionLoading={actionLoading}
            onApprove={onApprove}
            onReject={onReject}
            onClose={onClose}
          />
        </>
      )}
    </GlobalModal>
  );
}
