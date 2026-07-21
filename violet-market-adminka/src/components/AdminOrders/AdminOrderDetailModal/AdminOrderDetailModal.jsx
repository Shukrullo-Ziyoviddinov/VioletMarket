import React from 'react';
import GlobalModal from '../../GlobalModal/GlobalModal';
import AdminOrderDetailModalContent from '../AdminOrderDetailModalContent/AdminOrderDetailModalContent';
import './AdminOrderDetailModal.css';

export default function AdminOrderDetailModal({
  open,
  order,
  onClose,
  showConfirm = false,
  confirming = false,
  onConfirm,
  showCollect = false,
  collecting = false,
  onCollect,
}) {
  const title = order?.orderCode
    ? `Buyurtma #${order.orderCode}`
    : 'Buyurtma tafsiloti';

  return (
    <GlobalModal open={open} title={title} onClose={onClose}>
      <AdminOrderDetailModalContent order={order} />
      {showConfirm ? (
        <div className="seller-order-detail-modal__actions">
          <button
            type="button"
            className="seller-order-detail-modal__confirm"
            disabled={confirming}
            onClick={onConfirm}
          >
            {confirming ? 'Tasdiqlanmoqda...' : 'Buyurtmani tasdiqlash'}
          </button>
        </div>
      ) : null}
      {showCollect ? (
        <div className="seller-order-detail-modal__actions">
          <button
            type="button"
            className="seller-order-detail-modal__confirm"
            disabled={collecting}
            onClick={onCollect}
          >
            {collecting ? 'Yig‘ilmoqda...' : 'Yig‘ib olindi'}
          </button>
        </div>
      ) : null}
    </GlobalModal>
  );
}
