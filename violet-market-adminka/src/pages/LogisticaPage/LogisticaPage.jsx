import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Spin } from 'antd';
import { fetchLogisticaProfiles } from '../../api/logisticaAdminApi';
import LogisticaApproved from '../../components/LogisticaInfo/LogisticaApproved';
import LogisticaRequests from '../../components/LogisticaInfo/LogisticaRequests';
import { useGlobalLoader } from '../../context/GlobalLoaderContext';
import '../../components/LogisticaInfo/LogisticaInfo.css';

export default function LogisticaPage() {
  const { setGlobalLoading } = useGlobalLoader();
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isInitialLoadRef = useRef(true);

  const loadProfiles = useCallback(
    async (options = {}) => {
      const useGlobalLoader = options?.useGlobalLoader === true;
      setLoading(true);
      setError('');

      if (useGlobalLoader) {
        setGlobalLoading(true);
      }

      try {
        const data = await fetchLogisticaProfiles();
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
    loadProfiles({ useGlobalLoader: isInitialLoadRef.current });
    isInitialLoadRef.current = false;
  }, [loadProfiles]);

  if (loading && !pending.length && !approved.length && !error) {
    return (
      <div className="logistica-page__loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <section className="logistica-page">
      {error ? (
        <Alert type="error" message={error} showIcon className="logistica-page__alert" />
      ) : null}

      <LogisticaRequests
        applications={pending}
        loading={loading}
        onChanged={() => loadProfiles()}
      />

      <LogisticaApproved
        profiles={approved}
        loading={loading}
        onChanged={() => loadProfiles()}
      />
    </section>
  );
}
