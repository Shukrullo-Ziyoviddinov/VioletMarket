import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GlobalModal from '../../GlobalModal/GlobalModal';
import SellerOrderDetailModalContent from '../SellerOrderDetailModalContent/SellerOrderDetailModalContent';
import './SellerOrderDetailModal.css';

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

export default function SellerOrderDetailModal({
  open,
  order,
  onClose,
  showConfirm = false,
  confirming = false,
  onConfirm,
  showCollect = false,
  collecting = false,
  onCollect,
  showCancelOrder = false,
  cancelling = false,
  onCancelOrder,
  showUnavailable = false,
  markingUnavailable = false,
  onMarkUnavailable,
}) {
  const { t } = useTranslation();
  const title = order?.orderCode
    ? t('orders.modal.titleWithCode', { code: order.orderCode })
    : t('orders.modal.title');

  const orderUnits = useMemo(() => resolveOrderUnits(order), [order]);
  const isGroup =
    Boolean(order?.isGroup) ||
    orderUnits.length > 1 ||
    (Array.isArray(order?.itemIndexes) && order.itemIndexes.length > 1);

  const [selectedUnitKeys, setSelectedUnitKeys] = useState([]);

  useEffect(() => {
    if (!open) {
      setSelectedUnitKeys([]);
      return;
    }
    setSelectedUnitKeys(resolveDefaultUnitKeys(order));
  }, [open, order]);

  const busy = confirming || collecting || cancelling || markingUnavailable;
  const showActions = showConfirm || showCollect;
  const unavailableReady = useMemo(() => {
    if (!showUnavailable) return false;
    if (!isGroup) return true;
    return selectedUnitKeys.length > 0;
  }, [showUnavailable, isGroup, selectedUnitKeys]);

  const selectedUnits = useMemo(
    () => selectedUnitKeys.map(parseUnitKey),
    [selectedUnitKeys],
  );

  return (
    <GlobalModal open={open} title={title} onClose={onClose}>
      <SellerOrderDetailModalContent
        order={order}
        selectableUnavailable={showUnavailable && isGroup}
        selectedUnits={selectedUnits}
        onToggleUnit={(itemIndex, unitIndex) => {
          setSelectedUnitKeys((prev) =>
            toggleUnitKey(prev, itemIndex, unitIndex),
          );
        }}
      />
      {showActions ? (
        <div className="seller-order-detail-modal__actions">
          <div className="seller-order-detail-modal__secondary">
            {showCancelOrder ? (
              <button
                type="button"
                className="seller-order-detail-modal__cancel-order"
                disabled={busy}
                onClick={onCancelOrder}
              >
                {cancelling
                  ? t('orders.modal.cancelling')
                  : t('orders.modal.cancelOrder')}
              </button>
            ) : null}
            {showUnavailable ? (
              <button
                type="button"
                className="seller-order-detail-modal__unavailable"
                disabled={busy || !unavailableReady}
                onClick={() => {
                  const units = isGroup
                    ? selectedUnits
                    : [
                        {
                          itemIndex: Number(order?.itemIndex) || 0,
                          unitIndex: Number(order?.unitIndex) || 0,
                        },
                      ];
                  onMarkUnavailable?.(units);
                }}
              >
                {markingUnavailable
                  ? t('orders.modal.markingUnavailable', {
                      defaultValue: 'Belgilanmoqda...',
                    })
                  : t('orders.modal.markUnavailable', {
                      defaultValue: 'Mavjud emas',
                    })}
              </button>
            ) : null}
          </div>
          {showConfirm ? (
            <button
              type="button"
              className="seller-order-detail-modal__confirm"
              disabled={busy}
              onClick={onConfirm}
            >
              {confirming ? t('orders.modal.confirming') : t('orders.modal.confirm')}
            </button>
          ) : null}
          {showCollect ? (
            <button
              type="button"
              className="seller-order-detail-modal__confirm"
              disabled={busy}
              onClick={onCollect}
            >
              {collecting
                ? t('orders.modal.collecting')
                : t('orders.modal.confirmCollected')}
            </button>
          ) : null}
        </div>
      ) : null}
    </GlobalModal>
  );
}
