import React from 'react';
import GlobalModal from '../../GlobalModal/GlobalModal';
import { getAdminOrderSellerName } from '../../../utils/adminOrdersDisplay';
import './AdminOrderHandoffModal.css';

export default function AdminOrderHandoffModal({
  open,
  order,
  loading = false,
  cancelling = false,
  onClose,
  onConfirm,
  onCancelOrder,
}) {
  const sellerName = getAdminOrderSellerName(order);
  const productCode = order?.productCode || '—';
  const busy = loading || cancelling;

  return (
    <GlobalModal
      open={open}
      title="Kuryerga topshirish"
      onClose={() => {
        if (!busy) onClose?.();
      }}
    >
      <div className="admin-order-handoff-modal">
        <p className="admin-order-handoff-modal__text">
          <strong>{sellerName}</strong> sillerining <strong>{productCode}</strong> mahsulotini
          kuryerga topshirasizmi?
        </p>
        <div className="admin-order-handoff-modal__actions">
          {onCancelOrder ? (
            <button
              type="button"
              className="admin-order-handoff-modal__cancel-order"
              disabled={busy}
              onClick={onCancelOrder}
            >
              {cancelling ? 'Bekor qilinmoqda...' : 'Buyurtmani bekor qilish'}
            </button>
          ) : (
            <span />
          )}
          <div className="admin-order-handoff-modal__actions-right">
            <button
              type="button"
              className="admin-order-handoff-modal__cancel"
              disabled={busy}
              onClick={onClose}
            >
              Yopish
            </button>
            <button
              type="button"
              className="admin-order-handoff-modal__confirm"
              disabled={busy}
              onClick={onConfirm}
            >
              {loading ? 'Topshirilmoqda...' : 'Ha, topshirish'}
            </button>
          </div>
        </div>
      </div>
    </GlobalModal>
  );
}
