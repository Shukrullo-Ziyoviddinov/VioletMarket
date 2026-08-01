import React from 'react';
import { resolveProductImageUrl } from '../../../utils/productDisplay';
import {
  formatAdminOrderAmount,
  formatAdminOrderDateTime,
  getAdminOrderBuyerName,
  getAdminOrderBuyerPhone,
  getAdminOrderPaymentLabel,
  getAdminOrderPaymentTone,
  getAdminOrderProductTitle,
} from '../../../utils/adminOrdersDisplay';
import AdminOrderSellerBadge from '../AdminOrderSellerBadge/AdminOrderSellerBadge';
import AdminOrderStatusBadge from '../AdminOrderStatusBadge/AdminOrderStatusBadge';
import './AdminOrderDetailModalContent.css';

function optionValue(value) {
  const text = String(value || '').trim();
  return text || '—';
}

export default function AdminOrderDetailModalContent({ order }) {
  if (!order) {
    return <p className="seller-order-detail-modal-content__empty">Ma’lumot yo‘q</p>;
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const isGroup = Boolean(order.isGroup) || items.length > 1;
  const productTitle = isGroup
    ? `${order.productCount || items.length || 1} ta mahsulot`
    : getAdminOrderProductTitle(order);
  const imageUrl = resolveProductImageUrl(order.imageUrl);
  const paymentTone = getAdminOrderPaymentTone(order.paymentMethod);
  const productCodes = Array.isArray(order.productCodes)
    ? order.productCodes.filter(Boolean)
    : String(order.productCode || '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);

  return (
    <div className="seller-order-detail-modal-content">
      <AdminOrderSellerBadge order={order} className="admin-order-seller-badge--block" />
      <AdminOrderStatusBadge trackingStatus={order.trackingStatus} />

      <div className="seller-order-detail-modal-content__product">
        <div className="seller-order-detail-modal-content__image">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={productTitle}
              onError={(event) => {
                event.currentTarget.src = resolveProductImageUrl('');
              }}
            />
          ) : (
            <span>—</span>
          )}
        </div>
        <div className="seller-order-detail-modal-content__product-text">
          <strong title={productTitle}>{productTitle}</strong>
          <p>
            {isGroup && productCodes.length > 1
              ? productCodes.join(', ')
              : order.productCode || '—'}
          </p>
        </div>
      </div>

      {isGroup && items.length ? (
        <div className="seller-order-detail-modal-content__info">
          {items.map((item) => (
            <div
              className="seller-order-detail-modal-content__row"
              key={item.id || `${item.itemIndex}-${item.unitIndex}`}
            >
              <span>{item.productCode || 'Mahsulot'}</span>
              <strong>
                {[item.color, item.size, item.storage, item.model]
                  .map((value) => String(value || '').trim())
                  .filter(Boolean)
                  .join(' · ') || formatAdminOrderAmount(item.amount)}
              </strong>
            </div>
          ))}
        </div>
      ) : (
        <div className="seller-order-detail-modal-content__info">
          <div className="seller-order-detail-modal-content__row">
            <span>Rang</span>
            <strong>{optionValue(order.color)}</strong>
          </div>
          <div className="seller-order-detail-modal-content__row">
            <span>O‘lcham</span>
            <strong>{optionValue(order.size)}</strong>
          </div>
          <div className="seller-order-detail-modal-content__row">
            <span>Xotira</span>
            <strong>{optionValue(order.storage)}</strong>
          </div>
          <div className="seller-order-detail-modal-content__row">
            <span>Model</span>
            <strong>{optionValue(order.model)}</strong>
          </div>
        </div>
      )}

      <div className="seller-order-detail-modal-content__info">
        <div className="seller-order-detail-modal-content__row">
          <span>Buyurtma ID</span>
          <strong>{order.orderCode || '—'}</strong>
        </div>
        <div className="seller-order-detail-modal-content__row">
          <span>Sana va vaqt</span>
          <strong>{formatAdminOrderDateTime(order.orderedAt)}</strong>
        </div>
        <div className="seller-order-detail-modal-content__row">
          <span>Xaridor</span>
          <strong>{getAdminOrderBuyerName(order.buyer)}</strong>
        </div>
        <div className="seller-order-detail-modal-content__row">
          <span>Telefon</span>
          <strong>{getAdminOrderBuyerPhone(order.buyer)}</strong>
        </div>
        <div className="seller-order-detail-modal-content__row">
          <span>To‘lov</span>
          <strong>
            <span
              className={`seller-order-detail-modal-content__payment seller-order-detail-modal-content__payment--${paymentTone}`}
            >
              {getAdminOrderPaymentLabel(order.paymentMethod)}
            </span>
          </strong>
        </div>
        <div className="seller-order-detail-modal-content__row">
          <span>Mahsulot narxi</span>
          <strong>{formatAdminOrderAmount(order.amount)}</strong>
        </div>
      </div>
    </div>
  );
}
