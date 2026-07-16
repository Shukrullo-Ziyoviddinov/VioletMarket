import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  formatSellerOrderAmount,
  formatSellerOrderDateTime,
  getSellerOrderBuyerName,
  getSellerOrderPaymentLabel,
  getSellerOrderProductCodesLabel,
} from '../../../utils/sellerOrdersDisplay';
import './SellerOrderCard.css';

export default function SellerOrderCard({ order }) {
  const { t } = useTranslation();

  if (!order) return null;

  const paymentMethod = String(order.paymentMethod || '').toLowerCase();

  return (
    <article className="seller-order-card">
      <div className="seller-order-card__top">
        <strong className="seller-order-card__code">{getSellerOrderProductCodesLabel(order)}</strong>
        <span
          className={`seller-order-card__payment seller-order-card__payment--${paymentMethod || 'unknown'}`}
        >
          {getSellerOrderPaymentLabel(order.paymentMethod, t)}
        </span>
      </div>

      <dl className="seller-order-card__meta">
        <div className="seller-order-card__row">
          <dt>{t('orders.card.orderId')}</dt>
          <dd>{order.orderCode || '—'}</dd>
        </div>
        <div className="seller-order-card__row">
          <dt>{t('orders.card.orderedAt')}</dt>
          <dd>{formatSellerOrderDateTime(order.orderedAt, t)}</dd>
        </div>
        <div className="seller-order-card__row">
          <dt>{t('orders.card.buyer')}</dt>
          <dd>{getSellerOrderBuyerName(order.buyer)}</dd>
        </div>
        <div className="seller-order-card__row">
          <dt>{t('orders.card.amount')}</dt>
          <dd className="seller-order-card__amount">{formatSellerOrderAmount(order.amount)}</dd>
        </div>
      </dl>
    </article>
  );
}
