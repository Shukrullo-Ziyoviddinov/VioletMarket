import React from 'react';
import { resolveProductImageUrl } from '../../../utils/productDisplay';
import { getAdminOrderProductTitle } from '../../../utils/adminOrdersDisplay';
import './AdminOrderProductMeta.css';

export default function AdminOrderProductMeta({ order, compact = false }) {
  const title = getAdminOrderProductTitle(order);
  const imageUrl = resolveProductImageUrl(order?.imageUrl);

  return (
    <div className={`admin-order-product-meta${compact ? ' admin-order-product-meta--compact' : ''}`}>
      <img
        className="admin-order-product-meta__image"
        src={imageUrl}
        alt={title}
        onError={(event) => {
          event.currentTarget.src = resolveProductImageUrl('');
        }}
      />
      <div className="admin-order-product-meta__text">
        <strong title={title}>{title}</strong>
        <span>{order?.productCode || '—'}</span>
      </div>
    </div>
  );
}
