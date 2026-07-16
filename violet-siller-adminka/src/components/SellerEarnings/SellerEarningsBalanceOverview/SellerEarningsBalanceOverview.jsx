import React, { useState } from 'react';
import { useSellerAuth } from '../../../context/SellerAuthContext';
import { SELLER_EARNINGS_SOLD_PRODUCT_STATUS } from '../../../utils/sellerEarningsDisplay';
import SellerEarningsAvailableBalanceCard from '../SellerEarningsAvailableBalanceCard/SellerEarningsAvailableBalanceCard';
import SellerEarningsInProcessBalanceCard from '../SellerEarningsInProcessBalanceCard/SellerEarningsInProcessBalanceCard';
import SellerEarningsWithdrawnBalanceCard from '../SellerEarningsWithdrawnBalanceCard/SellerEarningsWithdrawnBalanceCard';
import SellerEarningsStatusProductsModal from '../SellerEarningsStatusProductsModal/SellerEarningsStatusProductsModal';
import './SellerEarningsBalanceOverview.css';

export default function SellerEarningsBalanceOverview({ summary = {} }) {
  const { token } = useSellerAuth();
  const [statusModal, setStatusModal] = useState(null);

  return (
    <>
      <div className="seller-earnings-balance-overview">
        <SellerEarningsAvailableBalanceCard
          amount={summary.availableAmount}
          onAction={() => setStatusModal(SELLER_EARNINGS_SOLD_PRODUCT_STATUS.AVAILABLE)}
        />
        <SellerEarningsInProcessBalanceCard
          amount={summary.inProcessAmount}
          onAction={() => setStatusModal(SELLER_EARNINGS_SOLD_PRODUCT_STATUS.IN_PROCESS)}
        />
        <SellerEarningsWithdrawnBalanceCard amount={summary.withdrawnAmount} />
      </div>

      <SellerEarningsStatusProductsModal
        open={Boolean(statusModal)}
        token={token}
        status={statusModal}
        onClose={() => setStatusModal(null)}
      />
    </>
  );
}
