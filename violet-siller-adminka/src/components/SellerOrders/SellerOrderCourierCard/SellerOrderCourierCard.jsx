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

  return (
    <button
      type="button"
      className="seller-order-courier-card"
      onClick={() => onOpen?.(order)}
    >
      <div className="seller-order-courier-card__row">
        <span>{t('orders.card.barcode')}</span>
        <strong>{order.productCode || '—'}</strong>
      </div>
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
