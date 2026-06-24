import React from 'react';
import './SellerStatusBadge.css';

export default function SellerStatusBadge({ status = 'active' }) {
  const isPaused = status === 'paused';

  return (
    <span
      className={`seller-status-badge ${
        isPaused ? 'seller-status-badge--paused' : 'seller-status-badge--active'
      }`}
    >
      {isPaused ? 'Pauza' : 'Aktiv'}
    </span>
  );
}
