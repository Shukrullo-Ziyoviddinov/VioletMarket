import React from 'react';
import { RightOutlined } from '@ant-design/icons';
import {
  formatAdminOrderAmount,
  formatAdminOrderDateTime,
  getAdminOrderBuyerName,
  getAdminOrderBuyerPhone,
  getAdminOrderPaymentLabel,
  getAdminOrderPaymentTone,
} from '../../../utils/adminOrdersDisplay';
import AdminOrderProductMeta from '../AdminOrderProductMeta/AdminOrderProductMeta';
import AdminOrderSellerBadge from '../AdminOrderSellerBadge/AdminOrderSellerBadge';
import AdminOrderStatusBadge from '../AdminOrderStatusBadge/AdminOrderStatusBadge';
import './AdminOrderCard.css';

export default function AdminOrderCard({ order, onOpen }) {
  if (!order) return null;

  const paymentTone = getAdminOrderPaymentTone(order.paymentMethod);

  return (
    <button type="button" className="seller-order-card" onClick={() => onOpen?.(order)}>
      <div className="seller-order-card__fields">
        <div className="seller-order-card__field seller-order-card__field--grow">
          <AdminOrderSellerBadge order={order} />
        </div>

        <div className="seller-order-card__field seller-order-card__field--grow">
          <span className="seller-order-card__label">Mahsulot</span>
          <AdminOrderProductMeta order={order} />
        </div>

        <div className="seller-order-card__field">
          <span className="seller-order-card__label">Holat</span>
          <AdminOrderStatusBadge trackingStatus={order.trackingStatus} />
        </div>

        <div className="seller-order-card__field">
          <span className="seller-order-card__label">Buyurtma ID</span>
          <strong className="seller-order-card__value">{order.orderCode || '—'}</strong>
        </div>

        <div className="seller-order-card__field seller-order-card__field--grow">
          <span className="seller-order-card__label">Sana va vaqt</span>
          <strong className="seller-order-card__value">
            {formatAdminOrderDateTime(order.orderedAt)}
          </strong>
        </div>

        <div className="seller-order-card__field seller-order-card__field--grow">
          <span className="seller-order-card__label">Xaridor</span>
          <strong className="seller-order-card__value">{getAdminOrderBuyerName(order.buyer)}</strong>
        </div>

        <div className="seller-order-card__field">
          <span className="seller-order-card__label">Telefon</span>
          <strong className="seller-order-card__value seller-order-card__value--phone">
            {getAdminOrderBuyerPhone(order.buyer)}
          </strong>
        </div>

        <div className="seller-order-card__field">
          <span className="seller-order-card__label">To‘lov</span>
          <span className={`seller-order-card__payment seller-order-card__payment--${paymentTone}`}>
            {getAdminOrderPaymentLabel(order.paymentMethod)}
          </span>
        </div>

        <div className="seller-order-card__field">
          <span className="seller-order-card__label">Mahsulot narxi</span>
          <strong className="seller-order-card__value seller-order-card__value--amount">
            {formatAdminOrderAmount(order.amount)}
          </strong>
        </div>
      </div>

      <span className="seller-order-card__chevron" aria-hidden="true">
        <RightOutlined />
      </span>
    </button>
  );
}
