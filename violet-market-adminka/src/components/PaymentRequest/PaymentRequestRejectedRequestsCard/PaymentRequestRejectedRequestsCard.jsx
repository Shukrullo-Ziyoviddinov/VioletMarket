import React from 'react';
import { DeleteOutlined } from '@ant-design/icons';
import '../paymentRequestStatCardShared.css';

export default function PaymentRequestRejectedRequestsCard() {
  return (
    <article className="payment-request-stat-card payment-request-stat-card--rejected">
      <div className="payment-request-stat-card__top">
        <h3 className="payment-request-stat-card__title">Rad etilgan so&apos;rovlar</h3>
        <span className="payment-request-stat-card__icon" aria-hidden="true">
          <DeleteOutlined />
        </span>
      </div>
      <p className="payment-request-stat-card__value">16</p>
      <p className="payment-request-stat-card__footer">Jami summa: 98 750 000 so&apos;m</p>
    </article>
  );
}
