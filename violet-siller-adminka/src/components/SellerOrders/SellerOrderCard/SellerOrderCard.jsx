import React from 'react';
import { RightOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  formatSellerOrderAmount,
  formatSellerOrderDateTime,
  getSellerOrderBuyerName,
  getSellerOrderBuyerPhone,
  getSellerOrderPaymentLabel,
  getSellerOrderPaymentTone,
} from '../../../utils/sellerOrdersDisplay';
import './SellerOrderCard.css';

export default function SellerOrderCard({ order, onOpen }) {
  const { t } = useTranslation();

  if (!order) return null;

  const paymentTone = getSellerOrderPaymentTone(order.paymentMethod);
  const items = Array.isArray(order?.items) ? order.items : [];
  const isGroup = items.length > 1 || Boolean(order?.isGroup);
  const productCodes = Array.isArray(order?.productCodes)
    ? order.productCodes.filter(Boolean)
    : String(order?.productCode || '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
  const productCode =
    isGroup && productCodes.length > 1
      ? productCodes.join(', ')
      : productCodes[0] || String(order.productCode || '').trim() || '—';

  return (
    <button
      type="button"
      className="seller-order-card"
      onClick={() => onOpen?.(order)}
    >
      <div className="seller-order-card__fields">
        <div className="seller-order-card__field">
          <span className="seller-order-card__label">
            {isGroup
              ? t('orders.card.barcodes', { defaultValue: 'Shtrix kodlar' })
              : t('orders.card.barcode')}
          </span>
          <strong className="seller-order-card__value" title={productCode}>
            {productCode}
          </strong>
        </div>

        {isGroup ? (
          <div className="seller-order-card__field">
            <span className="seller-order-card__label">
              {t('orders.card.products', { defaultValue: 'Mahsulotlar' })}
            </span>
            <strong className="seller-order-card__value">
              {t('orders.card.productCount', {
                count: order.productCount || items.length || productCodes.length || 1,
                defaultValue: '{{count}} ta mahsulot',
              })}
            </strong>
          </div>
        ) : null}

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
          <span className="seller-order-card__label">{t('orders.card.phone')}</span>
          <strong className="seller-order-card__value seller-order-card__value--phone">
            {getSellerOrderBuyerPhone(order.buyer)}
          </strong>
        </div>

        <div className="seller-order-card__field">
          <span className="seller-order-card__label">{t('orders.card.payment')}</span>
          <span className={`seller-order-card__payment seller-order-card__payment--${paymentTone}`}>
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

      <span className="seller-order-card__chevron" aria-hidden="true">
        <RightOutlined />
      </span>
    </button>
  );
}
