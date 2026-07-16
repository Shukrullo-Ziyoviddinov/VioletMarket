import React from 'react';
import { RightOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { resolveAssetUrl } from '../../../utils/mediaUrl';
import {
  formatSellerOrderAmount,
  getSellerOrderProductTitle,
} from '../../../utils/sellerOrdersDisplay';
import './SellerOrderCollectionCard.css';

function buildVariantText(order, t) {
  return [
    order.color ? `${t('orders.modal.color')}: ${order.color}` : '',
    order.size ? `${t('orders.modal.size')}: ${order.size}` : '',
    order.storage ? `${t('orders.modal.storage')}: ${order.storage}` : '',
    order.model ? `${t('orders.modal.model')}: ${order.model}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

export default function SellerOrderCollectionCard({ order, onOpen }) {
  const { t, i18n } = useTranslation();
  const title = getSellerOrderProductTitle(order, i18n.language);
  const variants = buildVariantText(order, t);

  return (
    <button
      type="button"
      className="seller-order-collection-card"
      onClick={() => onOpen?.(order)}
    >
      <img
        className="seller-order-collection-card__image"
        src={resolveAssetUrl(order.imageUrl)}
        alt={title}
      />

      <div className="seller-order-collection-card__content">
        <strong title={title}>{title}</strong>
        <span>{order.productCode || '—'}</span>
        {variants ? <p title={variants}>{variants}</p> : null}
      </div>

      <div className="seller-order-collection-card__amount">
        {formatSellerOrderAmount(order.amount)}
      </div>

      <RightOutlined className="seller-order-collection-card__chevron" />
    </button>
  );
}
