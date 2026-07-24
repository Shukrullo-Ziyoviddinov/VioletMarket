import React from 'react';
import { formatRevenue, resolveProductImageUrl } from '../../../utils/productDisplay';
import './ReturnedProductsCard.css';

function productTitle(order) {
  return (
    String(order?.title?.uz || '').trim() ||
    String(order?.title?.ru || '').trim() ||
    order?.productCode ||
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

function reasonLabel(reasonType) {
  if (reasonType === 'defective') return 'Yaroqsiz';
  return 'Qaytarilgan';
}

export default function ReturnedProductsCard({ order }) {
  const reasonType = order?.reasonType === 'defective' ? 'defective' : 'return';
  const sellerName = order?.seller?.name || '—';
  const sellerLogo = resolveProductImageUrl(order?.seller?.logo);
  const productImage = resolveProductImageUrl(order?.imageUrl);

  return (
    <article className="returned-products-card">
      <div className="returned-products-card__media">
        {order?.imageUrl ? (
          <img
            src={productImage}
            alt={productTitle(order)}
            onError={(event) => {
              event.currentTarget.src = resolveProductImageUrl('');
            }}
          />
        ) : (
          <div className="returned-products-card__placeholder">—</div>
        )}
      </div>

      <div className="returned-products-card__body">
        <div className="returned-products-card__header">
          <div className="returned-products-card__heading">
            <h3 className="returned-products-card__title">{productTitle(order)}</h3>
            {order?.productCode ? (
              <p className="returned-products-card__code">{order.productCode}</p>
            ) : null}
          </div>
          <span
            className={`returned-products-card__badge returned-products-card__badge--${reasonType}`}
          >
            {reasonLabel(reasonType)}
          </span>
        </div>

        <div className="returned-products-card__seller">
          <img
            src={sellerLogo}
            alt={sellerName}
            onError={(event) => {
              event.currentTarget.src = resolveProductImageUrl('');
            }}
          />
          <div>
            <span className="returned-products-card__label">Siller</span>
            <strong className="returned-products-card__seller-name">{sellerName}</strong>
          </div>
        </div>

        <div className="returned-products-card__meta">
          <div className="returned-products-card__meta-item">
            <span className="returned-products-card__label">Miqdor</span>
            <strong className="returned-products-card__value">{order?.quantity || 1}</strong>
          </div>
          <div className="returned-products-card__meta-item returned-products-card__meta-item--accent">
            <span className="returned-products-card__label">Narx</span>
            <strong className="returned-products-card__value returned-products-card__value--price">
              {formatRevenue(order?.amount)}
            </strong>
          </div>
          <div className="returned-products-card__meta-item">
            <span className="returned-products-card__label">Buyurtma</span>
            <strong className="returned-products-card__value">
              {formatDateTime(order?.orderedAt)}
            </strong>
          </div>
          <div className="returned-products-card__meta-item">
            <span className="returned-products-card__label">Qaytarilgan</span>
            <strong className="returned-products-card__value">
              {formatDateTime(order?.returnedAt)}
            </strong>
          </div>
        </div>

        <div className="returned-products-card__people">
          <div className="returned-products-card__person">
            <span className="returned-products-card__label">Mijoz</span>
            <strong className="returned-products-card__person-name">
              {personName(order?.customer)}
            </strong>
            <p className="returned-products-card__person-phone">
              {order?.customer?.phone || '—'}
            </p>
          </div>
          <div className="returned-products-card__person">
            <span className="returned-products-card__label">Kuryer</span>
            <strong className="returned-products-card__person-name">
              {personName(order?.courier)}
            </strong>
            <p className="returned-products-card__person-phone">
              {order?.courier?.phone || '—'}
            </p>
          </div>
        </div>

        {order?.comment ? (
          <div className="returned-products-card__comment">
            <span className="returned-products-card__label">Izoh</span>
            <p className="returned-products-card__comment-text">{order.comment}</p>
          </div>
        ) : null}
      </div>
    </article>
  );
}
