import React from 'react';
import { resolveProductImageUrl } from '../../../utils/productDisplay';
import { getAdminOrderProductTitle } from '../../../utils/adminOrdersDisplay';
import './AdminOrderProductMeta.css';

export default function AdminOrderProductMeta({ order, compact = false }) {
  const isGroup = Boolean(order?.isGroup) || (Array.isArray(order?.items) && order.items.length > 1);
  const title = isGroup
    ? `${order.productCount || order.items?.length || 1} ta mahsulot`
    : getAdminOrderProductTitle(order);
  const imageUrl = resolveProductImageUrl(order?.imageUrl);
  const codeLabel = isGroup
    ? (Array.isArray(order?.productCodes) && order.productCodes.length
        ? order.productCodes.join(', ')
        : order?.productCode || '—')
    : order?.productCode || '—';

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
        <span title={codeLabel}>{codeLabel}</span>
      </div>
    </div>
  );
}
