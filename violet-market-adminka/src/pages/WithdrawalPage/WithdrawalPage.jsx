import React from 'react';
import PaymentRequestWithdrawalWorkspace from '../../components/PaymentRequest/PaymentRequestWithdrawalWorkspace/PaymentRequestWithdrawalWorkspace';
import './WithdrawalPage.css';

export default function WithdrawalPage() {
  return (
    <section className="withdrawal-page">
      <PaymentRequestWithdrawalWorkspace />
    </section>
  );
}
