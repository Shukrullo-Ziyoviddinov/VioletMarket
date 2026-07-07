import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PaymentRequestWithdrawalsCard from './PaymentRequestWithdrawalsCard';

export default function PaymentRequestWithdrawalsSection({
  withdrawnCount = 0,
  withdrawnProductCount = 0,
  withdrawnAmount = 0,
}) {
  const navigate = useNavigate();

  const handleOpenPage = useCallback(() => {
    navigate('/withdrawals');
  }, [navigate]);

  return (
    <PaymentRequestWithdrawalsCard
      count={withdrawnCount}
      productCount={withdrawnProductCount}
      amount={withdrawnAmount}
      onClick={handleOpenPage}
    />
  );
}
