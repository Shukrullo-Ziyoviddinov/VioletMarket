import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatPrice, getLocalizedText, normalizeImagePath } from '../../../utils/utils';
import UserOrderTrackingTimeline from '../UserOrderTrackingTimeline/UserOrderTrackingTimeline';
import UserCargoFeePaymentModal from '../UserCargoFeePaymentModal/UserCargoFeePaymentModal';
import './UserOrderTrackingCard.css';

function buildVariantText(product, t) {
  return [
    product.color ? `${t('orderHistory.color')}: ${product.color}` : '',
    product.size ? `${t('orderHistory.size')}: ${product.size}` : '',
    product.storage ? `${t('orderHistory.storage')}: ${product.storage}` : '',
    product.model ? `${t('orderHistory.model')}: ${product.model}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

function resolveProductLines(order) {
  if (Array.isArray(order?.products) && order.products.length) {
    return order.products;
  }
  return [
    {
      id: order.id,
      title: order.title,
      imageUrl: order.imageUrl,
      quantity: order.quantity,
      lineTotal: order.lineTotal || order.price,
      color: order.color,
      size: order.size,
      storage: order.storage,
      model: order.model,
    },
  ];
}

function ProductRow({ product, t, lang }) {
  const title =
    getLocalizedText(product.title, lang) || t('orderHistory.productFallback');
  const variantText = buildVariantText(product, t);

  return (
    <div className="user-order-tracking-card__product">
      <img
        className="user-order-tracking-card__image"
        src={normalizeImagePath(product.imageUrl)}
        alt={title}
      />
      <div className="user-order-tracking-card__info">
        <h2>{title}</h2>
        {variantText ? <p>{variantText}</p> : null}
        <span>{t('orderHistory.quantity', { count: product.quantity })}</span>
        <strong className="user-order-tracking-card__price">
          {formatPrice(product.lineTotal || product.price)}
        </strong>
      </div>
    </div>
  );
}

export default function UserOrderTrackingCard({ order, onCargoFeePaid }) {
  const { t, i18n } = useTranslation();
  const [feeModalOpen, setFeeModalOpen] = useState(false);
  const lang = i18n.language || 'uz';
  const products = resolveProductLines(order);
  const showCargoFeeButton = Boolean(order?.cargoFeePayment?.ready);
  const sellerName = getLocalizedText(order?.seller?.name, lang);

  return (
    <article className="user-order-tracking-card">
      <header className="user-order-tracking-card__header">
        <div className="user-order-tracking-card__header-main">
          <span>{t('orderHistory.orderNumber')}</span>
          <strong>{order.orderCode}</strong>
          {sellerName ? (
            <span className="user-order-tracking-card__seller">{sellerName}</span>
          ) : null}
        </div>
        {showCargoFeeButton ? (
          <button
            type="button"
            className="user-order-tracking-card__fee-btn"
            onClick={() => setFeeModalOpen(true)}
          >
            {t('orderHistory.cargoFee.openButton')}
          </button>
        ) : null}
      </header>

      <div
        className={
          products.length > 1
            ? 'user-order-tracking-card__products user-order-tracking-card__products--stacked'
            : 'user-order-tracking-card__products'
        }
      >
        {products.map((product) => (
          <ProductRow key={product.id} product={product} t={t} lang={lang} />
        ))}
      </div>

      {products.length > 1 ? (
        <div className="user-order-tracking-card__total">
          <span>{t('orderHistory.groupTotal')}</span>
          <strong>{formatPrice(order.lineTotal)}</strong>
        </div>
      ) : null}

      <div className="user-order-tracking-card__tracking">
        <UserOrderTrackingTimeline
          steps={order.steps}
          sellerCountry={order.seller?.country || ''}
        />
      </div>

      <UserCargoFeePaymentModal
        open={feeModalOpen}
        order={order}
        onClose={() => setFeeModalOpen(false)}
        onPaid={(result) => {
          onCargoFeePaid?.(order.id, result);
          setFeeModalOpen(false);
        }}
      />
    </article>
  );
}
