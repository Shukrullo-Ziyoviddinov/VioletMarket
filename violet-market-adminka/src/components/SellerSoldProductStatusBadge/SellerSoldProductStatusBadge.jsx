import React from 'react';
import './SellerSoldProductStatusBadge.css';

export default function SellerSoldProductStatusBadge({ statusKey = 'active', label = 'Aktiv' }) {
  return (
    <span className={`seller-sold-product-status-badge seller-sold-product-status-badge--${statusKey}`}>
      {label}
    </span>
  );
}
