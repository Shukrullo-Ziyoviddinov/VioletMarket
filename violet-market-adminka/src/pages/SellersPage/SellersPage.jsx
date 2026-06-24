import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Spin } from 'antd';
import { fetchSellerApplications } from '../../api/sellersAdminApi';
import ApprovedSellersSection from '../../components/ApprovedSellersSection/ApprovedSellersSection';
import SellerApplicationsSection from '../../components/SellerApplicationsSection/SellerApplicationsSection';
import { useGlobalLoader } from '../../context/GlobalLoaderContext';
import './SellersPage.css';

export default function SellersPage() {
  const { setGlobalLoading } = useGlobalLoader();
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isInitialLoadRef = useRef(true);

  const loadApplications = useCallback(async (options = {}) => {
    const useGlobalLoader = options?.useGlobalLoader === true;
    setLoading(true);
    setError('');

    if (useGlobalLoader) {
      setGlobalLoading(true);
    }

    try {
      const data = await fetchSellerApplications();
      setPending(data.pending);
      setApproved(data.approved);
    } catch (err) {
      setError(err.message || 'Ma\'lumotlarni yuklab bo\'lmadi');
    } finally {
      setLoading(false);
      if (useGlobalLoader) {
        setGlobalLoading(false);
      }
    }
  }, [setGlobalLoading]);

  useEffect(() => {
    loadApplications({ useGlobalLoader: isInitialLoadRef.current });
    isInitialLoadRef.current = false;
  }, [loadApplications]);

  if (loading && !pending.length && !approved.length && !error) {
    return (
      <div className="sellers-page__loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <section className="sellers-page">
      {error ? <Alert type="error" message={error} showIcon className="sellers-page__alert" /> : null}

      <SellerApplicationsSection
        applications={pending}
        loading={loading}
        onChanged={() => loadApplications()}
      />

      <ApprovedSellersSection sellers={approved} loading={loading} />
    </section>
  );
}
