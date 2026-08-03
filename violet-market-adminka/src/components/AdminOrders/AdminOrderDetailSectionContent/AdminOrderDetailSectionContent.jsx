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

function unitKey(itemIndex, unitIndex) {
  return `${Number(itemIndex) || 0}:${Number(unitIndex) || 0}`;
}

function parseUnitKey(key) {
  const [itemPart, unitPart] = String(key || '').split(':');
  return {
    itemIndex: Number(itemPart) || 0,
    unitIndex: Number(unitPart) || 0,
  };
}

function resolveItemIndexes(order) {
  if (Array.isArray(order?.itemIndexes) && order.itemIndexes.length) {
    return [...new Set(order.itemIndexes.map((value) => Number(value) || 0))];
  }
  return [Number(order?.itemIndex) || 0];
}

function resolveOrderUnits(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  if (items.length) {
    return items.map((item, index) => ({
      itemIndex: Number.isInteger(Number(item?.itemIndex))
        ? Number(item.itemIndex)
        : index,
      unitIndex: Number(item?.unitIndex) || 0,
    }));
  }
  if (!order) return [];
  return [
    {
      itemIndex: Number(order.itemIndex) || 0,
      unitIndex: Number(order.unitIndex) || 0,
    },
  ];
}

function resolveDefaultUnitKeys(order) {
  const units = resolveOrderUnits(order);
  if (units.length === 1) {
    return [unitKey(units[0].itemIndex, units[0].unitIndex)];
  }
  return [];
}

function toggleUnitKey(list, itemIndex, unitIndex) {
  const key = unitKey(itemIndex, unitIndex);
  if (list.includes(key)) return list.filter((row) => row !== key);
  return [...list, key];
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
  const [selectedUnitKeys, setSelectedUnitKeys] = useState([]);

  const itemIndexes = resolveItemIndexes(order);
  const orderUnits = useMemo(() => resolveOrderUnits(order), [order]);
  const isGroup =
    Boolean(order?.isGroup) ||
    orderUnits.length > 1 ||
    itemIndexes.length > 1;
  const showConfirm =
    mode === 'confirm' &&
    (isGroup || order?.trackingStatus === 'accepted');
  const showCollect =
    mode === 'collect' &&
    (isGroup || order?.trackingStatus === 'seller_confirmed');
  const showCancelOrder = showConfirm || showCollect;
  const showUnavailable = showConfirm || showCollect;
  const actionsBusy = busy || cancelling || markingUnavailable;

  const selectedUnits = useMemo(
    () => selectedUnitKeys.map(parseUnitKey),
    [selectedUnitKeys],
  );

  const unavailableReady = useMemo(() => {
    if (!showUnavailable) return false;
    if (!isGroup) return true;
    return selectedUnitKeys.length > 0;
  }, [showUnavailable, isGroup, selectedUnitKeys]);

  useEffect(() => {
    if (!visible) {
      setSelectedUnitKeys([]);
      setCancelConfirmOpen(false);
      setUnavailableConfirmOpen(false);
      return;
    }
    setSelectedUnitKeys(resolveDefaultUnitKeys(order));
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
    const units = isGroup
      ? selectedUnits
      : [
          {
            itemIndex: Number(order.itemIndex) || 0,
            unitIndex: Number(order.unitIndex) || 0,
          },
        ];

    const byItemIndex = new Map();
    for (const unit of units) {
      const itemIndex = Number(unit.itemIndex);
      const unitIndex = Number(unit.unitIndex) || 0;
      if (!Number.isInteger(itemIndex) || itemIndex < 0) continue;
      if (!byItemIndex.has(itemIndex)) byItemIndex.set(itemIndex, []);
      byItemIndex.get(itemIndex).push(unitIndex);
    }
    if (!byItemIndex.size) return;

    setMarkingUnavailable(true);
    try {
      let refundCreated = false;
      for (const [itemIndex, unitIndexes] of byItemIndex.entries()) {
        const result = await markUnavailableAdminOrderItem(
          order.orderId,
          itemIndex,
          order.sellerId,
          { unitIndexes },
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
        selectedUnits={selectedUnits}
        onToggleUnit={(itemIndex, unitIndex) => {
          setSelectedUnitKeys((prev) =>
            toggleUnitKey(prev, itemIndex, unitIndex),
          );
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
