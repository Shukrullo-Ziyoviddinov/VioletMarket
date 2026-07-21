import React from 'react';
import GlobalModal from '../../GlobalModal/GlobalModal';
import { getAdminOrderSellerName } from '../../../utils/adminOrdersDisplay';
import './AdminOrderHandoffModal.css';

export default function AdminOrderHandoffModal({
  open,
  order,
  loading = false,
  onClose,
  onConfirm,
}) {
  const sellerName = getAdminOrderSellerName(order);
  const productCode = order?.productCode || '—';

  return (
    <GlobalModal
      open={open}
      title="Kuryerga topshirish"
      onClose={() => {
        if (!loading) onClose?.();
      }}
    >
      <div className="admin-order-handoff-modal">
        <p className="admin-order-handoff-modal__text">
          <strong>{sellerName}</strong> sillerining <strong>{productCode}</strong> mahsulotini
          kuryerga topshirasizmi?
        </p>
        <div className="admin-order-handoff-modal__actions">
          <button
            type="button"
            className="admin-order-handoff-modal__cancel"
            disabled={loading}
            onClick={onClose}
          >
            Bekor qilish
          </button>
          <button
            type="button"
            className="admin-order-handoff-modal__confirm"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? 'Topshirilmoqda...' : 'Ha, topshirish'}
          </button>
        </div>
      </div>
    </GlobalModal>
  );
}
