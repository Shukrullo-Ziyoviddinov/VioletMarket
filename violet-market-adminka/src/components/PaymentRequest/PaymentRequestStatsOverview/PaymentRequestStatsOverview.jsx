import React from 'react';
import PaymentRequestTotalRequestsCard from '../PaymentRequestTotalRequestsCard/PaymentRequestTotalRequestsCard';
import PaymentRequestInProgressRequestsCard from '../PaymentRequestInProgressRequestsCard/PaymentRequestInProgressRequestsCard';
import PaymentRequestResolvedRequestsCard from '../PaymentRequestResolvedRequestsCard/PaymentRequestResolvedRequestsCard';
import PaymentRequestRejectedProductsSection from '../PaymentRequestRejectedProductsSection/PaymentRequestRejectedProductsSection';
import './PaymentRequestStatsOverview.css';

export default function PaymentRequestStatsOverview({ stats = {} }) {
  return (
    <div className="payment-request-stats-overview">
      <PaymentRequestTotalRequestsCard count={stats.totalCount} />
      <PaymentRequestInProgressRequestsCard
        count={stats.inProcessCount}
        amount={stats.inProcessAmount}
      />
      <PaymentRequestResolvedRequestsCard
        count={stats.withdrawnCount}
        amount={stats.withdrawnAmount}
      />
      <PaymentRequestRejectedProductsSection
        rejectedEventCount={stats.rejectedCount}
        uniqueProductCount={stats.rejectedUniqueProductCount}
      />
    </div>
  );
}
