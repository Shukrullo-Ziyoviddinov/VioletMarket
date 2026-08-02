import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GlobalModal from '../../GlobalModal/GlobalModal';
import SellerOrderDetailModalContent from '../SellerOrderDetailModalContent/SellerOrderDetailModalContent';
import './SellerOrderDetailModal.css';

function resolveDefaultItemIndex(order) {
  const indexes = Array.isArray(order?.itemIndexes)
    ? order.itemIndexes
    : [Number(order?.itemIndex) || 0];
  const unique = [...new Set(indexes.map((value) => Number(value) || 0))];
  return unique.length === 1 ? unique[0] : null;
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

  const [selectedItemIndex, setSelectedItemIndex] = useState(null);

  useEffect(() => {
    if (!open) {
      setSelectedItemIndex(null);
      return;
    }
    setSelectedItemIndex(resolveDefaultItemIndex(order));
  }, [open, order]);

  const busy = confirming || collecting || cancelling || markingUnavailable;
  const showActions = showConfirm || showCollect;
  const unavailableReady = useMemo(() => {
    if (!showUnavailable) return false;
    if (!isGroup) return true;
    return selectedItemIndex != null && Number.isInteger(Number(selectedItemIndex));
  }, [showUnavailable, isGroup, selectedItemIndex]);

  return (
    <GlobalModal open={open} title={title} onClose={onClose}>
      <SellerOrderDetailModalContent
        order={order}
        selectableUnavailable={showUnavailable && isGroup}
        selectedItemIndex={selectedItemIndex}
        onSelectItemIndex={setSelectedItemIndex}
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
                      ? Number(selectedItemIndex)
                      : Number(order?.itemIndex) || 0,
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
            {!showCancelOrder && !showUnavailable ? <span /> : null}
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
