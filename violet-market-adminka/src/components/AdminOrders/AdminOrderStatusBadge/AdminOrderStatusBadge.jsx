import React from 'react';
import {
  getAdminOrderStatusLabel,
  getAdminOrderStatusTone,
} from '../../../utils/adminOrdersDisplay';
import './AdminOrderStatusBadge.css';

export default function AdminOrderStatusBadge({ trackingStatus }) {
  const tone = getAdminOrderStatusTone(trackingStatus);
  return (
    <span className={`admin-order-status-badge admin-order-status-badge--${tone}`}>
      {getAdminOrderStatusLabel(trackingStatus)}
    </span>
  );
}
