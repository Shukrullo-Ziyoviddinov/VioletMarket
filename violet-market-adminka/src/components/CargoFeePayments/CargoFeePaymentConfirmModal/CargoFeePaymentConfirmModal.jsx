import React, { useMemo, useState } from 'react';
import GlobalModal from '../../GlobalModal/GlobalModal';
import { confirmAdminCargoFeePayment } from '../../../api/adminCargoFeePaymentsApi';
import './CargoFeePaymentConfirmModal.css';

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('uz-UZ')} so‘m`;
}

function formatWeight(value) {
  const n = Number(value) || 0;
  if (!(n > 0)) return '—';
  return `${Number(n.toFixed(3))} kg`;
}

function uniqueJoin(values) {
  return [
    ...new Set(
      values
        .map((v) => String(v || '').trim())
        .filter(Boolean),
    ),
  ].join(', ');
}

function buildVariantSummary(lines = []) {
  const sizes = uniqueJoin(lines.map((l) => l.size));
  const colors = uniqueJoin(lines.map((l) => l.color));
  const storages = uniqueJoin(lines.map((l) => l.storage));
  const models = uniqueJoin(lines.map((l) => l.model));
  const parts = [];
  if (sizes) parts.push(`Size: ${sizes}`);
  if (colors) parts.push(`Color: ${colors}`);
  if (storages) parts.push(`Memory: ${storages}`);
  if (models) parts.push(`Model: ${models}`);
  return parts;
}

function groupProductsForDisplay(products = []) {
  const map = new Map();
  products.forEach((product, index) => {
    const key =
      product.productId > 0
        ? `id:${product.productId}`
        : `title:${String(product.title || '').trim().toLowerCase() || index}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        title: product.title || 'Mahsulot',
        lines: [],
      });
    }
    map.get(key).lines.push(product);
  });
  return [...map.values()];
}

export default function CargoFeePaymentConfirmModal({
  open,
  item,
  onClose,
  onConfirmed,
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const productGroups = useMemo(() => {
    if (!item) return [];
    const list = Array.isArray(item.products) ? item.products : [];
    if (list.length > 0) return groupProductsForDisplay(list);
    return [
      {
        key: 'fallback',
        title: item.productTitle || 'Mahsulot',
        lines: [
          {
            id: 'fallback',
            weightKg: item.weightKg,
            quantity: Math.max(1, Number(item.productCount) || 1),
            size: '',
            color: '',
            storage: '',
            model: '',
          },
        ],
      },
    ];
  }, [item]);

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
          <div className="cargo-fee-confirm-modal__products">
            {productGroups.map((group) => {
              const variants = buildVariantSummary(group.lines);
              return (
                <div key={group.key} className="cargo-fee-confirm-modal__product">
                  <strong>{group.title}</strong>
                  {variants.length > 0 ? (
                    <span className="cargo-fee-confirm-modal__variants">
                      {variants.join(' · ')}
                    </span>
                  ) : null}
                  <ul className="cargo-fee-confirm-modal__weights">
                    {group.lines.map((line) => {
                      const lineVariant = [
                        line.size ? `Size ${line.size}` : '',
                        line.color ? `Color ${line.color}` : '',
                        line.storage ? `Memory ${line.storage}` : '',
                        line.model ? `Model ${line.model}` : '',
                      ]
                        .filter(Boolean)
                        .join(' · ');
                      return (
                        <li key={line.id}>
                          <span>
                            {lineVariant ||
                              (line.quantity > 1
                                ? `×${line.quantity}`
                                : 'Og‘irlik')}
                          </span>
                          <span>{formatWeight(line.weightKg)}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="cargo-fee-confirm-modal__totals">
            <span>
              Jami og‘irlik: <b>{formatWeight(item.weightKg)}</b>
            </span>
            <span>
              To‘lov summai: <b>{formatMoney(item.cargoDeliveryFee)}</b>
            </span>
          </div>

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
