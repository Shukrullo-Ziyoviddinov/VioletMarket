import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Spin } from 'antd';
import { fetchCouriers } from '../../api/couriersAdminApi';
import CourierRequestsSection from '../../components/CourierRequestsSection/CourierRequestsSection';
import CouriersListSection from '../../components/CouriersListSection/CouriersListSection';
import { useGlobalLoader } from '../../context/GlobalLoaderContext';
import './CouriersPage.css';

export default function CouriersPage() {
  const { setGlobalLoading } = useGlobalLoader();
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isInitialLoadRef = useRef(true);

  const loadCouriers = useCallback(
    async (options = {}) => {
      const useGlobalLoader = options?.useGlobalLoader === true;
      setLoading(true);
      setError('');

      if (useGlobalLoader) {
        setGlobalLoading(true);
      }

      try {
        const data = await fetchCouriers();
        setPending(data.pending);
        setApproved(data.approved);
      } catch (err) {
        setError(err.message || "Ma'lumotlarni yuklab bo'lmadi");
      } finally {
        setLoading(false);
        if (useGlobalLoader) {
          setGlobalLoading(false);
        }
      }
    },
    [setGlobalLoading],
  );

  useEffect(() => {
    loadCouriers({ useGlobalLoader: isInitialLoadRef.current });
    isInitialLoadRef.current = false;
  }, [loadCouriers]);

  if (loading && !pending.length && !approved.length && !error) {
    return (
      <div className="couriers-page__loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <section className="couriers-page">
      {error ? <Alert type="error" message={error} showIcon className="couriers-page__alert" /> : null}

      <CourierRequestsSection
        applications={pending}
        loading={loading}
        onChanged={() => loadCouriers()}
      />

      <CouriersListSection
        couriers={approved}
        loading={loading}
        onChanged={() => loadCouriers()}
      />
    </section>
  );
}
