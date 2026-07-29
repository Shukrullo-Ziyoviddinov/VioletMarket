import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatPrice, getLocalizedText, normalizeImagePath } from '../../../utils/utils';
import UserOrderTrackingTimeline from '../UserOrderTrackingTimeline/UserOrderTrackingTimeline';
import './UserOrderTrackingCard.css';

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

export default function UserOrderTrackingCard({ order }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'uz';
  const title = getLocalizedText(order.title, lang) || t('orderHistory.productFallback');
  const variantText = buildVariantText(order, t);

  return (
    <article className="user-order-tracking-card">
      <header className="user-order-tracking-card__header">
        <span>{t('orderHistory.orderNumber')}</span>
        <strong>{order.orderCode}</strong>
      </header>

      <div className="user-order-tracking-card__product">
        <img
          className="user-order-tracking-card__image"
          src={normalizeImagePath(order.imageUrl)}
          alt={title}
        />
        <div className="user-order-tracking-card__info">
          <h2>{title}</h2>
          {variantText ? <p>{variantText}</p> : null}
          <span>{t('orderHistory.quantity', { count: order.quantity })}</span>
          <strong className="user-order-tracking-card__price">
            {formatPrice(order.lineTotal || order.price)}
          </strong>
        </div>
      </div>

      <div className="user-order-tracking-card__tracking">
        <UserOrderTrackingTimeline
          steps={order.steps}
          sellerCountry={order.seller?.country || ''}
        />
      </div>
    </article>
  );
}
