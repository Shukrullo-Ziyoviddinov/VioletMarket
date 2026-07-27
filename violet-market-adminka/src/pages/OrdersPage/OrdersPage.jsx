import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminOrdersFilter from '../../components/AdminOrders/AdminOrdersFilter/AdminOrdersFilter';
import AdminOrdersWorkspace from '../../components/AdminOrders/AdminOrdersWorkspace/AdminOrdersWorkspace';
import { fetchAdminOrderCounts } from '../../api/adminOrdersApi';
import './OrdersPage.css';

const EMPTY_COUNTS = {
  confirmation: 0,
  collection: 0,
  courier: 0,
  handed: 0,
  noAnswer: 0,
};

const LOCAL_STAGE_FILTERS = new Set(['courier', 'handed', 'noAnswer']);

export default function OrdersPage() {
  const [filter, setFilter] = useState('confirmation');
  const [counts, setCounts] = useState(EMPTY_COUNTS);

  const loadCounts = useCallback(async () => {
    try {
      const [allCounts, localCounts] = await Promise.all([
        fetchAdminOrderCounts(),
        fetchAdminOrderCounts({ pipeline: 'local' }),
      ]);
      setCounts({
        confirmation: allCounts.confirmation,
        collection: allCounts.collection,
        courier: localCounts.courier,
        handed: localCounts.handed,
        noAnswer: localCounts.noAnswer,
      });
    } catch {
      /* list xatosi workspace da ko'rsatiladi */
    }
  }, []);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  const pipeline = useMemo(
    () => (LOCAL_STAGE_FILTERS.has(filter) ? 'local' : undefined),
    [filter],
  );

  return (
    <section className="admin-orders-page">
      <div className="admin-orders-page__header">
        <h1 className="admin-orders-page__title">Buyurtmalar</h1>
        <p className="admin-orders-page__subtitle">
          UZB (local) sillerlar buyurtmalari — holatni ko&apos;rish va o&apos;zgartirish.
          Xorij sillerlar uchun «Xorij → UZB» sahifasiga o&apos;ting.
        </p>
      </div>
      <AdminOrdersFilter value={filter} onChange={setFilter} counts={counts} />
      <AdminOrdersWorkspace
        filter={filter}
        pipeline={pipeline}
        onStatusChanged={loadCounts}
      />
    </section>
  );
}
