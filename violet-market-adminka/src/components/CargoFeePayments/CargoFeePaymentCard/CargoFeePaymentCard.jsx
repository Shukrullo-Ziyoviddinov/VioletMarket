import React from 'react';
import {
  formatCargoServiceTypeLabel,
  isKnownCargoServiceType,
} from '../../../utils/cargoServiceRules';
import './CargoFeePaymentCard.css';

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('uz-UZ')} so‘m`;
}

export default function CargoFeePaymentCard({ item, onOpen }) {
  const paid = item.paymentStatus === 'paid';

  return (
    <button
      type="button"
      className="cargo-fee-payment-card"
      onClick={() => onOpen?.(item)}
    >
      <img
        className="cargo-fee-payment-card__image"
        src={item.productImage || '/img/no-image.png'}
        alt=""
      />
      <div className="cargo-fee-payment-card__body">
        <div className="cargo-fee-payment-card__top">
          <strong>{item.productTitle}</strong>
          <span
            className={`cargo-fee-payment-card__badge cargo-fee-payment-card__badge--${
              paid ? 'paid' : 'unpaid'
            }`}
          >
            {paid ? 'To‘langan' : 'To‘lanmagan'}
          </span>
        </div>
        <p>
          {item.requestCode} · {item.sellerName}
          {isKnownCargoServiceType(item.cargoServiceType)
            ? ` · ${formatCargoServiceTypeLabel(item.cargoServiceType)}`
            : ''}
        </p>
        <p>
          Og‘irlik: {item.weightKg} kg · Summa: {formatMoney(item.cargoDeliveryFee)}
        </p>
        <p>Logistica: {item.logisticaCompanyName}</p>
        {isKnownCargoServiceType(item.cargoServiceType) ? (
          <p className="cargo-fee-payment-card__lane">
            Yetkazish to‘lovi faqat shu tarif — Standard va Express alohida.
          </p>
        ) : null}
        {item.customerPaidAt ? (
          <p className="cargo-fee-payment-card__hint">
            Mijoz to‘ladi ({item.customerPaymentMethod || '—'})
          </p>
        ) : (
          <p className="cargo-fee-payment-card__hint cargo-fee-payment-card__hint--warn">
            Mijoz hali to‘lamagan
          </p>
        )}
      </div>
    </button>
  );
}
