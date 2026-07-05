import React from 'react';
import SellerEarningsAvailableBalanceCard from '../SellerEarningsAvailableBalanceCard/SellerEarningsAvailableBalanceCard';
import SellerEarningsInProcessBalanceCard from '../SellerEarningsInProcessBalanceCard/SellerEarningsInProcessBalanceCard';
import SellerEarningsWithdrawnBalanceCard from '../SellerEarningsWithdrawnBalanceCard/SellerEarningsWithdrawnBalanceCard';
import './SellerEarningsBalanceOverview.css';

export default function SellerEarningsBalanceOverview({ summary = {} }) {
  return (
    <div className="seller-earnings-balance-overview">
      <SellerEarningsAvailableBalanceCard amount={summary.availableAmount} />
      <SellerEarningsInProcessBalanceCard amount={summary.inProcessAmount} />
      <SellerEarningsWithdrawnBalanceCard amount={summary.withdrawnAmount} />
    </div>
  );
}
