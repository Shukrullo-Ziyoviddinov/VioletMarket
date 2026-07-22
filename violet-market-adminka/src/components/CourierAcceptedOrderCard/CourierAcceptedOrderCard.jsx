import React from 'react';
import CourierAcceptedOrderPaymentEditor from '../CourierAcceptedOrderPaymentEditor/CourierAcceptedOrderPaymentEditor';
import CourierAcceptedOrderProgress from '../CourierAcceptedOrderProgress/CourierAcceptedOrderProgress';
import CourierAcceptedOrderStatusBadge from '../CourierAcceptedOrderStatusBadge/CourierAcceptedOrderStatusBadge';
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

export default function CourierAcceptedOrderCard({ order, onPaymentUpdated }) {
  const customerName =
    `${order?.customer?.firstName || ''} ${order?.customer?.lastName || ''}`.trim() ||
    'Mijoz nomi yo‘q';
  const isDelivered = order?.status === 'delivered';

  return (
    <article className="courier-accepted-order-card">
      <div className="courier-accepted-order-card__top">
        <p className="courier-accepted-order-card__barcode">
          {order?.barcode || order?.productCode || '—'}
        </p>
        <CourierAcceptedOrderStatusBadge status={order?.status} />
      </div>

      <h4 className="courier-accepted-order-card__title">{resolveTitle(order)}</h4>

      <CourierAcceptedOrderProgress status={order?.status} />

      <div
        className={`courier-accepted-order-card__meta-grid${
          isDelivered ? ' courier-accepted-order-card__meta-grid--delivered' : ''
        }`}
      >
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
        {isDelivered ? (
          <div>
            <span className="courier-accepted-order-card__label">Topshirilgan vaqt</span>
            <p className="courier-accepted-order-card__value courier-accepted-order-card__value--delivered">
              {formatDateTime(order?.deliveredAt)}
            </p>
          </div>
        ) : null}
      </div>

      <div className="courier-accepted-order-card__customer">
        <span className="courier-accepted-order-card__label">Mijoz ma’lumoti</span>
        <p className="courier-accepted-order-card__value">{customerName}</p>
        <p className="courier-accepted-order-card__value courier-accepted-order-card__phone">
          {order?.customer?.phone || 'Telefon yo‘q'}
        </p>
      </div>

      <CourierAcceptedOrderPaymentEditor
        order={order}
        editable={isDelivered}
        onUpdated={(updated) =>
          onPaymentUpdated?.({
            ...order,
            courierPayment: updated?.courierPayment ?? order.courierPayment,
          })
        }
      />
    </article>
  );
}
