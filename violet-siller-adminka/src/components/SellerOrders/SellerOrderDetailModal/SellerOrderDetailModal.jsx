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
}) {
  const { t } = useTranslation();
  const title = order?.orderCode
    ? t('orders.modal.titleWithCode', { code: order.orderCode })
    : t('orders.modal.title');

  return (
    <GlobalModal open={open} title={title} onClose={onClose}>
      <SellerOrderDetailModalContent order={order} />
      {showConfirm ? (
        <div className="seller-order-detail-modal__actions">
          <button
            type="button"
            className="seller-order-detail-modal__confirm"
            disabled={confirming}
            onClick={onConfirm}
          >
            {confirming ? t('orders.modal.confirming') : t('orders.modal.confirm')}
          </button>
        </div>
      ) : null}
    </GlobalModal>
  );
}
