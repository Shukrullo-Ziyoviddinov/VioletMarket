import React from 'react';
import { resolveAssetUrl } from '../../utils/mediaUrl';
import './SellerProductCard.css';

function getProductTitle(title) {
  if (!title) return '—';
  if (typeof title === 'string') return title.trim() || '—';
  const uz = String(title.uz || '').trim();
  const ru = String(title.ru || '').trim();
  return uz || ru || '—';
}

export default function SellerProductCard({ product }) {
  const imageSrc = resolveAssetUrl(product?.image);
  const title = getProductTitle(product?.title);
  const price = String(product?.price || '').trim();
  const originalPrice = String(product?.originalPrice || '').trim();
  const showOriginalPrice = Boolean(originalPrice && originalPrice !== price);

  return (
    <article className="seller-product-card">
      <div className="seller-product-card__media">
        <img src={imageSrc} alt={title} className="seller-product-card__image" loading="lazy" />
      </div>

      <div className="seller-product-card__info">
        <h3 className="seller-product-card__title">{title}</h3>
        <div className="seller-product-card__prices">
          {price ? <span className="seller-product-card__price">{price}</span> : null}
          {showOriginalPrice ? (
            <span className="seller-product-card__original-price">{originalPrice}</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
