import React from 'react';
import { DeleteOutlined } from '@ant-design/icons';
import { formatPaymentRequestAmount } from '../../../utils/paymentRequestDisplay';
import '../paymentRequestStatCardShared.css';

export default function PaymentRequestRejectedRequestsCard({ count = 0, amount = 0 }) {
  return (
    <article className="payment-request-stat-card payment-request-stat-card--rejected">
      <div className="payment-request-stat-card__top">
        <h3 className="payment-request-stat-card__title">Rad etilgan so&apos;rovlar</h3>
        <span className="payment-request-stat-card__icon" aria-hidden="true">
          <DeleteOutlined />
        </span>
      </div>
      <p className="payment-request-stat-card__value">{count}</p>
      <p className="payment-request-stat-card__footer">
        Jami summa: {formatPaymentRequestAmount(amount)}
      </p>
    </article>
  );
}
