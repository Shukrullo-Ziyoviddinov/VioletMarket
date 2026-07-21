import React, { useCallback, useEffect, useState } from 'react';
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

export default function OrdersPage() {
  const [filter, setFilter] = useState('confirmation');
  const [counts, setCounts] = useState(EMPTY_COUNTS);

  const loadCounts = useCallback(async () => {
    try {
      const data = await fetchAdminOrderCounts();
      setCounts(data);
    } catch {
      /* list xatosi workspace da ko'rsatiladi */
    }
  }, []);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  return (
    <section className="admin-orders-page">
      <div className="admin-orders-page__header">
        <h1 className="admin-orders-page__title">Buyurtmalar</h1>
        <p className="admin-orders-page__subtitle">
          Barcha sillerlar buyurtmalari — qaysi mahsulot, qaysi siller va qaysi
          jarayonda ekanligi. Holatni siller o‘rnidan ham o‘zgartirish mumkin.
        </p>
      </div>
      <AdminOrdersFilter value={filter} onChange={setFilter} counts={counts} />
      <AdminOrdersWorkspace filter={filter} onStatusChanged={loadCounts} />
    </section>
  );
}
