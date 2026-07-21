import React, { useState } from 'react';
import { message } from 'antd';
import {
  collectAdminOrderItem,
  confirmAdminOrderItem,
} from '../../../api/adminOrdersApi';
import { useAdminModal } from '../../../context/AdminModalContext';
import AdminOrderDetailModalContent from '../AdminOrderDetailModalContent/AdminOrderDetailModalContent';
import '../AdminOrderDetailModal/AdminOrderDetailModal.css';

export default function AdminOrderDetailSectionContent({
  visible,
  order,
  mode = '',
  onSuccess,
}) {
  const { closeAdminModal } = useAdminModal();
  const [busy, setBusy] = useState(false);

  if (!visible || !order) return null;

  const showConfirm = mode === 'confirm' && order.trackingStatus === 'accepted';
  const showCollect = mode === 'collect' && order.trackingStatus === 'seller_confirmed';

  const finishSuccess = (text) => {
    message.success(text);
    closeAdminModal();
    onSuccess?.();
  };

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await confirmAdminOrderItem(order.orderId, order.itemIndex, order.sellerId);
      finishSuccess('Buyurtma tasdiqlandi');
    } catch (error) {
      message.error(error?.message || 'Tasdiqlab bo‘lmadi');
    } finally {
      setBusy(false);
    }
  };

  const handleCollect = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await collectAdminOrderItem(order.orderId, order.itemIndex, order.sellerId);
      finishSuccess("Mahsulot yig'ilgani tasdiqlandi");
    } catch (error) {
      message.error(error?.message || 'Yig‘ib bo‘lmadi');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <AdminOrderDetailModalContent order={order} />
      {showConfirm ? (
        <div className="seller-order-detail-modal__actions">
          <button
            type="button"
            className="seller-order-detail-modal__confirm"
            disabled={busy}
            onClick={handleConfirm}
          >
            {busy ? 'Tasdiqlanmoqda...' : 'Tasdiqlash'}
          </button>
        </div>
      ) : null}
      {showCollect ? (
        <div className="seller-order-detail-modal__actions">
          <button
            type="button"
            className="seller-order-detail-modal__confirm"
            disabled={busy}
            onClick={handleCollect}
          >
            {busy ? 'Tasdiqlanmoqda...' : "Mahsulot yig'ilganligini tasdiqlash"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
