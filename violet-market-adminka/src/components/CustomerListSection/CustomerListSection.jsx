import React, { useCallback, useEffect, useState } from 'react';
import { Empty, Spin } from 'antd';
import { fetchRegisteredCustomers } from '../../api/customerListAdminApi';
import './CustomerListSection.css';

function shortenCustomerId(id) {
  const raw = String(id || '');
  if (raw.length <= 10) return raw;
  return `${raw.slice(0, 8)}...`;
}

export default function CustomerListSection() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const payload = await fetchRegisteredCustomers();
      setCustomers(payload.customers);
    } catch (err) {
      setCustomers([]);
      setError(err.message || "Mijozlar ro'yxatini yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  return (
    <section className="customer-list-section">
      <h2 className="customer-list-section__title">Mijozlar ro&apos;yxati</h2>

      <div className="customer-list-section__table">
        <div className="customer-list-section__row customer-list-section__row--head">
          <span>Mijoz ID</span>
          <span>Ism</span>
          <span>Familiya</span>
          <span>Sana</span>
          <span>Oxirgi faollik</span>
        </div>

        {loading ? (
          <div className="customer-list-section__state">
            <Spin />
          </div>
        ) : null}

        {!loading && error ? (
          <div className="customer-list-section__state customer-list-section__state--error">{error}</div>
        ) : null}

        {!loading && !error && customers.length === 0 ? (
          <div className="customer-list-section__state">
            <Empty description="Ro'yxatdan o'tgan mijozlar topilmadi" />
          </div>
        ) : null}

        {!loading && !error
          ? customers.map((customer) => (
            <div key={customer.id} className="customer-list-section__row">
              <span className="customer-list-section__id" title={customer.id}>
                {shortenCustomerId(customer.id)}
              </span>
              <span>{customer.firstName}</span>
              <span>{customer.lastName}</span>
              <span>{customer.registeredAtLabel}</span>
              <span>{customer.lastActiveAtLabel || "Ma'lumot yo'q"}</span>
            </div>
          ))
          : null}
      </div>
    </section>
  );
}
