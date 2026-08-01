import React, { useState } from 'react';
import { message } from 'antd';
import {
  cancelAdminOrderItem,
  collectAdminOrderGroup,
  collectAdminOrderItem,
  confirmAdminOrderGroup,
  confirmAdminOrderItem,
} from '../../../api/adminOrdersApi';
import { useAdminModal } from '../../../context/AdminModalContext';
import MiniGlobalModal from '../../MiniGlobalModal/MiniGlobalModal';
import AdminOrderDetailModalContent from '../AdminOrderDetailModalContent/AdminOrderDetailModalContent';
import '../AdminOrderDetailModal/AdminOrderDetailModal.css';

function resolveItemIndexes(order) {
  if (Array.isArray(order?.itemIndexes) && order.itemIndexes.length) {
    return [...new Set(order.itemIndexes.map((value) => Number(value) || 0))];
  }
  return [Number(order?.itemIndex) || 0];
}

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

  const itemIndexes = resolveItemIndexes(order);
  const isGroup = Boolean(order.isGroup) || itemIndexes.length > 1;
  const showConfirm =
    mode === 'confirm' &&
    (isGroup || order.trackingStatus === 'accepted');
  const showCollect =
    mode === 'collect' &&
    (isGroup || order.trackingStatus === 'seller_confirmed');
  const showCancelOrder = !isGroup && (showConfirm || showCollect);
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
      let result;
      if (isGroup) {
        result = await confirmAdminOrderGroup(order.orderId, order.sellerId, {
          itemIndexes,
        });
      } else {
        await confirmAdminOrderItem(order.orderId, order.itemIndex, order.sellerId);
        result = { updatedCount: 1 };
      }

      if (Number(result?.updatedCount) <= 0) {
        message.warning('Tasdiqlash uchun tayyor mahsulot yo‘q');
        onSuccess?.();
        return;
      }
      const skippedCount = Number(result?.skippedCount) || 0;
      const base = isGroup
        ? 'Buyurtma mahsulotlari tasdiqlandi'
        : 'Buyurtma tasdiqlandi';
      finishSuccess(
        skippedCount > 0
          ? `${base} (${skippedCount} ta o‘tkazib yuborildi)`
          : base,
      );
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
      let result;
      if (isGroup) {
        result = await collectAdminOrderGroup(order.orderId, order.sellerId, {
          itemIndexes,
        });
      } else {
        await collectAdminOrderItem(order.orderId, order.itemIndex, order.sellerId);
        result = { updatedCount: 1 };
      }

      if (Number(result?.updatedCount) <= 0) {
        message.warning('Yig‘ish uchun tayyor mahsulot yo‘q');
        onSuccess?.();
        return;
      }
      const skippedCount = Number(result?.skippedCount) || 0;
      const base = isGroup
        ? "Mahsulotlar yig'ilgani tasdiqlandi"
        : "Mahsulot yig'ilgani tasdiqlandi";
      finishSuccess(
        skippedCount > 0
          ? `${base} (${skippedCount} ta o‘tkazib yuborildi)`
          : base,
      );
    } catch (error) {
      message.error(error?.message || 'Yig‘ib bo‘lmadi');
    } finally {
      setBusy(false);
    }
  };

  const handleCancelOrder = async () => {
    if (actionsBusy || isGroup) return;
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
              {busy
                ? 'Tasdiqlanmoqda...'
                : isGroup
                  ? 'Hammasini tasdiqlash'
                  : 'Tasdiqlash'}
            </button>
          ) : null}
          {showCollect ? (
            <button
              type="button"
              className="seller-order-detail-modal__confirm"
              disabled={actionsBusy}
              onClick={handleCollect}
            >
              {busy
                ? 'Tasdiqlanmoqda...'
                : isGroup
                  ? "Barcha mahsulotlarni yig'ilgan deb belgilash"
                  : "Mahsulot yig'ilganligini tasdiqlash"}
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
