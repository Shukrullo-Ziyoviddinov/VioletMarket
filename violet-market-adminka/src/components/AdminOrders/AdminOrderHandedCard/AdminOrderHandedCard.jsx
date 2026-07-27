import React from 'react';
import {
  getAdminOrderBuyerName,
  getAdminOrderBuyerPhone,
} from '../../../utils/adminOrdersDisplay';
import AdminOrderProductMeta from '../AdminOrderProductMeta/AdminOrderProductMeta';
import AdminOrderSellerBadge from '../AdminOrderSellerBadge/AdminOrderSellerBadge';
import AdminOrderStatusBadge from '../AdminOrderStatusBadge/AdminOrderStatusBadge';
import './AdminOrderHandedCard.css';

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

function getCourierName(courier) {
  if (!courier) return '';
  return [courier.firstName, courier.lastName].filter(Boolean).join(' ').trim();
}

export default function AdminOrderHandedCard({ order, showSellerCountry = false }) {
  const courierAccepted = Boolean(order?.courierAccepted && order?.courier);
  const courierName = getCourierName(order?.courier);

  return (
    <div className="seller-order-handed-card">
      <AdminOrderSellerBadge
        order={order}
        className="admin-order-seller-badge--block"
        showCountry={showSellerCountry}
      />
      <AdminOrderProductMeta order={order} compact />
      <AdminOrderStatusBadge trackingStatus={order.trackingStatus} />
      <div className="seller-order-handed-card__row">
        <span>Xaridor</span>
        <strong>{getAdminOrderBuyerName(order.buyer)}</strong>
      </div>
      <div className="seller-order-handed-card__row">
        <span>Telefon</span>
        <strong>{getAdminOrderBuyerPhone(order.buyer)}</strong>
      </div>
      <div className="seller-order-handed-card__row">
        <span>Topshirilgan vaqt</span>
        <strong>{formatDateTime(order.handedToCourierAt)}</strong>
      </div>

      <div
        className={`seller-order-handed-card__courier${
          courierAccepted ? '' : ' seller-order-handed-card__courier--waiting'
        }`}
      >
        {courierAccepted ? (
          <>
            <div className="seller-order-handed-card__row">
              <span>Kuryer</span>
              <strong>{courierName || '—'}</strong>
            </div>
            <div className="seller-order-handed-card__row">
              <span>Kuryer telefoni</span>
              <strong>{order.courier?.phone || '—'}</strong>
            </div>
            <div className="seller-order-handed-card__row">
              <span>Kuryer qabul qilgan vaqt</span>
              <strong>{formatDateTime(order.acceptedAt)}</strong>
            </div>
          </>
        ) : (
          <p className="seller-order-handed-card__waiting">
            Kuryer hali qabul qilmagan — Qabul qilish bosilganda ism, telefon va vaqt chiqadi
          </p>
        )}
      </div>
    </div>
  );
}
