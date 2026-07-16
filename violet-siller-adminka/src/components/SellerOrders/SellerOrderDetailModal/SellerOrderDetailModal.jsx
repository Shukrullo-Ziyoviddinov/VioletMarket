import React from 'react';
import { useTranslation } from 'react-i18next';
import GlobalModal from '../../GlobalModal/GlobalModal';
import SellerOrderDetailModalContent from '../SellerOrderDetailModalContent/SellerOrderDetailModalContent';

export default function SellerOrderDetailModal({ open, order, onClose }) {
  const { t } = useTranslation();
  const title = order?.orderCode
    ? t('orders.modal.titleWithCode', { code: order.orderCode })
    : t('orders.modal.title');

  return (
    <GlobalModal open={open} title={title} onClose={onClose}>
      <SellerOrderDetailModalContent order={order} />
    </GlobalModal>
  );
}
