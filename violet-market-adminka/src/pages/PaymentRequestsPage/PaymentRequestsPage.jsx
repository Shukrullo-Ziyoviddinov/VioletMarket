import React, { useState } from 'react';
import PaymentRequestStatsOverview from '../../components/PaymentRequest/PaymentRequestStatsOverview/PaymentRequestStatsOverview';
import PaymentRequestWorkspace from '../../components/PaymentRequest/PaymentRequestWorkspace/PaymentRequestWorkspace';
import './PaymentRequestsPage.css';

const EMPTY_STATS = {
  totalCount: 0,
  inProcessCount: 0,
  inProcessAmount: 0,
  withdrawnCount: 0,
  withdrawnProductCount: 0,
  withdrawnAmount: 0,
  rejectedCount: 0,
  rejectedUniqueProductCount: 0,
  rejectedAmount: 0,
};

export default function PaymentRequestsPage() {
  const [stats, setStats] = useState(EMPTY_STATS);

  return (
    <section className="payment-requests-page">
      <PaymentRequestStatsOverview stats={stats} />
      <PaymentRequestWorkspace onStatsChange={setStats} />
    </section>
  );
}
