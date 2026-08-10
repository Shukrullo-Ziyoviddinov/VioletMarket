import React, { useEffect, useMemo, useState } from 'react';
import { Input, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { fetchCourierAcceptedOrders } from '../../api/couriersAdminApi';
import CourierAcceptedOrderCard from '../CourierAcceptedOrderCard/CourierAcceptedOrderCard';
import './CourierAcceptedOrdersModalContent.css';

function formatAmount(value) {
  return `${Math.round(Number(value) || 0).toLocaleString('uz-UZ')} so'm`;
}

function formatCourierName(courier) {
  const fullName = `${courier?.firstName || ''} ${courier?.lastName || ''}`.trim();
  return fullName || courier?.email || 'Kuryer';
}

function filterOrdersByCustomer(orders, query) {
  const normalized = String(query || '').trim().toLowerCase();
  if (!normalized) return orders;

  const queryDigits = normalized.replace(/\D/g, '');

  return orders.filter((order) => {
    const firstName = String(order?.customer?.firstName || '').toLowerCase();
    const lastName = String(order?.customer?.lastName || '').toLowerCase();
    const phone = String(order?.customer?.phone || '');
    const phoneDigits = phone.replace(/\D/g, '');

    if (queryDigits && phoneDigits.includes(queryDigits)) {
      return true;
    }

    const haystack = [firstName, lastName, phone.toLowerCase()].join(' ');
    return haystack.includes(normalized);
  });
}

export default function CourierAcceptedOrdersModalContent({
  visible = false,
  courierId = '',
}) {
  const [statusFilter, setStatusFilter] = useState('accepted');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [courier, setCourier] = useState(null);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalAccepted: 0,
    deliveredCount: 0,
    activeCount: 0,
    totalCourierIncome: 0,
  });

  useEffect(() => {
    if (!visible || !courierId) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    fetchCourierAcceptedOrders(courierId, statusFilter)
      .then((data) => {
        if (cancelled) return;
        setCourier(data?.courier || null);
        setOrders(Array.isArray(data?.orders) ? data.orders : []);
        setStats(
          data?.stats || {
            totalAccepted: 0,
            deliveredCount: 0,
            activeCount: 0,
            totalCourierIncome: 0,
          },
        );
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Buyurtmalarni yuklab bo‘lmadi');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courierId, statusFilter, visible]);

  const courierName = useMemo(() => formatCourierName(courier), [courier]);

  const handlePaymentUpdated = (updatedOrder) => {
    setOrders((prev) =>
      prev.map((item) => (item.id === updatedOrder.id ? updatedOrder : item)),
    );
    if (updatedOrder.status === 'delivered' || updatedOrder.status === 'returned') {
      setStats((prev) => {
        const prevPayment = orders.find((item) => item.id === updatedOrder.id)?.courierPayment || 0;
        const nextIncome =
          Math.max(0, Number(prev.totalCourierIncome) || 0) -
          Math.max(0, Number(prevPayment) || 0) +
          Math.max(0, Number(updatedOrder.courierPayment) || 0);
        return { ...prev, totalCourierIncome: nextIncome };
      });
    }
  };

  const handleReassigned = (assignmentIds) => {
    const ids = new Set(
      (Array.isArray(assignmentIds) ? assignmentIds : [assignmentIds]).map(String),
    );
    setOrders((prev) =>
      prev.filter((item) => {
        const siblingIds = Array.isArray(item.siblingIds)
          ? item.siblingIds.map(String)
          : [String(item.id)];
        return !siblingIds.some((id) => ids.has(id));
      }),
    );
    setStats((prev) => ({
      ...prev,
      activeCount: Math.max(
        0,
        (Number(prev.activeCount) || 0) - Math.max(1, ids.size),
      ),
    }));
  };

  const filteredOrders = useMemo(
    () => filterOrdersByCustomer(orders, searchQuery),
    [orders, searchQuery],
  );

  if (!visible) return null;

  const emptyMessage = searchQuery.trim()
    ? 'Qidiruv bo‘yicha mijoz topilmadi'
    : statusFilter === 'delivered'
      ? 'Hozircha topshirilgan buyurtma topilmadi'
      : 'Hozircha qabul qilingan buyurtma topilmadi';

  return (
    <div className="courier-accepted-orders-modal">
      <div className="courier-accepted-orders-modal__head">
        <h3 className="courier-accepted-orders-modal__title">{courierName}</h3>
        <p className="courier-accepted-orders-modal__subtitle">
          Kuryer qabul qilgan buyurtmalar ro‘yxati
        </p>
      </div>

      <div className="courier-accepted-orders-modal__stats">
        <div className="courier-accepted-orders-modal__stat-card">
          <span className="courier-accepted-orders-modal__stat-label">Jami qabul</span>
          <strong className="courier-accepted-orders-modal__stat-value">
            {stats.totalAccepted || 0}
          </strong>
        </div>
        <div className="courier-accepted-orders-modal__stat-card">
          <span className="courier-accepted-orders-modal__stat-label">Topshirilgan</span>
          <strong className="courier-accepted-orders-modal__stat-value">
            {stats.deliveredCount || 0}
          </strong>
        </div>
        <div className="courier-accepted-orders-modal__stat-card">
          <span className="courier-accepted-orders-modal__stat-label">Daromat</span>
          <strong className="courier-accepted-orders-modal__stat-value">
            {formatAmount(stats.totalCourierIncome || 0)}
          </strong>
        </div>
      </div>

      <div className="courier-accepted-orders-modal__filters">
        <button
          type="button"
          className={`courier-accepted-orders-modal__filter-btn${
            statusFilter === 'accepted'
              ? ' courier-accepted-orders-modal__filter-btn--active'
              : ''
          }`}
          onClick={() => setStatusFilter('accepted')}
        >
          Qabul qilingan
        </button>
        <button
          type="button"
          className={`courier-accepted-orders-modal__filter-btn${
            statusFilter === 'delivered'
              ? ' courier-accepted-orders-modal__filter-btn--active'
              : ''
          }`}
          onClick={() => setStatusFilter('delivered')}
        >
          Topshirilgan
        </button>
      </div>

      <Input
        allowClear
        className="courier-accepted-orders-modal__search"
        placeholder="Mijoz ismi, familiyasi yoki telefon raqami"
        prefix={<SearchOutlined />}
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
      />

      {loading ? (
        <div className="courier-accepted-orders-modal__state">
          <Spin />
        </div>
      ) : null}

      {!loading && error ? (
        <p className="courier-accepted-orders-modal__error">{error}</p>
      ) : null}

      {!loading && !error && filteredOrders.length === 0 ? (
        <p className="courier-accepted-orders-modal__state">{emptyMessage}</p>
      ) : null}

      {!loading && !error && filteredOrders.length > 0 ? (
        <div className="courier-accepted-orders-modal__list">
          {filteredOrders.map((order) => (
            <CourierAcceptedOrderCard
              key={order.id}
              order={order}
              onPaymentUpdated={handlePaymentUpdated}
              onReassigned={handleReassigned}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
