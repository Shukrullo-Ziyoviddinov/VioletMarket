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
  showCancelOrder = false,
  cancelling = false,
  onCancelOrder,
}) {
  const title = order?.orderCode
    ? `Buyurtma #${order.orderCode}`
    : 'Buyurtma tafsiloti';

  const busy = confirming || collecting || cancelling;
  const showActions = showConfirm || showCollect;

  return (
    <GlobalModal open={open} title={title} onClose={onClose}>
      <AdminOrderDetailModalContent order={order} />
      {showActions ? (
        <div className="seller-order-detail-modal__actions">
          {showCancelOrder ? (
            <button
              type="button"
              className="seller-order-detail-modal__cancel-order"
              disabled={busy}
              onClick={onCancelOrder}
            >
              {cancelling ? 'Bekor qilinmoqda...' : 'Buyurtmani bekor qilish'}
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
              {confirming ? 'Tasdiqlanmoqda...' : 'Buyurtmani tasdiqlash'}
            </button>
          ) : null}
          {showCollect ? (
            <button
              type="button"
              className="seller-order-detail-modal__confirm"
              disabled={busy}
              onClick={onCollect}
            >
              {collecting ? 'Yig‘ilmoqda...' : 'Yig‘ib olindi'}
            </button>
          ) : null}
        </div>
      ) : null}
    </GlobalModal>
  );
}
