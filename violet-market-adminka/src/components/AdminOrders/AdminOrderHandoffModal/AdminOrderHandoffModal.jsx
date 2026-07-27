import React from 'react';
import GlobalModal from '../../GlobalModal/GlobalModal';
import { getAdminOrderSellerName } from '../../../utils/adminOrdersDisplay';
import './AdminOrderHandoffModal.css';

export default function AdminOrderHandoffModal({
  open,
  order,
  loading = false,
  cancelling = false,
  allowHandoff = true,
  onClose,
  onConfirm,
  onCancelOrder,
}) {
  const sellerName = getAdminOrderSellerName(order);
  const productCode = order?.productCode || '—';
  const country = String(order?.seller?.sellerCountry || '').trim().toUpperCase();
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
        {allowHandoff ? (
          <p className="admin-order-handoff-modal__text">
            <strong>{sellerName}</strong>
            {country ? ` (${country})` : ''} sillerining{' '}
            <strong>{productCode}</strong> mahsulotini kuryerga topshirasizmi?
          </p>
        ) : (
          <p className="admin-order-handoff-modal__text">
            <strong>{sellerName}</strong>
            {country ? ` (${country})` : ''} · <strong>{productCode}</strong>
            <br />
            Xorij mahsulotini UZB kuryerga topshirish hozircha yopiq. Cargo logistica
            orqali UZB omborga kelgach ochiladi.
          </p>
        )}
        <div className="admin-order-handoff-modal__actions">
          {allowHandoff && onCancelOrder ? (
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
            {allowHandoff ? (
              <button
                type="button"
                className="admin-order-handoff-modal__confirm"
                disabled={busy}
                onClick={onConfirm}
              >
                {loading ? 'Topshirilmoqda...' : 'Ha, topshirish'}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </GlobalModal>
  );
}
