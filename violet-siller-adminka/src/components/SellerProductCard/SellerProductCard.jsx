import React, { useState } from 'react';
import { Button } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { resolveAssetUrl } from '../../utils/mediaUrl';
import './SellerProductCard.css';

const FALLBACK_IMAGE = resolveAssetUrl('');

function getProductTitle(title) {
  if (!title) return '—';
  if (typeof title === 'string') return title.trim() || '—';
  const uz = String(title.uz || '').trim();
  const ru = String(title.ru || '').trim();
  return uz || ru || '—';
}

function getImageSrc(product) {
  if (product?.imageUrl) return product.imageUrl;
  return resolveAssetUrl(product?.image || product?.mainImage || '');
}

export default function SellerProductCard({ product, onEdit }) {
  const title = getProductTitle(product?.title);
  const price = String(product?.price || '').trim();
  const originalPrice = String(product?.originalPrice || '').trim();
  const showOriginalPrice = Boolean(originalPrice && originalPrice !== price);
  const resolvedSrc = getImageSrc(product);
  const [hasError, setHasError] = useState(false);

  const displaySrc = hasError ? FALLBACK_IMAGE : resolvedSrc;

  const handleImageError = () => {
    setHasError(true);
  };

  const handleEdit = () => {
    if (!product?.id || typeof onEdit !== 'function') return;
    onEdit(product.id);
  };

  return (
    <article className="seller-product-card">
      <div className="seller-product-card__media">
        <img
          src={displaySrc}
          alt={title}
          className="seller-product-card__image"
          loading="lazy"
          onError={handleImageError}
        />
      </div>

      <div className="seller-product-card__info">
        <h3 className="seller-product-card__title">{title}</h3>
        <div className="seller-product-card__prices">
          {price ? <span className="seller-product-card__price">{price}</span> : null}
          {showOriginalPrice ? (
            <span className="seller-product-card__original-price">{originalPrice}</span>
          ) : null}
        </div>

        <Button
          type="default"
          size="small"
          icon={<EditOutlined />}
          className="seller-product-card__edit-btn"
          onClick={handleEdit}
        >
          Tahrirlash
        </Button>
      </div>
    </article>
  );
}
