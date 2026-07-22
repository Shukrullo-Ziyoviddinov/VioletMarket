import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Segmented, Spin } from 'antd';
import { fetchReturnRequests } from '../../api/returnRequestAdminApi';
import ReturnRequestsList from '../../components/ReturnRequestsList/ReturnRequestsList';
import ReturnRequestApproveModal from '../../components/ReturnRequestApproveModal/ReturnRequestApproveModal';
import ReturnRequestRejectModal from '../../components/ReturnRequestRejectModal/ReturnRequestRejectModal';
import { useGlobalLoader } from '../../context/GlobalLoaderContext';
import './ReturnRequestsPage.css';

const STATUS_OPTIONS = [
  { label: 'Kutilmoqda', value: 'pending' },
  { label: 'Tasdiqlangan', value: 'approved' },
  { label: 'Rad etilgan', value: 'rejected' },
  { label: 'Barchasi', value: 'all' },
];

export default function ReturnRequestsPage() {
  const { setGlobalLoading } = useGlobalLoader();
  const [status, setStatus] = useState('pending');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [approveItem, setApproveItem] = useState(null);
  const [rejectItem, setRejectItem] = useState(null);
  const isInitialLoadRef = useRef(true);

  const load = useCallback(
    async (options = {}) => {
      const useGlobal = options?.useGlobalLoader === true;
      setLoading(true);
      setError('');
      if (useGlobal) setGlobalLoading(true);
      try {
        const data = await fetchReturnRequests(status);
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (err) {
        setError(err.message || "Ma'lumotlarni yuklab bo'lmadi");
        setItems([]);
      } finally {
        setLoading(false);
        if (useGlobal) setGlobalLoading(false);
      }
    },
    [setGlobalLoading, status],
  );

  useEffect(() => {
    load({ useGlobalLoader: isInitialLoadRef.current });
    isInitialLoadRef.current = false;
  }, [load]);

  return (
    <section className="return-requests-page">
      <header className="return-requests-page__header">
        <div>
          <h1 className="return-requests-page__title">Qaytarish so‘rovlari</h1>
          <p className="return-requests-page__subtitle">
            Kuryer Ajdaniya so‘rovlarini tasdiqlang yoki rad eting. Tasdiqda
            «Javob bermadi» yoki «Qaytarish» turini belgilaysiz.
          </p>
        </div>
        <Segmented
          options={STATUS_OPTIONS}
          value={status}
          onChange={setStatus}
        />
      </header>

      {error ? (
        <Alert type="error" message={error} showIcon className="return-requests-page__alert" />
      ) : null}

      {loading && items.length === 0 && !error ? (
        <div className="return-requests-page__loading">
          <Spin size="large" />
        </div>
      ) : (
        <ReturnRequestsList
          items={items}
          loading={loading}
          onApprove={setApproveItem}
          onReject={setRejectItem}
        />
      )}

      <ReturnRequestApproveModal
        open={Boolean(approveItem)}
        item={approveItem}
        onClose={() => setApproveItem(null)}
        onSuccess={() => load()}
      />
      <ReturnRequestRejectModal
        open={Boolean(rejectItem)}
        item={rejectItem}
        onClose={() => setRejectItem(null)}
        onSuccess={() => load()}
      />
    </section>
  );
}
