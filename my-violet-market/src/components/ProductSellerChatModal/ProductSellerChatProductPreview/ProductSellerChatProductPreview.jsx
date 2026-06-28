import React from 'react';
import { normalizeImagePath } from '../../../utils/utils';
import './ProductSellerChatProductPreview.css';

export default function ProductSellerChatProductPreview({
  product,
  compact = false,
}) {
  if (!product) return null;

  const title = String(product.title || '').trim() || 'Mahsulot';
  const imageSrc = normalizeImagePath(product.image || '/img/no-image.png');
  const price = String(product.price || '').trim();
  const originalPrice = String(product.originalPrice || '').trim();
  const showOriginalPrice = Boolean(originalPrice && originalPrice !== price);

  return (
    <div
      className={`product-seller-chat-product-preview${
        compact ? ' product-seller-chat-product-preview--compact' : ''
      }`}
    >
      <div className="product-seller-chat-product-preview__media">
        <img
          src={imageSrc}
          alt={title}
          className="product-seller-chat-product-preview__image"
          onError={(event) => {
            event.currentTarget.src = normalizeImagePath('/img/no-image.png');
          }}
        />
      </div>

      <div className="product-seller-chat-product-preview__info">
        <p className="product-seller-chat-product-preview__title">{title}</p>
        <div className="product-seller-chat-product-preview__prices">
          {price ? <span className="product-seller-chat-product-preview__price">{price}</span> : null}
          {showOriginalPrice ? (
            <span className="product-seller-chat-product-preview__original-price">{originalPrice}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
