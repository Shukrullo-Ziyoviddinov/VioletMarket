import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Empty, Input, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { fetchRegisteredCustomers } from '../../api/customerListAdminApi';
import { filterCustomersBySearch } from './customerListFuzzySearch';
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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = useMemo(
    () => filterCustomersBySearch(customers, searchQuery),
    [customers, searchQuery],
  );

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
      <div className="customer-list-section__header">
        <h2 className="customer-list-section__title">Mijozlar ro&apos;yxati</h2>
        <Input
          allowClear
          className="customer-list-section__search"
          placeholder="Ism, familiya yoki nomer"
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>

      <div className="customer-list-section__table">
        <div className="customer-list-section__row customer-list-section__row--head">
          <span>Mijoz ID</span>
          <span>Ism</span>
          <span>Familiya</span>
          <span>Nomer</span>
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

        {!loading && !error && customers.length > 0 && filteredCustomers.length === 0 ? (
          <div className="customer-list-section__state">
            <Empty description="Qidiruv bo'yicha mijoz topilmadi" />
          </div>
        ) : null}

        {!loading && !error
          ? filteredCustomers.map((customer) => (
            <div key={customer.id} className="customer-list-section__row">
              <span className="customer-list-section__id" title={customer.id}>
                {shortenCustomerId(customer.id)}
              </span>
              <span>{customer.firstName}</span>
              <span>{customer.lastName}</span>
              <span>{customer.phone}</span>
              <span>{customer.registeredAtLabel}</span>
              <span>{customer.lastActiveAtLabel || "Ma'lumot yo'q"}</span>
            </div>
          ))
          : null}
      </div>
    </section>
  );
}
