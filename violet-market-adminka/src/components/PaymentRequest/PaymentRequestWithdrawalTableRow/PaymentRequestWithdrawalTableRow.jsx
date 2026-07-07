import React from 'react';
import { EyeOutlined } from '@ant-design/icons';
import {
  formatPaymentRequestAmount,
  formatPaymentRequestDateTime,
  getPaymentRequestProductTitle,
} from '../../../utils/paymentRequestDisplay';
import './PaymentRequestWithdrawalTableRow.css';

function formatRequestCode(code) {
  const value = String(code || '').trim();
  if (!value) return '—';
  return value.startsWith('#') ? value : `#${value}`;
}

export default function PaymentRequestWithdrawalTableRow({ withdrawal, onView }) {
  return (
    <tr className="payment-request-withdrawal-table-row">
      <td className="payment-request-withdrawal-table-row__code">
        <strong>{formatRequestCode(withdrawal.requestCode)}</strong>
      </td>
      <td>
        <div className="payment-request-withdrawal-table-row__seller">
          <div className="payment-request-withdrawal-table-row__avatar">
            {withdrawal.sellerLogoUrl ? (
              <img src={withdrawal.sellerLogoUrl} alt={withdrawal.sellerName} />
            ) : (
              <span>{withdrawal.sellerName?.charAt(0)?.toUpperCase() || 'S'}</span>
            )}
          </div>
          <span>{withdrawal.sellerName || 'Sotuvchi'}</span>
        </div>
      </td>
      <td>
        <div className="payment-request-withdrawal-table-row__product">
          <div className="payment-request-withdrawal-table-row__product-image">
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
      </td>
      <td className="payment-request-withdrawal-table-row__date">
        {formatPaymentRequestDateTime(withdrawal.withdrawnAt)}
      </td>
      <td className="payment-request-withdrawal-table-row__amount">
        {formatPaymentRequestAmount(withdrawal.amount)}
      </td>
      <td className="payment-request-withdrawal-table-row__actions">
        <button
          type="button"
          className="payment-request-withdrawal-table-row__view-btn"
          aria-label="Yechish tafsilotlarini ko'rish"
          onClick={() => onView?.(withdrawal)}
        >
          <EyeOutlined />
        </button>
      </td>
    </tr>
  );
}
