import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  formatSellerOrderAmount,
  formatSellerOrderDateTime,
  getSellerOrderBuyerName,
  getSellerOrderPaymentLabel,
} from '../../../utils/sellerOrdersDisplay';
import './SellerOrderCard.css';

export default function SellerOrderCard({ order }) {
  const { t } = useTranslation();

  if (!order) return null;

  const paymentMethod = String(order.paymentMethod || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_');
  const productCode = String(order.productCode || '').trim() || '—';

  return (
    <article className="seller-order-card">
      <div className="seller-order-card__fields">
        <div className="seller-order-card__field">
          <span className="seller-order-card__label">{t('orders.card.barcode')}</span>
          <strong className="seller-order-card__value">{productCode}</strong>
        </div>

        <div className="seller-order-card__field">
          <span className="seller-order-card__label">{t('orders.card.orderId')}</span>
          <strong className="seller-order-card__value">{order.orderCode || '—'}</strong>
        </div>

        <div className="seller-order-card__field seller-order-card__field--grow">
          <span className="seller-order-card__label">{t('orders.card.orderedAt')}</span>
          <strong className="seller-order-card__value">
            {formatSellerOrderDateTime(order.orderedAt, t)}
          </strong>
        </div>

        <div className="seller-order-card__field seller-order-card__field--grow">
          <span className="seller-order-card__label">{t('orders.card.buyer')}</span>
          <strong className="seller-order-card__value">{getSellerOrderBuyerName(order.buyer)}</strong>
        </div>

        <div className="seller-order-card__field">
          <span className="seller-order-card__label">{t('orders.card.payment')}</span>
          <span
            className={`seller-order-card__payment seller-order-card__payment--${paymentMethod || 'unknown'}`}
          >
            {getSellerOrderPaymentLabel(order.paymentMethod, t)}
          </span>
        </div>

        <div className="seller-order-card__field">
          <span className="seller-order-card__label">{t('orders.card.amount')}</span>
          <strong className="seller-order-card__value seller-order-card__value--amount">
            {formatSellerOrderAmount(order.amount)}
          </strong>
        </div>
      </div>
    </article>
  );
}
