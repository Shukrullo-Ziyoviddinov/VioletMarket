import React from 'react';
import { RightOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  getSellerOrderBuyerName,
  getSellerOrderBuyerPhone,
} from '../../../utils/sellerOrdersDisplay';
import './SellerOrderCourierCard.css';

export default function SellerOrderCourierCard({ order, onOpen }) {
  const { t } = useTranslation();
  const items = Array.isArray(order?.items) ? order.items : [];
  const isGroup = items.length > 1 || Boolean(order?.isGroup);
  const productCodes = Array.isArray(order?.productCodes)
    ? order.productCodes.filter(Boolean)
    : String(order?.productCode || '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);

  return (
    <button
      type="button"
      className="seller-order-courier-card"
      onClick={() => onOpen?.(order)}
    >
      <div className="seller-order-courier-card__row">
        <span>{t('orders.card.orderCode', { defaultValue: 'Buyurtma' })}</span>
        <strong>{order.orderCode || '—'}</strong>
      </div>

      <div className="seller-order-courier-card__row">
        <span>
          {isGroup
            ? t('orders.card.barcodes', { defaultValue: 'Shtrix kodlar' })
            : t('orders.card.barcode')}
        </span>
        {isGroup && productCodes.length > 1 ? (
          <ul className="seller-order-courier-card__codes">
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
        <div className="seller-order-courier-card__row">
          <span>{t('orders.card.products', { defaultValue: 'Mahsulotlar' })}</span>
          <strong>
            {t('orders.card.productCount', {
              count: order.productCount || items.length || productCodes.length || 1,
              defaultValue: '{{count}} ta mahsulot',
            })}
          </strong>
        </div>
      ) : null}

      <div className="seller-order-courier-card__row">
        <span>{t('orders.card.buyer')}</span>
        <strong>{getSellerOrderBuyerName(order.buyer)}</strong>
      </div>
      <div className="seller-order-courier-card__row">
        <span>{t('orders.card.phone')}</span>
        <strong>{getSellerOrderBuyerPhone(order.buyer)}</strong>
      </div>
      <RightOutlined className="seller-order-courier-card__chevron" />
    </button>
  );
}
