import React from 'react';
import { CheckCircleOutlined } from '@ant-design/icons';
import { formatPaymentRequestAmount } from '../../../utils/paymentRequestDisplay';
import '../paymentRequestStatCardShared.css';
import './PaymentRequestWithdrawalsCard.css';

export default function PaymentRequestWithdrawalsCard({
  count = 0,
  productCount = 0,
  amount = 0,
  onClick,
}) {
  return (
    <button
      type="button"
      className="payment-request-stat-card payment-request-stat-card--resolved payment-request-withdrawals-card"
      onClick={onClick}
    >
      <div className="payment-request-stat-card__top">
        <h3 className="payment-request-stat-card__title">Yechilgan so&apos;rovlar</h3>
        <span className="payment-request-stat-card__icon" aria-hidden="true">
          <CheckCircleOutlined />
        </span>
      </div>
      <p className="payment-request-stat-card__value">{count}</p>
      <p className="payment-request-stat-card__footer">
        {productCount} ta mahsulot · {formatPaymentRequestAmount(amount)}
      </p>
    </button>
  );
}
