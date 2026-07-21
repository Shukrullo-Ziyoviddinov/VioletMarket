import React from 'react';
import { RightOutlined } from '@ant-design/icons';
import { resolveProductImageUrl } from '../../../utils/productDisplay';
import {
  formatAdminOrderAmount,
  formatAdminOrderDateTime,
  getAdminOrderBuyerName,
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
      <div className="seller-order-collection-card__main">
        <div className="seller-order-collection-card__header">
          <AdminOrderSellerBadge order={order} />
          <AdminOrderStatusBadge trackingStatus={order.trackingStatus} />
        </div>

        <div className="seller-order-collection-card__body">
          <div className="seller-order-collection-card__product">
            <img
              className="seller-order-collection-card__image"
              src={resolveProductImageUrl(order.imageUrl)}
              alt={title}
              onError={(event) => {
                event.currentTarget.src = resolveProductImageUrl('');
              }}
            />
            <div className="seller-order-collection-card__product-text">
              <span className="seller-order-collection-card__label">Mahsulot</span>
              <strong title={title}>{title}</strong>
              <span className="seller-order-collection-card__code">
                {order.productCode || '—'}
              </span>
              {variants ? (
                <p className="seller-order-collection-card__variants" title={variants}>
                  {variants}
                </p>
              ) : null}
            </div>
          </div>

          <div className="seller-order-collection-card__meta">
            <div className="seller-order-collection-card__field">
              <span className="seller-order-collection-card__label">Buyurtma ID</span>
              <strong>{order.orderCode || '—'}</strong>
            </div>
            <div className="seller-order-collection-card__field">
              <span className="seller-order-collection-card__label">Sana va vaqt</span>
              <strong>{formatAdminOrderDateTime(order.orderedAt)}</strong>
            </div>
            <div className="seller-order-collection-card__field">
              <span className="seller-order-collection-card__label">Xaridor</span>
              <strong>{getAdminOrderBuyerName(order.buyer)}</strong>
            </div>
            <div className="seller-order-collection-card__field">
              <span className="seller-order-collection-card__label">Mahsulot narxi</span>
              <strong className="seller-order-collection-card__amount">
                {formatAdminOrderAmount(order.amount)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <span className="seller-order-collection-card__chevron" aria-hidden="true">
        <RightOutlined />
      </span>
    </button>
  );
}
