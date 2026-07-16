import React, { useState } from 'react';
import SellerOrdersFilter from '../../components/SellerOrders/SellerOrdersFilter/SellerOrdersFilter';
import SellerOrdersWorkspace from '../../components/SellerOrders/SellerOrdersWorkspace/SellerOrdersWorkspace';
import './SellerOrdersPage.css';

export default function SellerOrdersPage() {
  const [filter, setFilter] = useState('confirmation');

  return (
    <section className="seller-orders-page">
      <SellerOrdersFilter value={filter} onChange={setFilter} />
      <SellerOrdersWorkspace filter={filter} />
    </section>
  );
}
