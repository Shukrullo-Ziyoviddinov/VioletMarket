import React from 'react';
import { ClockCircleOutlined } from '@ant-design/icons';
import { formatPaymentRequestAmount } from '../../../utils/paymentRequestDisplay';
import '../paymentRequestStatCardShared.css';

export default function PaymentRequestInProgressRequestsCard({ count = 0, amount = 0 }) {
  return (
    <article className="payment-request-stat-card payment-request-stat-card--in-progress">
      <div className="payment-request-stat-card__top">
        <h3 className="payment-request-stat-card__title">Jarayondagi so&apos;rovlar</h3>
        <span className="payment-request-stat-card__icon" aria-hidden="true">
          <ClockCircleOutlined />
        </span>
      </div>
      <p className="payment-request-stat-card__value">{count}</p>
      <p className="payment-request-stat-card__footer">
        Jami summa: {formatPaymentRequestAmount(amount)}
      </p>
    </article>
  );
}
