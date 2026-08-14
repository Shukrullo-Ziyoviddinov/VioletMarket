import React from 'react';
import { resolveProductImageUrl } from '../../utils/productDisplay';
import './ProductApprovalCard.css';

/** Har doim string qaytaradi — React #31 ({uz,ru} child) oldini oladi. */
function toDisplayText(value, fallback = '') {
  if (value == null || value === '') return fallback;
  if (typeof value === 'string' || typeof value === 'number') {
    const text = String(value).trim();
    return text || fallback;
  }
  if (typeof value === 'object') {
    const uz = value.uz;
    const ru = value.ru;
    if (typeof uz === 'string' && uz.trim()) return uz.trim();
    if (typeof ru === 'string' && ru.trim()) return ru.trim();
    for (const entry of Object.values(value)) {
      if (typeof entry === 'string' && entry.trim()) return entry.trim();
    }
  }
  return fallback;
}

function formatDescription(description) {
  if (!description) return '';
  if (typeof description === 'string') return description.trim();
  if (Array.isArray(description)) {
    if (description.length === 0) return '';
    return toDisplayText(description[0]);
  }
  return toDisplayText(description);
}

export default function ProductApprovalCard({ product, onOpen }) {
  if (!product) return null;

  const title =
    toDisplayText(product.titleText) ||
    toDisplayText(product.title, `Mahsulot #${product.id}`);
  const imageSrc =
    product.imageUrl || resolveProductImageUrl(product.image) || '/img/no-image.png';
  const sellerName =
    toDisplayText(product.seller?.name) || product.sellerId || 'Noma’lum siller';
  const sellerCountry = toDisplayText(
    product.seller?.sellerCountry || product.productCountry,
    '—',
  );
  const description =
    toDisplayText(product.descriptionText) || formatDescription(product.description);
  const categoryName = toDisplayText(product.categoryName);
  const price = toDisplayText(product.price);

  return (
    <button
      type="button"
      className="product-approval-card"
      onClick={() => onOpen?.(product)}
    >
      <div className="product-approval-card__media">
        <img
          src={imageSrc}
          alt={title}
          onError={(e) => {
            e.currentTarget.src = '/img/no-image.png';
          }}
        />
      </div>
      <div className="product-approval-card__body">
        <div className="product-approval-card__top">
          <h3 className="product-approval-card__title" title={title}>
            {title}
          </h3>
          <span className="product-approval-card__badge">Kutilmoqda</span>
        </div>
        <p className="product-approval-card__meta">
          Siller: {sellerName} · {sellerCountry}
        </p>
        <p className="product-approval-card__meta">
          ID: {String(product.id ?? '')}
          {categoryName ? ` · ${categoryName}` : ''}
          {price ? ` · ${price}` : ''}
        </p>
        {description ? (
          <p className="product-approval-card__desc" title={description}>
            {description}
          </p>
        ) : null}
      </div>
    </button>
  );
}
