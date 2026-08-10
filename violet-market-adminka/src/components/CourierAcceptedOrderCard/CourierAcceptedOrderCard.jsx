import React, { useState } from 'react';
import { Modal, message } from 'antd';
import CourierAcceptedOrderPaymentEditor from '../CourierAcceptedOrderPaymentEditor/CourierAcceptedOrderPaymentEditor';
import CourierAcceptedOrderProgress from '../CourierAcceptedOrderProgress/CourierAcceptedOrderProgress';
import CourierAcceptedOrderStatusBadge from '../CourierAcceptedOrderStatusBadge/CourierAcceptedOrderStatusBadge';
import { reassignCourierAssignment } from '../../api/couriersAdminApi';
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

const REASSIGNABLE_STATUSES = new Set([
  'accepted',
  'en_route_to_seller',
  'arrived_at_seller',
  'picked_up',
  'en_route_to_customer',
  'arrived_at_customer',
]);

export default function CourierAcceptedOrderCard({
  order,
  onPaymentUpdated,
  onReassigned,
}) {
  const [reassigning, setReassigning] = useState(false);
  const customerName =
    `${order?.customer?.firstName || ''} ${order?.customer?.lastName || ''}`.trim() ||
    'Mijoz nomi yo‘q';
  const isDelivered = order?.status === 'delivered';
  const isReturned = order?.status === 'returned';
  const isPayable = isDelivered || isReturned;
  const canReassign = REASSIGNABLE_STATUSES.has(String(order?.status || ''));

  const handleReassign = () => {
    if (!canReassign || reassigning || !order?.id) return;
    Modal.confirm({
      title: 'Qayta tayinlash',
      content:
        'Bu buyurtma kuryerdan olinib, delivery «Buyurtmalar» sahifasiga qaytariladi. Boshqa kuryer (shu kuryer ham) qayta qabul qilishi mumkin.',
      okText: 'Qayta tayinlash',
      cancelText: 'Bekor',
      okButtonProps: { danger: true },
      onOk: async () => {
        setReassigning(true);
        try {
          await reassignCourierAssignment(order.id);
          message.success('Buyurtma poolga qaytarildi');
          onReassigned?.(order.id);
        } catch (err) {
          message.error(err?.message || 'Qayta tayinlab bo‘lmadi');
          throw err;
        } finally {
          setReassigning(false);
        }
      },
    });
  };

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
          isPayable ? ' courier-accepted-order-card__meta-grid--delivered' : ''
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
        {isReturned ? (
          <div>
            <span className="courier-accepted-order-card__label">Qaytarilgan vaqt</span>
            <p className="courier-accepted-order-card__value courier-accepted-order-card__value--delivered">
              {formatDateTime(order?.returnedAt)}
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
        editable={isPayable}
        onUpdated={(updated) =>
          onPaymentUpdated?.({
            ...order,
            courierPayment: updated?.courierPayment ?? order.courierPayment,
          })
        }
      />

      {canReassign ? (
        <button
          type="button"
          className="courier-accepted-order-card__reassign"
          disabled={reassigning}
          onClick={handleReassign}
        >
          {reassigning ? 'Qayta tayinlanmoqda...' : 'Qayta tayinlash'}
        </button>
      ) : null}
    </article>
  );
}
