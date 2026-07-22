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
  if (status === 'approved') return 'Tasdiqlangan';
  if (status === 'rejected') return 'Rad etilgan';
  return 'Kutilmoqda';
}

export default function ReturnRequestCard({
  item,
  onApprove,
  onReject,
}) {
  if (!item) return null;
  const courierName = [item.courier?.firstName, item.courier?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Kuryer';
  const customerName = [item.customer?.firstName, item.customer?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Mijoz';
  const isPending = item.status === 'pending';

  return (
    <article className="return-request-card">
      <div className="return-request-card__media">
        <img
          src={item.imageUrl || '/img/no-image.png'}
          alt={formatTitle(item.title)}
          onError={(e) => {
            e.currentTarget.src = '/img/no-image.png';
          }}
        />
      </div>
      <div className="return-request-card__body">
        <div className="return-request-card__top">
          <h3 className="return-request-card__title">{formatTitle(item.title)}</h3>
          <span className={`return-request-card__badge return-request-card__badge--${item.status}`}>
            {statusLabel(item.status)}
          </span>
        </div>
        <p className="return-request-card__meta">
          Buyurtma #{item.orderId} · Kod: {item.productCode || '—'}
        </p>
        <p className="return-request-card__meta">
          {formatMoney(item.amount)} · {item.isPaid ? 'To‘langan' : 'Naqd'}
        </p>
        <p className="return-request-card__meta">
          Kuryer: {courierName} · {item.courier?.phone || '—'}
        </p>
        <p className="return-request-card__meta">
          Mijoz: {customerName} · {item.customer?.phone || '—'}
        </p>
        {item.comment ? (
          <p className="return-request-card__comment">Izoh: {item.comment}</p>
        ) : null}
        {item.approvedReasonType ? (
          <p className="return-request-card__meta">
            Tasdiqlangan tur:{' '}
            {item.approvedReasonType === 'no_answer' ? 'Javob bermadi' : 'Qaytarish'}
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
