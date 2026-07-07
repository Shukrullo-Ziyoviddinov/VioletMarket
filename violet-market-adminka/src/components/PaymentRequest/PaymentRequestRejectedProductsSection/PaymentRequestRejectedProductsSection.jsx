import React, { useCallback } from 'react';
import { useAdminModal } from '../../../context/AdminModalContext';
import PaymentRequestRejectedProductsCard from './PaymentRequestRejectedProductsCard';

export default function PaymentRequestRejectedProductsSection({
  rejectedEventCount = 0,
  uniqueProductCount = 0,
}) {
  const { openAdminModal } = useAdminModal();

  const handleOpenModal = useCallback(() => {
    openAdminModal({
      key: 'payment-request-rejected-products',
      label: 'Rad etilgan mahsulotlar',
    });
  }, [openAdminModal]);

  return (
    <PaymentRequestRejectedProductsCard
      count={rejectedEventCount}
      uniqueCount={uniqueProductCount}
      onClick={handleOpenModal}
    />
  );
}
