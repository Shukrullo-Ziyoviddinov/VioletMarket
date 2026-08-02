import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GlobalModal from '../../GlobalModal/GlobalModal';
import SellerOrderDetailModalContent from '../SellerOrderDetailModalContent/SellerOrderDetailModalContent';
import './SellerOrderDetailModal.css';

function resolveDefaultItemIndexes(order) {
  const indexes = Array.isArray(order?.itemIndexes)
    ? order.itemIndexes
    : [Number(order?.itemIndex) || 0];
  const unique = [...new Set(indexes.map((value) => Number(value) || 0))];
  return unique.length === 1 ? unique : [];
}

function toggleIndex(list, index) {
  const value = Number(index);
  if (!Number.isInteger(value) || value < 0) return list;
  if (list.includes(value)) return list.filter((item) => item !== value);
  return [...list, value];
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

  const isGroup =
    Boolean(order?.isGroup) ||
    (Array.isArray(order?.items) && order.items.length > 1) ||
    (Array.isArray(order?.itemIndexes) && order.itemIndexes.length > 1);

  const [selectedItemIndexes, setSelectedItemIndexes] = useState([]);

  useEffect(() => {
    if (!open) {
      setSelectedItemIndexes([]);
      return;
    }
    setSelectedItemIndexes(resolveDefaultItemIndexes(order));
  }, [open, order]);

  const busy = confirming || collecting || cancelling || markingUnavailable;
  const showActions = showConfirm || showCollect;
  const unavailableReady = useMemo(() => {
    if (!showUnavailable) return false;
    if (!isGroup) return true;
    return selectedItemIndexes.length > 0;
  }, [showUnavailable, isGroup, selectedItemIndexes]);

  return (
    <GlobalModal open={open} title={title} onClose={onClose}>
      <SellerOrderDetailModalContent
        order={order}
        selectableUnavailable={showUnavailable && isGroup}
        selectedItemIndexes={selectedItemIndexes}
        onToggleItemIndex={(itemIndex) => {
          setSelectedItemIndexes((prev) => toggleIndex(prev, itemIndex));
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
                onClick={() =>
                  onMarkUnavailable?.(
                    isGroup
                      ? selectedItemIndexes
                      : [Number(order?.itemIndex) || 0],
                  )
                }
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
