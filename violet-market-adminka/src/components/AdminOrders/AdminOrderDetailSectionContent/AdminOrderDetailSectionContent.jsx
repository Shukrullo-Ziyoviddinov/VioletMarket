import React, { useState } from 'react';
import { message } from 'antd';
import {
  cancelAdminOrderItem,
  collectAdminOrderItem,
  confirmAdminOrderItem,
} from '../../../api/adminOrdersApi';
import { useAdminModal } from '../../../context/AdminModalContext';
import MiniGlobalModal from '../../MiniGlobalModal/MiniGlobalModal';
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
  const [cancelling, setCancelling] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  if (!visible || !order) return null;

  const showConfirm = mode === 'confirm' && order.trackingStatus === 'accepted';
  const showCollect = mode === 'collect' && order.trackingStatus === 'seller_confirmed';
  const showCancelOrder = showConfirm || showCollect;
  const actionsBusy = busy || cancelling;

  const finishSuccess = (text) => {
    message.success(text);
    closeAdminModal();
    onSuccess?.();
  };

  const handleConfirm = async () => {
    if (actionsBusy) return;
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
    if (actionsBusy) return;
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

  const handleCancelOrder = async () => {
    if (actionsBusy) return;
    setCancelling(true);
    try {
      await cancelAdminOrderItem(order.orderId, order.itemIndex, order.sellerId);
      setCancelConfirmOpen(false);
      finishSuccess('Buyurtma bekor qilindi, mahsulot omborga qaytdi');
    } catch (error) {
      message.error(error?.message || 'Buyurtmani bekor qilib bo‘lmadi');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div>
      <AdminOrderDetailModalContent order={order} />
      {showConfirm || showCollect ? (
        <div className="seller-order-detail-modal__actions">
          {showCancelOrder ? (
            <button
              type="button"
              className="seller-order-detail-modal__cancel-order"
              disabled={actionsBusy}
              onClick={() => setCancelConfirmOpen(true)}
            >
              Buyurtmani bekor qilish
            </button>
          ) : (
            <span />
          )}
          {showConfirm ? (
            <button
              type="button"
              className="seller-order-detail-modal__confirm"
              disabled={actionsBusy}
              onClick={handleConfirm}
            >
              {busy ? 'Tasdiqlanmoqda...' : 'Tasdiqlash'}
            </button>
          ) : null}
          {showCollect ? (
            <button
              type="button"
              className="seller-order-detail-modal__confirm"
              disabled={actionsBusy}
              onClick={handleCollect}
            >
              {busy ? 'Tasdiqlanmoqda...' : "Mahsulot yig'ilganligini tasdiqlash"}
            </button>
          ) : null}
        </div>
      ) : null}

      <MiniGlobalModal
        open={cancelConfirmOpen}
        mode="confirm"
        permissionKey="cancelOrder"
        loading={cancelling}
        onConfirm={handleCancelOrder}
        onCancel={() => {
          if (!cancelling) setCancelConfirmOpen(false);
        }}
      />
    </div>
  );
}
