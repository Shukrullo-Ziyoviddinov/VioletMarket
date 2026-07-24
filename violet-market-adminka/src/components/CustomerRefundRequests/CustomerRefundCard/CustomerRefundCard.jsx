import React from 'react';
import { formatRevenue, resolveProductImageUrl } from '../../../utils/productDisplay';
import './CustomerRefundCard.css';

function productTitle(item) {
  return (
    String(item?.title?.uz || '').trim() ||
    String(item?.title?.ru || '').trim() ||
    item?.productCode ||
    '—'
  );
}

function personName(person) {
  const name = [person?.firstName, person?.lastName]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' ');
  return name || '—';
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CustomerRefundCard({ item, confirming = false, onConfirm }) {
  const isPending = item?.status === 'pending';
  const reasonLabel = item?.reasonType === 'defective' ? 'Yaroqsiz' : 'Qaytarilgan';

  return (
    <article className="customer-refund-card">
      <div className="customer-refund-card__media">
        <img
          src={resolveProductImageUrl(item?.imageUrl)}
          alt={productTitle(item)}
          onError={(event) => {
            event.currentTarget.src = resolveProductImageUrl('');
          }}
        />
      </div>

      <div className="customer-refund-card__body">
        <div className="customer-refund-card__header">
          <div>
            <h3 className="customer-refund-card__title">{productTitle(item)}</h3>
            {item?.productCode ? (
              <p className="customer-refund-card__code">{item.productCode}</p>
            ) : null}
          </div>
          <div className="customer-refund-card__badges">
            <span
              className={`customer-refund-card__badge customer-refund-card__badge--${
                item?.reasonType === 'defective' ? 'defective' : 'return'
              }`}
            >
              {reasonLabel}
            </span>
            <span
              className={`customer-refund-card__badge customer-refund-card__badge--${
                isPending ? 'pending' : 'refunded'
              }`}
            >
              {isPending ? 'Kutilmoqda' : 'Qaytarildi'}
            </span>
          </div>
        </div>

        <div className="customer-refund-card__seller">
          <img
            src={resolveProductImageUrl(item?.seller?.logo)}
            alt={item?.seller?.name || 'Siller'}
            onError={(event) => {
              event.currentTarget.src = resolveProductImageUrl('');
            }}
          />
          <div>
            <span className="customer-refund-card__label">Siller</span>
            <strong>{item?.seller?.name || '—'}</strong>
          </div>
        </div>

        <div className="customer-refund-card__meta">
          <div>
            <span className="customer-refund-card__label">Summa</span>
            <strong className="customer-refund-card__amount">
              {formatRevenue(item?.amount)}
            </strong>
          </div>
          <div>
            <span className="customer-refund-card__label">Mijoz</span>
            <strong>{personName(item?.customer)}</strong>
            <p className="customer-refund-card__phone">{item?.customer?.phone || '—'}</p>
          </div>
          <div>
            <span className="customer-refund-card__label">Qaytarilgan</span>
            <strong>{formatDateTime(item?.returnedAt)}</strong>
          </div>
          {!isPending ? (
            <div>
              <span className="customer-refund-card__label">Mijozga qaytarilgan</span>
              <strong>{formatDateTime(item?.refundedAt)}</strong>
            </div>
          ) : null}
        </div>

        {isPending ? (
          <div className="customer-refund-card__actions">
            <button
              type="button"
              className="customer-refund-card__confirm"
              disabled={confirming}
              onClick={() => onConfirm?.(item)}
            >
              {confirming ? 'Saqlanmoqda...' : 'Mijozga summa qaytarildi'}
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
