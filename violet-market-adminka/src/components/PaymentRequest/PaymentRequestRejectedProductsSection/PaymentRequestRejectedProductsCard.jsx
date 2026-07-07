import React from 'react';
import { DeleteOutlined } from '@ant-design/icons';
import '../paymentRequestStatCardShared.css';
import './PaymentRequestRejectedProductsCard.css';

export default function PaymentRequestRejectedProductsCard({
  count = 0,
  uniqueCount = 0,
  onClick,
}) {
  return (
    <button
      type="button"
      className="payment-request-stat-card payment-request-stat-card--rejected payment-request-rejected-products-card"
      onClick={onClick}
    >
      <div className="payment-request-stat-card__top">
        <h3 className="payment-request-stat-card__title">Rad etilgan mahsulotlar</h3>
        <span className="payment-request-stat-card__icon" aria-hidden="true">
          <DeleteOutlined />
        </span>
      </div>
      <p className="payment-request-stat-card__value">{count}</p>
      <p className="payment-request-stat-card__footer">
        {uniqueCount} ta mahsulot · batafsil ko&apos;rish
      </p>
    </button>
  );
}
