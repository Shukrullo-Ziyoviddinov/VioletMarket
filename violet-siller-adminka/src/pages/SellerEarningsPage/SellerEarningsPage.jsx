import React, { useCallback, useEffect, useState } from 'react';
import { fetchSellerEarningsSummary } from '../../api/sellerEarningsApi';
import { useSellerAuth } from '../../context/SellerAuthContext';
import SellerEarningsBalanceOverview from '../../components/SellerEarnings/SellerEarningsBalanceOverview/SellerEarningsBalanceOverview';
import SellerEarningsSoldProductsSection from '../../components/SellerEarnings/SellerEarningsSoldProductsSection/SellerEarningsSoldProductsSection';
import './SellerEarningsPage.css';

const EMPTY_SUMMARY = {
  availableAmount: 0,
  inProcessAmount: 0,
  withdrawnAmount: 0,
};

export default function SellerEarningsPage() {
  const { token } = useSellerAuth();
  const [summary, setSummary] = useState(EMPTY_SUMMARY);

  const loadSummary = useCallback(async (nextSummary) => {
    if (nextSummary) {
      setSummary(nextSummary);
      return nextSummary;
    }

    if (!token) {
      setSummary(EMPTY_SUMMARY);
      return EMPTY_SUMMARY;
    }

    try {
      const data = await fetchSellerEarningsSummary(token);
      setSummary(data);
      return data;
    } catch {
      setSummary(EMPTY_SUMMARY);
      return EMPTY_SUMMARY;
    }
  }, [token]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return (
    <section className="seller-earnings-page">
      <SellerEarningsBalanceOverview summary={summary} />
      <SellerEarningsSoldProductsSection token={token} onSummaryChange={loadSummary} />
    </section>
  );
}
