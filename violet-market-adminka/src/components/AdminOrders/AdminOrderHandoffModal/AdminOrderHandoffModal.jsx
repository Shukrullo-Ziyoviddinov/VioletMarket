import React, { useEffect, useState } from 'react';
import GlobalModal from '../../GlobalModal/GlobalModal';
import { getAdminOrderSellerName } from '../../../utils/adminOrdersDisplay';
import './AdminOrderHandoffModal.css';

function parseCoordsInput(value) {
  const parts = String(value || '')
    .split(/[,;\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) return null;
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
}

export default function AdminOrderHandoffModal({
  open,
  order,
  loading = false,
  cancelling = false,
  allowHandoff = true,
  requireWarehousePickup = false,
  onClose,
  onConfirm,
  onCancelOrder,
}) {
  const sellerName = getAdminOrderSellerName(order);
  const items = Array.isArray(order?.items) ? order.items : [];
  const isGroup = Boolean(order?.isGroup) || items.length > 1;
  const productCode = isGroup
    ? `${order?.productCount || items.length || 1} ta mahsulot`
    : order?.productCode || '—';
  const country = String(order?.seller?.sellerCountry || '').trim().toUpperCase();
  const busy = loading || cancelling;

  const [address, setAddress] = useState('');
  const [coordsText, setCoordsText] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!open) return;
    setAddress('');
    setCoordsText('');
    setPhone('');
    setFormError('');
  }, [open, order?.id, order?.groupKey]);

  const handleConfirm = () => {
    if (!allowHandoff || busy) return;

    if (!requireWarehousePickup) {
      onConfirm?.(null);
      return;
    }

    const trimmed = address.trim();
    if (!trimmed) {
      setFormError('Ombor manzilini kiriting');
      return;
    }
    const coordinates = coordsText.trim() ? parseCoordsInput(coordsText) : null;
    if (coordsText.trim() && !coordinates) {
      setFormError('Koordinata formati: lat, lng (masalan: 41.31, 69.24)');
      return;
    }
    setFormError('');
    onConfirm?.({
      address: trimmed,
      coordinates: coordinates || undefined,
      phone: phone.trim() || undefined,
      label: 'Toshkent ombori',
    });
  };

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
          <>
            <p className="admin-order-handoff-modal__text">
              <strong>{sellerName}</strong>
              {country ? ` (${country})` : ''} sillerining{' '}
              <strong>{productCode}</strong>
              {isGroup ? 'ini' : ' mahsulotini'} UZB kuryerga topshirasizmi?
            </p>
            {requireWarehousePickup ? (
              <>
                <p className="admin-order-handoff-modal__hint">
                  Kuryer xorij silleriga emas — shu yerga kiritilgan ombor
                  manziliga boradi.
                </p>
                <label className="admin-order-handoff-modal__field">
                  <span>Ombor manzili *</span>
                  <textarea
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="Masalan: Toshkent, Chilonzor, …"
                    rows={3}
                    disabled={busy}
                  />
                </label>
                <label className="admin-order-handoff-modal__field">
                  <span>Koordinata (ixtiyoriy)</span>
                  <input
                    type="text"
                    value={coordsText}
                    onChange={(event) => setCoordsText(event.target.value)}
                    placeholder="41.3111, 69.2797"
                    disabled={busy}
                  />
                </label>
                <label className="admin-order-handoff-modal__field">
                  <span>Ombor telefoni (ixtiyoriy)</span>
                  <input
                    type="text"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+998 …"
                    disabled={busy}
                  />
                </label>
                {formError ? (
                  <p className="admin-order-handoff-modal__error">{formError}</p>
                ) : null}
              </>
            ) : null}
          </>
        ) : (
          <p className="admin-order-handoff-modal__text">
            <strong>{sellerName}</strong>
            {country ? ` (${country})` : ''} · <strong>{productCode}</strong>
            <br />
            Xorij mahsulotini UZB kuryerga topshirish hozircha yopiq.
          </p>
        )}
        <div className="admin-order-handoff-modal__actions">
          {allowHandoff && onCancelOrder && !isGroup ? (
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
                onClick={handleConfirm}
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
