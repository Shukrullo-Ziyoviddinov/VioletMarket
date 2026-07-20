import React from 'react';
import './CourierAcceptedOrderCard.css';

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function resolveTitle(order) {
  return (
    order?.title?.uz ||
    order?.title?.ru ||
    order?.deliveryAddress?.addressLine ||
    'Mahsulot'
  );
}

export default function CourierAcceptedOrderCard({ order }) {
  const customerName =
    `${order?.customer?.firstName || ''} ${order?.customer?.lastName || ''}`.trim() ||
    'Mijoz nomi yo‘q';

  return (
    <article className="courier-accepted-order-card">
      <div className="courier-accepted-order-card__top">
        <p className="courier-accepted-order-card__barcode">
          {order?.barcode || order?.productCode || '—'}
        </p>
        <span
          className={`courier-accepted-order-card__status ${
            order?.status === 'delivered'
              ? 'courier-accepted-order-card__status--delivered'
              : ''
          }`}
        >
          {order?.status === 'delivered' ? 'Topshirilgan' : 'Qabul qilingan'}
        </span>
      </div>

      <h4 className="courier-accepted-order-card__title">{resolveTitle(order)}</h4>

      <div className="courier-accepted-order-card__meta-grid">
        <div>
          <span className="courier-accepted-order-card__label">Buyurtma</span>
          <p className="courier-accepted-order-card__value">#{order?.orderId || 0}</p>
        </div>
        <div>
          <span className="courier-accepted-order-card__label">Qabul qilingan vaqt</span>
          <p className="courier-accepted-order-card__value">
            {formatDateTime(order?.acceptedAt)}
          </p>
        </div>
      </div>

      <div className="courier-accepted-order-card__customer">
        <span className="courier-accepted-order-card__label">Mijoz ma’lumoti</span>
        <p className="courier-accepted-order-card__value">{customerName}</p>
        <p className="courier-accepted-order-card__value courier-accepted-order-card__phone">
          {order?.customer?.phone || 'Telefon yo‘q'}
        </p>
      </div>
    </article>
  );
}
