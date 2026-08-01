import React from 'react';
import { useTranslation } from 'react-i18next';
import { resolveAssetUrl } from '../../../utils/mediaUrl';
import {
  formatSellerOrderAmount,
  formatSellerOrderDateTime,
  getSellerOrderBuyerName,
  getSellerOrderBuyerPhone,
  getSellerOrderPaymentLabel,
  getSellerOrderPaymentTone,
  getSellerOrderProductTitle,
} from '../../../utils/sellerOrdersDisplay';
import './SellerOrderDetailModalContent.css';

function optionValue(value) {
  const text = String(value || '').trim();
  return text || '—';
}

export default function SellerOrderDetailModalContent({ order }) {
  const { t, i18n } = useTranslation();

  if (!order) {
    return <p className="seller-order-detail-modal-content__empty">{t('orders.modal.empty')}</p>;
  }

  const items = Array.isArray(order?.items) ? order.items : [];
  const isGroup = items.length > 1 || Boolean(order?.isGroup);
  const productCodes = Array.isArray(order?.productCodes)
    ? order.productCodes.filter(Boolean)
    : String(order?.productCode || '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);

  const productTitle = isGroup
    ? t('orders.card.productCount', {
        count: order.productCount || items.length || productCodes.length || 1,
        defaultValue: '{{count}} ta mahsulot',
      })
    : getSellerOrderProductTitle(order, i18n.language);
  const imageUrl = resolveAssetUrl(
    isGroup ? items[0]?.imageUrl || order.imageUrl : order.imageUrl,
  );
  const paymentTone = getSellerOrderPaymentTone(order.paymentMethod);
  const codeLabel =
    isGroup && productCodes.length
      ? productCodes.join(', ')
      : order.productCode || '—';

  return (
    <div className="seller-order-detail-modal-content">
      <div className="seller-order-detail-modal-content__product">
        <div className="seller-order-detail-modal-content__image">
          {imageUrl ? <img src={imageUrl} alt={productTitle} /> : <span>—</span>}
        </div>
        <div className="seller-order-detail-modal-content__product-text">
          <strong title={productTitle}>{productTitle}</strong>
          <p title={codeLabel}>{codeLabel}</p>
        </div>
      </div>

      <div className="seller-order-detail-modal-content__info">
        {!isGroup ? (
          <>
            <div className="seller-order-detail-modal-content__row">
              <span>{t('orders.modal.color')}</span>
              <strong>{optionValue(order.color)}</strong>
            </div>
            <div className="seller-order-detail-modal-content__row">
              <span>{t('orders.modal.size')}</span>
              <strong>{optionValue(order.size)}</strong>
            </div>
            <div className="seller-order-detail-modal-content__row">
              <span>{t('orders.modal.storage')}</span>
              <strong>{optionValue(order.storage)}</strong>
            </div>
            <div className="seller-order-detail-modal-content__row">
              <span>{t('orders.modal.model')}</span>
              <strong>{optionValue(order.model)}</strong>
            </div>
          </>
        ) : null}
        <div className="seller-order-detail-modal-content__row">
          <span>{t('orders.card.orderId')}</span>
          <strong>{order.orderCode || '—'}</strong>
        </div>
        <div className="seller-order-detail-modal-content__row">
          <span>{t('orders.card.orderedAt')}</span>
          <strong>{formatSellerOrderDateTime(order.orderedAt, t)}</strong>
        </div>
        <div className="seller-order-detail-modal-content__row">
          <span>{t('orders.card.buyer')}</span>
          <strong>{getSellerOrderBuyerName(order.buyer)}</strong>
        </div>
        <div className="seller-order-detail-modal-content__row">
          <span>{t('orders.card.phone')}</span>
          <strong>{getSellerOrderBuyerPhone(order.buyer)}</strong>
        </div>
        <div className="seller-order-detail-modal-content__row">
          <span>{t('orders.card.payment')}</span>
          <strong>
            <span
              className={`seller-order-detail-modal-content__payment seller-order-detail-modal-content__payment--${paymentTone}`}
            >
              {getSellerOrderPaymentLabel(order.paymentMethod, t)}
            </span>
          </strong>
        </div>
        <div className="seller-order-detail-modal-content__row">
          <span>{t('orders.card.amount')}</span>
          <strong>{formatSellerOrderAmount(order.amount)}</strong>
        </div>
      </div>
    </div>
  );
}
