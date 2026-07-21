import React from 'react';
import { RightOutlined } from '@ant-design/icons';
import {
  getAdminOrderBuyerName,
  getAdminOrderBuyerPhone,
} from '../../../utils/adminOrdersDisplay';
import AdminOrderProductMeta from '../AdminOrderProductMeta/AdminOrderProductMeta';
import AdminOrderSellerBadge from '../AdminOrderSellerBadge/AdminOrderSellerBadge';
import AdminOrderStatusBadge from '../AdminOrderStatusBadge/AdminOrderStatusBadge';
import './AdminOrderCourierCard.css';

export default function AdminOrderCourierCard({ order, onOpen }) {
  return (
    <button
      type="button"
      className="seller-order-courier-card"
      onClick={() => onOpen?.(order)}
    >
      <AdminOrderSellerBadge order={order} className="admin-order-seller-badge--block" />
      <AdminOrderProductMeta order={order} compact />
      <AdminOrderStatusBadge trackingStatus={order.trackingStatus} />
      <div className="seller-order-courier-card__row">
        <span>Xaridor</span>
        <strong>{getAdminOrderBuyerName(order.buyer)}</strong>
      </div>
      <div className="seller-order-courier-card__row">
        <span>Telefon</span>
        <strong>{getAdminOrderBuyerPhone(order.buyer)}</strong>
      </div>
      <RightOutlined className="seller-order-courier-card__chevron" />
    </button>
  );
}
