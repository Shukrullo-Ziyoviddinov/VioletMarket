import React, { useState } from 'react';
import { Button } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { resolveAssetUrl } from '../../utils/mediaUrl';
import SellerProductCardMenu from '../SellerProductCardMenu/SellerProductCardMenu';
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

export default function SellerProductCard({
  product,
  onEdit,
  onDelete,
  onTogglePause,
  isMenuOpen = false,
  onMenuToggle,
  onMenuClose,
  togglingPause = false,
}) {
  const title = getProductTitle(product?.title);
  const price = String(product?.price || '').trim();
  const originalPrice = String(product?.originalPrice || '').trim();
  const showOriginalPrice = Boolean(originalPrice && originalPrice !== price);
  const resolvedSrc = getImageSrc(product);
  const [hasError, setHasError] = useState(false);
  const isPaused = product?.clientActive === false;

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
        {isPaused ? (
          <div className="seller-product-card__paused-overlay" aria-hidden="true">
            <span>Vaqtincha to&apos;xtatilgan</span>
          </div>
        ) : null}
      </div>

      <div className="seller-product-card__info">
        <h3 className="seller-product-card__title">{title}</h3>
        <div className="seller-product-card__prices">
          {price ? <span className="seller-product-card__price">{price}</span> : null}
          {showOriginalPrice ? (
            <span className="seller-product-card__original-price">{originalPrice}</span>
          ) : null}
        </div>

        <div className="seller-product-card__actions">
          <Button
            type="default"
            size="small"
            icon={<EditOutlined />}
            className="seller-product-card__edit-btn"
            onClick={handleEdit}
          >
            Tahrirlash
          </Button>

          <SellerProductCardMenu
            isOpen={isMenuOpen}
            clientActive={product?.clientActive !== false}
            togglingPause={togglingPause}
            onToggle={onMenuToggle}
            onClose={onMenuClose}
            onEdit={handleEdit}
            onDelete={() => {
              if (!product?.id || typeof onDelete !== 'function') return;
              onDelete(product.id);
            }}
            onTogglePause={() => {
              if (!product?.id || typeof onTogglePause !== 'function') return;
              onTogglePause(product);
            }}
          />
        </div>
      </div>
    </article>
  );
}
