import React from 'react';
import { EyeOutlined } from '@ant-design/icons';
import {
  formatPaymentRequestAmount,
  formatPaymentRequestDateTime,
} from '../../../utils/paymentRequestDisplay';
import PaymentRequestStatusBadge from '../PaymentRequestStatusBadge/PaymentRequestStatusBadge';
import './PaymentRequestTableRow.css';

function formatRequestCode(code) {
  const value = String(code || '').trim();
  if (!value) return '—';
  return value.startsWith('#') ? value : `#${value}`;
}

export default function PaymentRequestTableRow({ request, isActive, onSelect, onView }) {
  const handleView = (event) => {
    event.stopPropagation();
    onView?.(request.id);
  };

  return (
    <tr
      className={`payment-request-table-row${isActive ? ' payment-request-table-row--active' : ''}`}
      onClick={() => onSelect?.(request.id)}
    >
      <td className="payment-request-table-row__code">
        <strong>{formatRequestCode(request.requestCode)}</strong>
      </td>
      <td>
        <div className="payment-request-table-row__seller">
          <div className="payment-request-table-row__avatar">
            {request.sellerLogoUrl ? (
              <img src={request.sellerLogoUrl} alt={request.sellerName} />
            ) : (
              <span>{request.sellerName?.charAt(0)?.toUpperCase() || 'S'}</span>
            )}
          </div>
          <span className="payment-request-table-row__seller-name">
            {request.sellerName || 'Sotuvchi'}
          </span>
        </div>
      </td>
      <td className="payment-request-table-row__date">
        {formatPaymentRequestDateTime(request.submittedAt)}
      </td>
      <td className="payment-request-table-row__count">{request.itemCount} ta</td>
      <td className="payment-request-table-row__amount">
        {formatPaymentRequestAmount(request.totalAmount)}
      </td>
      <td>
        <PaymentRequestStatusBadge status={request.status} />
      </td>
      <td className="payment-request-table-row__actions">
        <button
          type="button"
          className="payment-request-table-row__view-btn"
          aria-label="So'rov tafsilotlarini ko'rish"
          onClick={handleView}
        >
          <EyeOutlined />
        </button>
      </td>
    </tr>
  );
}
