import React from 'react';
import { RightOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { resolveAssetUrl } from '../../../utils/mediaUrl';
import {
  formatSellerOrderAmount,
  getSellerOrderProductTitle,
} from '../../../utils/sellerOrdersDisplay';
import { resolveSellerCargoPackages } from '../../../utils/sellerOrderGroups';
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
  const items = Array.isArray(order?.items) ? order.items : [];
  const isGroup = items.length > 1 || Boolean(order?.isGroup);
  const productCodes = Array.isArray(order?.productCodes)
    ? order.productCodes.filter(Boolean)
    : String(order?.productCode || '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
  const title = isGroup
    ? t('orders.card.productCount', {
        count: order.productCount || items.length || productCodes.length || 1,
        defaultValue: '{{count}} ta mahsulot',
      })
    : getSellerOrderProductTitle(order, i18n.language);
  const codeLabel =
    isGroup && productCodes.length
      ? productCodes.join(', ')
      : order.productCode || '—';
  const cargoPackages = resolveSellerCargoPackages(order);
  const variants = isGroup ? '' : buildVariantText(order, t);
  const imageUrl = resolveAssetUrl(
    isGroup ? items[0]?.imageUrl || order.imageUrl : order.imageUrl,
  );

  return (
    <button
      type="button"
      className="seller-order-collection-card"
      onClick={() => onOpen?.(order)}
    >
      <img
        className="seller-order-collection-card__image"
        src={imageUrl}
        alt={title}
      />

      <div className="seller-order-collection-card__content">
        <strong title={title}>{title}</strong>
        {cargoPackages ? (
          cargoPackages.map((pkg) => (
            <span
              key={pkg.type}
              className={`seller-order-collection-card__pkg seller-order-collection-card__pkg--${pkg.type}`}
            >
              {pkg.type === 'express'
                ? t('orders.cargoPackage.express', {
                    defaultValue: 'Express paket',
                  })
                : t('orders.cargoPackage.standard', {
                    defaultValue: 'Standard paket',
                  })}
              {' · '}
              {pkg.packageCode}
              {' · '}
              {t('orders.card.productCount', {
                count: pkg.productCount,
                defaultValue: '{{count}} ta mahsulot',
              })}
            </span>
          ))
        ) : (
          <span title={codeLabel}>{codeLabel}</span>
        )}
        {variants ? <p title={variants}>{variants}</p> : null}
      </div>

      <div className="seller-order-collection-card__amount">
        {formatSellerOrderAmount(order.amount)}
      </div>

      <RightOutlined className="seller-order-collection-card__chevron" />
    </button>
  );
}
