import React from 'react';
import GlobalModal from '../../GlobalModal/GlobalModal';
import {
  formatPaymentRequestAmount,
  formatPaymentRequestDateTime,
  getPaymentRequestProductTitle,
} from '../../../utils/paymentRequestDisplay';
import './PaymentRequestWithdrawalModal.css';

function formatRequestCode(code) {
  const value = String(code || '').trim();
  if (!value) return '—';
  return value.startsWith('#') ? value : `#${value}`;
}

function formatSubmittedAt(value) {
  const formatted = formatPaymentRequestDateTime(value);
  return formatted || '—';
}

export default function PaymentRequestWithdrawalModal({ open, withdrawal, onClose }) {
  const title = withdrawal
    ? `Yechish ${formatRequestCode(withdrawal.requestCode)}`
    : 'Yechish tafsilotlari';

  return (
    <GlobalModal open={open} title={title} onClose={onClose}>
      {!withdrawal ? (
        <p className="payment-request-withdrawal-modal__empty">Ma&apos;lumot topilmadi</p>
      ) : (
        <div className="payment-request-withdrawal-modal">
          <div className="payment-request-withdrawal-modal__product">
            <div className="payment-request-withdrawal-modal__image">
              {withdrawal.imageUrl ? (
                <img
                  src={withdrawal.imageUrl}
                  alt={getPaymentRequestProductTitle(withdrawal)}
                />
              ) : (
                <span>—</span>
              )}
            </div>
            <div>
              <strong>{getPaymentRequestProductTitle(withdrawal)}</strong>
              <p>{withdrawal.productCode}</p>
            </div>
          </div>

          <div className="payment-request-withdrawal-modal__info">
            <div className="payment-request-withdrawal-modal__row">
              <span>👤 Seller:</span>
              <strong>{withdrawal.sellerName || 'Sotuvchi'}</strong>
            </div>
            <div className="payment-request-withdrawal-modal__row">
              <span>📅 So&apos;rov yuborilgan sana:</span>
              <strong>{formatSubmittedAt(withdrawal.submittedAt)}</strong>
            </div>
            <div className="payment-request-withdrawal-modal__row">
              <span>✅ Yechilgan sana:</span>
              <strong>{formatSubmittedAt(withdrawal.withdrawnAt)}</strong>
            </div>
            <div className="payment-request-withdrawal-modal__row">
              <span>💰 Yechilgan summa:</span>
              <strong>{formatPaymentRequestAmount(withdrawal.amount)}</strong>
            </div>
          </div>
        </div>
      )}
    </GlobalModal>
  );
}
