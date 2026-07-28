import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Input, Segmented, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
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
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [approveItem, setApproveItem] = useState(null);
  const [rejectItem, setRejectItem] = useState(null);
  const isInitialLoadRef = useRef(true);
  const searchTimerRef = useRef(null);

  const load = useCallback(
    async (options = {}) => {
      const useGlobal = options?.useGlobalLoader === true;
      setLoading(true);
      setError('');
      if (useGlobal) setGlobalLoading(true);
      try {
        const data = await fetchReturnRequests(status, barcodeQuery);
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (err) {
        setError(err.message || "Ma'lumotlarni yuklab bo'lmadi");
        setItems([]);
      } finally {
        setLoading(false);
        if (useGlobal) setGlobalLoading(false);
      }
    },
    [barcodeQuery, setGlobalLoading, status],
  );

  useEffect(() => {
    load({ useGlobalLoader: isInitialLoadRef.current });
    isInitialLoadRef.current = false;
  }, [load]);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        window.clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  const handleBarcodeChange = (event) => {
    const value = event.target.value;
    setBarcodeInput(value);
    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = window.setTimeout(() => {
      setBarcodeQuery(String(value || '').trim());
    }, 350);
  };

  return (
    <section className="return-requests-page">
      <header className="return-requests-page__header">
        <div className="return-requests-page__heading">
          <div className="return-requests-page__heading-top">
            <h1 className="return-requests-page__title">Qaytarish so‘rovlari</h1>
            <Segmented
              options={STATUS_OPTIONS}
              value={status}
              onChange={setStatus}
            />
          </div>
          <div className="return-requests-page__subtitle-row">
            <p className="return-requests-page__subtitle">
              Kuryer Ajdaniya va cargo «Sotuvchiga qaytarish» so‘rovlarini
              tasdiqlang yoki rad eting. Cargo uchun hozircha «Yaroqsiz».
            </p>
            <Input
              allowClear
              className="return-requests-page__search"
              prefix={<SearchOutlined />}
              placeholder="Mahsulot shtrix-kod"
              value={barcodeInput}
              onChange={handleBarcodeChange}
              onPressEnter={() => setBarcodeQuery(String(barcodeInput || '').trim())}
            />
          </div>
        </div>
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
