import React from 'react';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { PAYMENT_REQUEST_STATUS_LABELS } from '../../../utils/paymentRequestDisplay';
import './PaymentRequestStatusBadge.css';

const STATUS_ICONS = {
  in_process: ClockCircleOutlined,
  withdrawn: CheckCircleOutlined,
  rejected: CloseCircleOutlined,
};

export default function PaymentRequestStatusBadge({ status, withIcon = false }) {
  const Icon = STATUS_ICONS[status];
  const label = PAYMENT_REQUEST_STATUS_LABELS[status] || status;

  return (
    <span className={`payment-request-status-badge payment-request-status-badge--${status}`}>
      {withIcon && Icon ? <Icon /> : null}
      {label}
    </span>
  );
}
