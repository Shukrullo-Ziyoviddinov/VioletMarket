import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  getSellerOrderBuyerName,
  getSellerOrderBuyerPhone,
} from '../../../utils/sellerOrdersDisplay';
import './SellerOrderHandedCard.css';

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getCourierName(courier) {
  if (!courier) return '';
  return [courier.firstName, courier.lastName].filter(Boolean).join(' ').trim();
}

export default function SellerOrderHandedCard({ order }) {
  const { t } = useTranslation();
  const items = Array.isArray(order?.items) ? order.items : [];
  const isGroup = items.length > 1 || Boolean(order?.isGroup);
  const productCodes = Array.isArray(order?.productCodes)
    ? order.productCodes.filter(Boolean)
    : String(order?.productCode || '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
  const courierAccepted = Boolean(order?.courierAccepted && order?.courier);
  const courierName = getCourierName(order?.courier);

  return (
    <div className="seller-order-handed-card">
      {isGroup ? (
        <div className="seller-order-handed-card__row">
          <span>{t('orders.card.orderCode', { defaultValue: 'Buyurtma' })}</span>
          <strong>{order.orderCode || '—'}</strong>
        </div>
      ) : null}

      <div className="seller-order-handed-card__row">
        <span>
          {isGroup
            ? t('orders.card.barcodes', { defaultValue: 'Shtrix kodlar' })
            : t('orders.card.barcode')}
        </span>
        {isGroup && productCodes.length > 1 ? (
          <ul className="seller-order-handed-card__codes">
            {productCodes.map((code) => (
              <li key={code}>
                <strong>{code}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <strong>{productCodes[0] || order.productCode || '—'}</strong>
        )}
      </div>

      {isGroup ? (
        <div className="seller-order-handed-card__row">
          <span>{t('orders.card.products', { defaultValue: 'Mahsulotlar' })}</span>
          <strong>
            {t('orders.card.productCount', {
              count: order.productCount || items.length || productCodes.length || 1,
              defaultValue: '{{count}} ta mahsulot',
            })}
          </strong>
        </div>
      ) : null}

      <div className="seller-order-handed-card__row">
        <span>{t('orders.card.buyer')}</span>
        <strong>{getSellerOrderBuyerName(order.buyer)}</strong>
      </div>
      <div className="seller-order-handed-card__row">
        <span>{t('orders.card.phone')}</span>
        <strong>{getSellerOrderBuyerPhone(order.buyer)}</strong>
      </div>
      <div className="seller-order-handed-card__row">
        <span>{t('orders.handed.handedAt')}</span>
        <strong>{formatDateTime(order.handedToCourierAt)}</strong>
      </div>

      <div
        className={`seller-order-handed-card__courier${
          courierAccepted ? '' : ' seller-order-handed-card__courier--waiting'
        }`}
      >
        {courierAccepted ? (
          <>
            <div className="seller-order-handed-card__row">
              <span>{t('orders.handed.courier')}</span>
              <strong>{courierName || '—'}</strong>
            </div>
            <div className="seller-order-handed-card__row">
              <span>{t('orders.handed.courierPhone')}</span>
              <strong>{order.courier?.phone || '—'}</strong>
            </div>
            <div className="seller-order-handed-card__row">
              <span>{t('orders.handed.acceptedAt')}</span>
              <strong>{formatDateTime(order.acceptedAt)}</strong>
            </div>
          </>
        ) : (
          <p className="seller-order-handed-card__waiting">
            {t('orders.handed.waitingCourier')}
          </p>
        )}
      </div>
    </div>
  );
}
