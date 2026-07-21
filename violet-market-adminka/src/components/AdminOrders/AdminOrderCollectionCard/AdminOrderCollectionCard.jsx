import React from 'react';
import { RightOutlined } from '@ant-design/icons';
import { resolveProductImageUrl } from '../../../utils/productDisplay';
import {
  formatAdminOrderAmount,
  getAdminOrderProductTitle,
} from '../../../utils/adminOrdersDisplay';
import AdminOrderSellerBadge from '../AdminOrderSellerBadge/AdminOrderSellerBadge';
import AdminOrderStatusBadge from '../AdminOrderStatusBadge/AdminOrderStatusBadge';
import './AdminOrderCollectionCard.css';

function buildVariantText(order) {
  return [
    order.color ? `Rang: ${order.color}` : '',
    order.size ? `O‘lcham: ${order.size}` : '',
    order.storage ? `Xotira: ${order.storage}` : '',
    order.model ? `Model: ${order.model}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

export default function AdminOrderCollectionCard({ order, onOpen }) {
  const title = getAdminOrderProductTitle(order);
  const variants = buildVariantText(order);

  return (
    <button
      type="button"
      className="seller-order-collection-card"
      onClick={() => onOpen?.(order)}
    >
      <img
        className="seller-order-collection-card__image"
        src={resolveProductImageUrl(order.imageUrl)}
        alt={title}
        onError={(event) => {
          event.currentTarget.src = resolveProductImageUrl('');
        }}
      />

      <div className="seller-order-collection-card__content">
        <AdminOrderSellerBadge order={order} className="admin-order-seller-badge--block" />
        <AdminOrderStatusBadge trackingStatus={order.trackingStatus} />
        <strong title={title}>{title}</strong>
        <span>{order.productCode || '—'}</span>
        {variants ? <p title={variants}>{variants}</p> : null}
      </div>

      <div className="seller-order-collection-card__amount">
        {formatAdminOrderAmount(order.amount)}
      </div>

      <RightOutlined className="seller-order-collection-card__chevron" />
    </button>
  );
}
