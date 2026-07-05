import React from 'react';
import SellerEarningsAvailableBalanceCard from '../SellerEarningsAvailableBalanceCard/SellerEarningsAvailableBalanceCard';
import SellerEarningsInProcessBalanceCard from '../SellerEarningsInProcessBalanceCard/SellerEarningsInProcessBalanceCard';
import SellerEarningsWithdrawnBalanceCard from '../SellerEarningsWithdrawnBalanceCard/SellerEarningsWithdrawnBalanceCard';
import './SellerEarningsBalanceOverview.css';

export default function SellerEarningsBalanceOverview() {
  return (
    <div className="seller-earnings-balance-overview">
      <SellerEarningsAvailableBalanceCard />
      <SellerEarningsInProcessBalanceCard />
      <SellerEarningsWithdrawnBalanceCard />
    </div>
  );
}
