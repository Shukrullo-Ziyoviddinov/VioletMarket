import React from 'react';
import PaymentRequestStatsOverview from '../../components/PaymentRequest/PaymentRequestStatsOverview/PaymentRequestStatsOverview';
import './PaymentRequestsPage.css';

export default function PaymentRequestsPage() {
  return (
    <section className="payment-requests-page">
      <PaymentRequestStatsOverview />
    </section>
  );
}
