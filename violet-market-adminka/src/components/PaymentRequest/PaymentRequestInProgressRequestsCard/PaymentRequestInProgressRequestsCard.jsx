import React from 'react';
import { ClockCircleOutlined } from '@ant-design/icons';
import '../paymentRequestStatCardShared.css';

export default function PaymentRequestInProgressRequestsCard() {
  return (
    <article className="payment-request-stat-card payment-request-stat-card--in-progress">
      <div className="payment-request-stat-card__top">
        <h3 className="payment-request-stat-card__title">Jarayondagi so&apos;rovlar</h3>
        <span className="payment-request-stat-card__icon" aria-hidden="true">
          <ClockCircleOutlined />
        </span>
      </div>
      <p className="payment-request-stat-card__value">12</p>
      <p className="payment-request-stat-card__footer">Jami summa: 215 000 000 so&apos;m</p>
    </article>
  );
}
