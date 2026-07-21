import React from 'react';
import { resolveProductImageUrl } from '../../../utils/productDisplay';
import { getAdminOrderSellerName } from '../../../utils/adminOrdersDisplay';
import './AdminOrderSellerBadge.css';

export default function AdminOrderSellerBadge({ order, className = '' }) {
  const name = getAdminOrderSellerName(order);
  const logo = resolveProductImageUrl(order?.seller?.logo);

  return (
    <div className={`admin-order-seller-badge ${className}`.trim()}>
      <img
        className="admin-order-seller-badge__logo"
        src={logo}
        alt={name}
        onError={(event) => {
          event.currentTarget.src = resolveProductImageUrl('');
        }}
      />
      <div className="admin-order-seller-badge__text">
        <span className="admin-order-seller-badge__label">Siller</span>
        <strong className="admin-order-seller-badge__name" title={name}>
          {name}
        </strong>
      </div>
    </div>
  );
}
