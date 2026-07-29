import React, { useState } from 'react';
import GlobalModal from '../../GlobalModal/GlobalModal';
import { confirmAdminCargoFeePayment } from '../../../api/adminCargoFeePaymentsApi';
import './CargoFeePaymentConfirmModal.css';

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('uz-UZ')} so‘m`;
}

export default function CargoFeePaymentConfirmModal({
  open,
  item,
  onClose,
  onConfirmed,
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!item) return null;

  const handleConfirm = async () => {
    if (!item.canConfirm || saving) return;
    setSaving(true);
    setError('');
    try {
      const result = await confirmAdminCargoFeePayment(item.id);
      onConfirmed?.(result.item);
      onClose?.();
    } catch (err) {
      setError(err?.message || 'Tasdiqlab bo‘lmadi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlobalModal
      open={open}
      title="To‘lovni tasdiqlash"
      onClose={() => {
        if (!saving) onClose?.();
      }}
    >
      <div className="cargo-fee-confirm-modal">
        <p className="cargo-fee-confirm-modal__question">
          Chindan ham to‘langanligini tasdiqlamoqchimisiz?
        </p>
        <div className="cargo-fee-confirm-modal__meta">
          <strong>{item.productTitle}</strong>
          <span>
            {item.weightKg} kg · {formatMoney(item.cargoDeliveryFee)}
          </span>
          <span>
            Mijoz: {item.customerPaidAt ? 'to‘lagan' : 'to‘lamagan'}
            {item.customerPaymentMethod
              ? ` (${item.customerPaymentMethod})`
              : ''}
          </span>
        </div>
        {error ? <p className="cargo-fee-confirm-modal__error">{error}</p> : null}
        <div className="cargo-fee-confirm-modal__actions">
          <button
            type="button"
            className="cargo-fee-confirm-modal__btn cargo-fee-confirm-modal__btn--ghost"
            disabled={saving}
            onClick={onClose}
          >
            Yo‘q
          </button>
          <button
            type="button"
            className="cargo-fee-confirm-modal__btn cargo-fee-confirm-modal__btn--primary"
            disabled={saving || !item.canConfirm}
            onClick={handleConfirm}
          >
            {saving ? 'Tasdiqlanmoqda...' : 'Ha'}
          </button>
        </div>
        {!item.canConfirm && item.paymentStatus !== 'paid' ? (
          <p className="cargo-fee-confirm-modal__hint">
            Avval mijoz to‘lashi kerak.
          </p>
        ) : null}
        {item.paymentStatus === 'paid' ? (
          <p className="cargo-fee-confirm-modal__hint">
            Allaqachon tasdiqlangan — logistica To‘landi bosishi mumkin.
          </p>
        ) : null}
      </div>
    </GlobalModal>
  );
}
