import React from 'react';
import GlobalModal from '../../GlobalModal/GlobalModal';
import './SellerEarningsRejectionCommentModal.css';

export default function SellerEarningsRejectionCommentModal({
  open,
  comment = '',
  onClose,
}) {
  return (
    <GlobalModal open={open} title="Rad etish izohi" onClose={onClose}>
      <p className="seller-earnings-rejection-comment-modal__text">{comment}</p>
    </GlobalModal>
  );
}
