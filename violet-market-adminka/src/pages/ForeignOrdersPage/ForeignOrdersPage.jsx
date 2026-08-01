import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminOrdersFilter, {
  FOREIGN_UZB_ORDER_FILTERS,
} from '../../components/AdminOrders/AdminOrdersFilter/AdminOrdersFilter';
import AdminOrdersWorkspace from '../../components/AdminOrders/AdminOrdersWorkspace/AdminOrdersWorkspace';
import { fetchAdminOrderCounts } from '../../api/adminOrdersApi';
import '../OrdersPage/OrdersPage.css';

const EMPTY_COUNTS = {
  courier: 0,
  handed: 0,
  noAnswer: 0,
};

export default function ForeignOrdersPage() {
  const [filter, setFilter] = useState('courier');
  const [counts, setCounts] = useState(EMPTY_COUNTS);

  const loadCounts = useCallback(async () => {
    try {
      const data = await fetchAdminOrderCounts({ pipeline: 'foreign' });
      setCounts({
        courier: data.courier,
        handed: data.handed,
        noAnswer: data.noAnswer,
      });
    } catch {
      /* list xatosi workspace da ko'rsatiladi */
    }
  }, []);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  const displayCounts = useMemo(
    () => ({
      courier: counts.courier,
      handed: counts.handed,
      noAnswer: counts.noAnswer,
    }),
    [counts],
  );

  return (
    <section className="admin-orders-page">
      <div className="admin-orders-page__header">
        <h1 className="admin-orders-page__title">Xorij → UZB</h1>
        <p className="admin-orders-page__subtitle">
          Xorij sillerlar — logistica «To‘landi» dan keyin Toshkent omboridan UZB
          kuryerga topshirish, topshirilgan va javob bermadi. Bir mijoz / bir
          buyurtma mahsulotlari bitta blokda chiqadi va birga topshiriladi.
        </p>
      </div>
      <AdminOrdersFilter
        value={filter}
        onChange={setFilter}
        counts={displayCounts}
        filters={FOREIGN_UZB_ORDER_FILTERS}
      />
      <AdminOrdersWorkspace
        filter={filter}
        pipeline="foreign"
        allowHandoff
        showSellerCountry
        onStatusChanged={loadCounts}
      />
    </section>
  );
}
