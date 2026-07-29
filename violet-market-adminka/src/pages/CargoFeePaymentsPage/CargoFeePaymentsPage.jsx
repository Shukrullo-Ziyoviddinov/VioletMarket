import React, { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import { fetchAdminCargoFeePayments } from '../../api/adminCargoFeePaymentsApi';
import CargoFeePaymentFilters from '../../components/CargoFeePayments/CargoFeePaymentFilters/CargoFeePaymentFilters';
import CargoFeePaymentList from '../../components/CargoFeePayments/CargoFeePaymentList/CargoFeePaymentList';
import CargoFeePaymentConfirmModal from '../../components/CargoFeePayments/CargoFeePaymentConfirmModal/CargoFeePaymentConfirmModal';
import './CargoFeePaymentsPage.css';

export default function CargoFeePaymentsPage() {
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState(null);

  const load = useCallback(async (nextFilter = filter) => {
    setLoading(true);
    try {
      const data = await fetchAdminCargoFeePayments({
        filter: nextFilter,
        page: 1,
        limit: 100,
      });
      setItems(data.items);
    } catch (error) {
      setItems([]);
      message.error(error?.message || 'So‘rovlarni yuklab bo‘lmadi');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load(filter);
  }, [filter, load]);

  return (
    <section className="cargo-fee-payments-page">
      <div className="cargo-fee-payments-page__header">
        <h1>Cargo to‘lov so‘rovlari</h1>
        <p>
          Logistica yuborgan og‘irlik/summa so‘rovlari. Mijoz to‘lagandan keyin
          tasdiqlang — shundan so‘ng logistica «To‘landi» bosadi.
        </p>
      </div>

      <CargoFeePaymentFilters value={filter} onChange={setFilter} />

      <CargoFeePaymentList
        items={items}
        loading={loading}
        onOpen={setActiveItem}
      />

      <CargoFeePaymentConfirmModal
        open={Boolean(activeItem)}
        item={activeItem}
        onClose={() => setActiveItem(null)}
        onConfirmed={(updated) => {
          setItems((prev) =>
            prev.map((row) => (row.id === updated.id ? updated : row)),
          );
          message.success('To‘lov tasdiqlandi');
          if (filter === 'unpaid') {
            setItems((prev) => prev.filter((row) => row.id !== updated.id));
          }
        }}
      />
    </section>
  );
}
