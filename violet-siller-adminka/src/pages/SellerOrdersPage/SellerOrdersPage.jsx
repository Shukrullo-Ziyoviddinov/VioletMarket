import React, { useEffect, useMemo, useState } from 'react';
import SellerOrdersFilter from '../../components/SellerOrders/SellerOrdersFilter/SellerOrdersFilter';
import SellerOrdersWorkspace from '../../components/SellerOrders/SellerOrdersWorkspace/SellerOrdersWorkspace';
import { useSellerAuth } from '../../context/SellerAuthContext';
import { getSellerOrderFilters } from '../../utils/sellerPipeline';
import './SellerOrdersPage.css';

export default function SellerOrdersPage() {
  const { seller } = useSellerAuth();
  const filters = useMemo(
    () => getSellerOrderFilters(seller?.sellerCountry),
    [seller?.sellerCountry],
  );
  const [filter, setFilter] = useState(filters[0] || 'confirmation');

  useEffect(() => {
    if (!filters.includes(filter)) {
      setFilter(filters[0] || 'confirmation');
    }
  }, [filter, filters]);

  return (
    <section className="seller-orders-page">
      <SellerOrdersFilter
        value={filter}
        onChange={setFilter}
        filters={filters}
      />
      <SellerOrdersWorkspace filter={filter} />
    </section>
  );
}
