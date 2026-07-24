import React from 'react';
import { useTranslation } from 'react-i18next';
import GlobalModal from '../../GlobalModal/GlobalModal';
import SellerOrderDetailModalContent from '../SellerOrderDetailModalContent/SellerOrderDetailModalContent';
import './SellerOrderDetailModal.css';

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
}) {
  const { t } = useTranslation();
  const title = order?.orderCode
    ? t('orders.modal.titleWithCode', { code: order.orderCode })
    : t('orders.modal.title');

  const busy = confirming || collecting || cancelling;
  const showActions = showConfirm || showCollect;

  return (
    <GlobalModal open={open} title={title} onClose={onClose}>
      <SellerOrderDetailModalContent order={order} />
      {showActions ? (
        <div className="seller-order-detail-modal__actions">
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
          ) : (
            <span />
          )}
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
