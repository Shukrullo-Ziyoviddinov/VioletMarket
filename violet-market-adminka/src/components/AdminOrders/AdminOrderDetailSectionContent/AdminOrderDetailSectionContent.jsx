import React, { useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import {
  cancelAdminOrderGroup,
  cancelAdminOrderItem,
  collectAdminOrderGroup,
  collectAdminOrderItem,
  confirmAdminOrderGroup,
  confirmAdminOrderItem,
  markUnavailableAdminOrderItem,
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

function resolveDefaultItemIndexes(order) {
  const indexes = resolveItemIndexes(order);
  return indexes.length === 1 ? indexes : [];
}

function toggleIndex(list, index) {
  const value = Number(index);
  if (!Number.isInteger(value) || value < 0) return list;
  if (list.includes(value)) return list.filter((item) => item !== value);
  return [...list, value];
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
  const [markingUnavailable, setMarkingUnavailable] = useState(false);
  const [unavailableConfirmOpen, setUnavailableConfirmOpen] = useState(false);
  const [selectedItemIndexes, setSelectedItemIndexes] = useState([]);

  const itemIndexes = resolveItemIndexes(order);
  const isGroup = Boolean(order?.isGroup) || itemIndexes.length > 1;
  const showConfirm =
    mode === 'confirm' &&
    (isGroup || order?.trackingStatus === 'accepted');
  const showCollect =
    mode === 'collect' &&
    (isGroup || order?.trackingStatus === 'seller_confirmed');
  const showCancelOrder = showConfirm || showCollect;
  const showUnavailable = showConfirm || showCollect;
  const actionsBusy = busy || cancelling || markingUnavailable;

  const unavailableReady = useMemo(() => {
    if (!showUnavailable) return false;
    if (!isGroup) return true;
    return selectedItemIndexes.length > 0;
  }, [showUnavailable, isGroup, selectedItemIndexes]);

  useEffect(() => {
    if (!visible) {
      setSelectedItemIndexes([]);
      setCancelConfirmOpen(false);
      setUnavailableConfirmOpen(false);
      return;
    }
    setSelectedItemIndexes(resolveDefaultItemIndexes(order));
  }, [visible, order]);

  if (!visible || !order) return null;

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
    if (actionsBusy) return;
    setCancelling(true);
    try {
      let result;
      if (isGroup) {
        result = await cancelAdminOrderGroup(order.orderId, order.sellerId, {
          itemIndexes,
        });
      } else {
        await cancelAdminOrderItem(order.orderId, order.itemIndex, order.sellerId);
        result = { updatedCount: 1, skippedCount: 0 };
      }

      if (Number(result?.updatedCount) <= 0) {
        message.warning('Bekor qilish uchun tayyor mahsulot yo‘q');
        onSuccess?.();
        return;
      }

      const skippedCount = Number(result?.skippedCount) || 0;
      const base = isGroup
        ? 'Mahsulotlar bekor qilindi, omborga qaytdi'
        : 'Buyurtma bekor qilindi, mahsulot omborga qaytdi';
      setCancelConfirmOpen(false);
      finishSuccess(
        skippedCount > 0
          ? `${base} (${skippedCount} ta o‘tkazib yuborildi)`
          : base,
      );
    } catch (error) {
      message.error(error?.message || 'Buyurtmani bekor qilib bo‘lmadi');
    } finally {
      setCancelling(false);
    }
  };

  const handleMarkUnavailable = async () => {
    if (actionsBusy) return;
    const indexes = isGroup
      ? selectedItemIndexes
      : [Number(order.itemIndex) || 0];
    const uniqueIndexes = [
      ...new Set(
        indexes
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value >= 0),
      ),
    ];
    if (!uniqueIndexes.length) return;

    setMarkingUnavailable(true);
    try {
      let refundCreated = false;
      for (const itemIndex of uniqueIndexes) {
        const result = await markUnavailableAdminOrderItem(
          order.orderId,
          itemIndex,
          order.sellerId,
        );
        if (result?.refundCreated) refundCreated = true;
      }
      const refundHint = refundCreated
        ? ' To‘lov qaytarish sahifasiga tushdi.'
        : '';
      setUnavailableConfirmOpen(false);
      finishSuccess(
        `Mahsulot mavjud emas deb belgilandi (omborga qaytarilmadi).${refundHint}`,
      );
    } catch (error) {
      message.error(error?.message || 'Mavjud emas deb belgilab bo‘lmadi');
    } finally {
      setMarkingUnavailable(false);
    }
  };

  return (
    <div>
      <AdminOrderDetailModalContent
        order={order}
        selectableUnavailable={showUnavailable && isGroup}
        selectedItemIndexes={selectedItemIndexes}
        onToggleItemIndex={(itemIndex) => {
          setSelectedItemIndexes((prev) => toggleIndex(prev, itemIndex));
        }}
      />
      {showConfirm || showCollect ? (
        <div className="seller-order-detail-modal__actions">
          <div className="seller-order-detail-modal__secondary">
            {showCancelOrder ? (
              <button
                type="button"
                className="seller-order-detail-modal__cancel-order"
                disabled={actionsBusy}
                onClick={() => setCancelConfirmOpen(true)}
              >
                Buyurtmani bekor qilish
              </button>
            ) : null}
            {showUnavailable ? (
              <button
                type="button"
                className="seller-order-detail-modal__unavailable"
                disabled={actionsBusy || !unavailableReady}
                onClick={() => setUnavailableConfirmOpen(true)}
              >
                {markingUnavailable ? 'Belgilanmoqda...' : 'Mavjud emas'}
              </button>
            ) : null}
          </div>
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

      <MiniGlobalModal
        open={unavailableConfirmOpen}
        mode="confirm"
        permissionKey="markUnavailable"
        loading={markingUnavailable}
        onConfirm={handleMarkUnavailable}
        onCancel={() => {
          if (!markingUnavailable) setUnavailableConfirmOpen(false);
        }}
      />
    </div>
  );
}
