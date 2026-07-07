import React from 'react';
import PaymentRequestWithdrawalWorkspace from '../../components/PaymentRequest/PaymentRequestWithdrawalWorkspace/PaymentRequestWithdrawalWorkspace';
import './WithdrawalPage.css';

export default function WithdrawalPage() {
  return (
    <section className="withdrawal-page">
      <div className="withdrawal-page__head">
        <h1>Yechilgan mahsulotlar</h1>
        <p>Barcha sotuvchilarning tasdiqlangan va yechilgan mahsulotlari</p>
      </div>
      <PaymentRequestWithdrawalWorkspace />
    </section>
  );
}
