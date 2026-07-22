import React from 'react';
import {
  getCourierAssignmentStatusLabel,
  getCourierAssignmentStatusTone,
} from '../../utils/courierAssignmentStatus';
import './CourierAcceptedOrderStatusBadge.css';

export default function CourierAcceptedOrderStatusBadge({ status }) {
  const tone = getCourierAssignmentStatusTone(status);
  return (
    <span
      className={`courier-accepted-order-status-badge courier-accepted-order-status-badge--${tone}`}
    >
      {getCourierAssignmentStatusLabel(status)}
    </span>
  );
}
