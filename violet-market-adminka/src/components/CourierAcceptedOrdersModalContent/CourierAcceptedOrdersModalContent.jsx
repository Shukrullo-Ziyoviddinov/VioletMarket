import React, { useEffect, useMemo, useState } from 'react';
import { Spin } from 'antd';
import { fetchCourierAcceptedOrders } from '../../api/couriersAdminApi';
import CourierAcceptedOrderCard from '../CourierAcceptedOrderCard/CourierAcceptedOrderCard';
import './CourierAcceptedOrdersModalContent.css';

function formatCourierName(courier) {
  const fullName = `${courier?.firstName || ''} ${courier?.lastName || ''}`.trim();
  return fullName || courier?.email || 'Kuryer';
}

export default function CourierAcceptedOrdersModalContent({
  visible = false,
  courierId = '',
}) {
  const [statusFilter, setStatusFilter] = useState('accepted');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [courier, setCourier] = useState(null);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalAccepted: 0,
    deliveredCount: 0,
    activeCount: 0,
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

  if (!visible) return null;

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
          <span className="courier-accepted-orders-modal__stat-label">Jarayonda</span>
          <strong className="courier-accepted-orders-modal__stat-value">
            {stats.activeCount || 0}
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

      {loading ? (
        <div className="courier-accepted-orders-modal__state">
          <Spin />
        </div>
      ) : null}

      {!loading && error ? (
        <p className="courier-accepted-orders-modal__error">{error}</p>
      ) : null}

      {!loading && !error && orders.length === 0 ? (
        <p className="courier-accepted-orders-modal__state">
          {statusFilter === 'delivered'
            ? 'Hozircha topshirilgan buyurtma topilmadi'
            : 'Hozircha qabul qilingan buyurtma topilmadi'}
        </p>
      ) : null}

      {!loading && !error && orders.length > 0 ? (
        <div className="courier-accepted-orders-modal__list">
          {orders.map((order) => (
            <CourierAcceptedOrderCard key={order.id} order={order} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
