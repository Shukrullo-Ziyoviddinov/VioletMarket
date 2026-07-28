import React from 'react';
import './ReturnRequestCard.css';

function formatTitle(title) {
  if (!title) return 'Mahsulot';
  if (typeof title === 'string') return title;
  return title.uz || title.ru || 'Mahsulot';
}

function formatMoney(value) {
  const n = Math.max(0, Number(value) || 0);
  return `${n.toLocaleString('uz-UZ')} so'm`;
}

function statusLabel(status) {
  if (status === 'approved' || status === 'completed') return 'Tasdiqlangan';
  if (status === 'rejected') return 'Rad etilgan';
  return 'Kutilmoqda';
}

export default function ReturnRequestCard({
  item,
  onApprove,
  onReject,
}) {
  if (!item) return null;
  const isCargo = item.source === 'cargo';
  const courierName = [item.courier?.firstName, item.courier?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim() || (isCargo ? 'Cargo' : 'Kuryer');
  const customerName = [item.customer?.firstName, item.customer?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  const isPending = item.status === 'pending';
  const badgeStatus =
    item.status === 'completed' ? 'approved' : item.status;

  return (
    <article className="return-request-card">
      {!isCargo ? (
        <div className="return-request-card__media">
          <img
            src={item.imageUrl || '/img/no-image.png'}
            alt={formatTitle(item.title)}
            onError={(e) => {
              e.currentTarget.src = '/img/no-image.png';
            }}
          />
        </div>
      ) : null}
      <div className="return-request-card__body">
        <div className="return-request-card__top">
          <h3 className="return-request-card__title" title={formatTitle(item.title)}>
            {formatTitle(item.title)}
          </h3>
          <span className={`return-request-card__badge return-request-card__badge--${badgeStatus}`}>
            {statusLabel(item.status)}
          </span>
        </div>
        {isCargo ? (
          <p className="return-request-card__meta">
            Cargo · {item.cargoCountryLabel || item.cargoCountry || '—'}
            {item.storeName ? ` · ${item.storeName}` : ''}
          </p>
        ) : null}
        <p className="return-request-card__meta">
          Buyurtma #{item.orderId} · Kod: {item.productCode || '—'}
          {item.requestCode ? ` · ${item.requestCode}` : ''}
        </p>
        <p className="return-request-card__meta">
          {formatMoney(item.amount)} · {item.isPaid ? 'To‘langan' : 'Naqd'}
        </p>
        <p className="return-request-card__meta">
          {isCargo ? 'Cargo' : 'Kuryer'}: {courierName}
          {!isCargo && item.courier?.phone ? ` · ${item.courier.phone}` : ''}
        </p>
        {!isCargo && customerName ? (
          <p className="return-request-card__meta">
            Mijoz: {customerName} · {item.customer?.phone || '—'}
          </p>
        ) : null}
        {isCargo && item.sellerId ? (
          <p className="return-request-card__meta">Siller: {item.sellerId}</p>
        ) : null}
        {item.comment ? (
          <p className="return-request-card__comment">Izoh: {item.comment}</p>
        ) : null}
        {item.approvedReasonType ? (
          <p className="return-request-card__meta">
            Tasdiqlangan tur:{' '}
            {item.approvedReasonType === 'no_answer'
              ? 'Javob bermadi'
              : item.approvedReasonType === 'defective'
                ? 'Yaroqsiz'
                : 'Qaytarish'}
          </p>
        ) : null}
        {item.rejectReason ? (
          <p className="return-request-card__comment">Rad: {item.rejectReason}</p>
        ) : null}
        {isPending ? (
          <div className="return-request-card__actions">
            <button
              type="button"
              className="return-request-card__btn return-request-card__btn--approve"
              onClick={() => onApprove?.(item)}
            >
              Tasdiqlash
            </button>
            <button
              type="button"
              className="return-request-card__btn return-request-card__btn--reject"
              onClick={() => onReject?.(item)}
            >
              Rad etish
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
