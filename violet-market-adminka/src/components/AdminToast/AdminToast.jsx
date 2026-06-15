import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  InfoCircleFilled,
} from '@ant-design/icons';
import './AdminToast.css';

const TOAST_ICONS = {
  success: CheckCircleFilled,
  error: CloseCircleFilled,
  warning: ExclamationCircleFilled,
  info: InfoCircleFilled,
};

export default function AdminToast({ open = false, type = 'info', message = '', onClose }) {
  useEffect(() => {
    if (!open) return undefined;

    const timer = window.setTimeout(() => {
      onClose?.();
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [open, onClose]);

  if (!open || !message) return null;

  const Icon = TOAST_ICONS[type] || TOAST_ICONS.info;

  return createPortal(
    <div className="admin-toast" role="status" aria-live="polite">
      <div className={`admin-toast__card admin-toast__card--${type}`}>
        <Icon className="admin-toast__icon" aria-hidden="true" />
        <p className="admin-toast__message">{message}</p>
        <button
          type="button"
          className="admin-toast__close"
          aria-label="Yopish"
          onClick={onClose}
        >
          ×
        </button>
      </div>
    </div>,
    document.body,
  );
}
