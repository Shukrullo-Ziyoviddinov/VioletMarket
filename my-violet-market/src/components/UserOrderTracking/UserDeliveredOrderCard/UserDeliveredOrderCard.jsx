import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatPrice, getLocalizedText, normalizeImagePath } from '../../../utils/utils';
import './UserDeliveredOrderCard.css';

function buildVariantText(order, t) {
  return [
    order.color ? `${t('orderHistory.color')}: ${order.color}` : '',
    order.size ? `${t('orderHistory.size')}: ${order.size}` : '',
    order.storage ? `${t('orderHistory.storage')}: ${order.storage}` : '',
    order.model ? `${t('orderHistory.model')}: ${order.model}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

function formatDeliveredDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function UserDeliveredOrderCard({ order }) {
  const { t, i18n } = useTranslation();
  const title =
    getLocalizedText(order.title, i18n.language || 'uz') ||
    t('orderHistory.productFallback');
  const variantText = buildVariantText(order, t);

  return (
    <article className="user-delivered-order-card">
      <div className="user-delivered-order-card__product">
        <img
          className="user-delivered-order-card__image"
          src={normalizeImagePath(order.imageUrl)}
          alt={title}
        />

        <div className="user-delivered-order-card__info">
          <h2 title={title}>{title}</h2>
          {variantText ? <p>{variantText}</p> : null}
          <span>{t('orderHistory.quantity', { count: order.quantity })}</span>
        </div>

        <strong className="user-delivered-order-card__price">
          {formatPrice(order.lineTotal || order.price)}
        </strong>
      </div>

      <div className="user-delivered-order-card__meta">
        <div>
          <span>{t('orderHistory.trackingCode')}</span>
          <strong>{order.trackingCode || '—'}</strong>
        </div>
        <div>
          <span>{t('orderHistory.deliveredAt')}</span>
          <strong>{formatDeliveredDate(order.deliveredAt)}</strong>
        </div>
      </div>
    </article>
  );
}
