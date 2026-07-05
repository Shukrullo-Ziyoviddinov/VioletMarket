import React from 'react';
import { CheckCircleOutlined } from '@ant-design/icons';
import '../paymentRequestStatCardShared.css';

export default function PaymentRequestResolvedRequestsCard() {
  return (
    <article className="payment-request-stat-card payment-request-stat-card--resolved">
      <div className="payment-request-stat-card__top">
        <h3 className="payment-request-stat-card__title">Yechilgan so&apos;rovlar</h3>
        <span className="payment-request-stat-card__icon" aria-hidden="true">
          <CheckCircleOutlined />
        </span>
      </div>
      <p className="payment-request-stat-card__value">128</p>
      <p className="payment-request-stat-card__footer">Jami summa: 2 450 250 000 so&apos;m</p>
    </article>
  );
}
