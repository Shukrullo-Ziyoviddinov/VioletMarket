import React from 'react';
import { getLocalizedText, resolveProductImageUrl } from '../../utils/productDisplay';
import './ProductApprovalCard.css';

function formatDescription(description) {
  if (!Array.isArray(description) || description.length === 0) return '';
  const first = description[0];
  if (typeof first === 'string') return first;
  return getLocalizedText(first, 'uz');
}

export default function ProductApprovalCard({ product, onOpen }) {
  if (!product) return null;

  const title = getLocalizedText(product.title, 'uz') || `Mahsulot #${product.id}`;
  const imageSrc =
    product.imageUrl || resolveProductImageUrl(product.image) || '/img/no-image.png';
  const sellerName = product.seller?.name || product.sellerId || 'Noma’lum siller';
  const sellerCountry = product.seller?.sellerCountry || product.productCountry || '—';
  const description = formatDescription(product.description);

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
          ID: {product.id}
          {product.categoryName ? ` · ${product.categoryName}` : ''}
          {product.price ? ` · ${product.price}` : ''}
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
