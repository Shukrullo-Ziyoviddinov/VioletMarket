import React from 'react';
import PaymentRequestTotalRequestsCard from '../PaymentRequestTotalRequestsCard/PaymentRequestTotalRequestsCard';
import PaymentRequestInProgressRequestsCard from '../PaymentRequestInProgressRequestsCard/PaymentRequestInProgressRequestsCard';
import PaymentRequestResolvedRequestsCard from '../PaymentRequestResolvedRequestsCard/PaymentRequestResolvedRequestsCard';
import PaymentRequestRejectedRequestsCard from '../PaymentRequestRejectedRequestsCard/PaymentRequestRejectedRequestsCard';
import './PaymentRequestStatsOverview.css';

export default function PaymentRequestStatsOverview() {
  return (
    <div className="payment-request-stats-overview">
      <PaymentRequestTotalRequestsCard />
      <PaymentRequestInProgressRequestsCard />
      <PaymentRequestResolvedRequestsCard />
      <PaymentRequestRejectedRequestsCard />
    </div>
  );
}
