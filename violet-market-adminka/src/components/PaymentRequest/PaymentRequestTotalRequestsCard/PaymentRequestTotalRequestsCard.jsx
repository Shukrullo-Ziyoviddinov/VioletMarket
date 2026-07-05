import React from 'react';
import { FileTextOutlined } from '@ant-design/icons';
import '../paymentRequestStatCardShared.css';

export default function PaymentRequestTotalRequestsCard() {
  return (
    <article className="payment-request-stat-card payment-request-stat-card--total">
      <div className="payment-request-stat-card__top">
        <h3 className="payment-request-stat-card__title">Jami so&apos;rovlar</h3>
        <span className="payment-request-stat-card__icon" aria-hidden="true">
          <FileTextOutlined />
        </span>
      </div>
      <p className="payment-request-stat-card__value">156</p>
      <p className="payment-request-stat-card__footer">Barcha vaqt</p>
    </article>
  );
}
