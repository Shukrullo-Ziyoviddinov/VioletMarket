import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Spin } from 'antd';
import {
  approvePendingProduct,
  fetchPendingProducts,
  rejectPendingProduct,
} from '../../api/productApprovalAdminApi';
import ProductApprovalCard from '../../components/ProductApprovalCard/ProductApprovalCard';
import ProductApprovalActionModal from '../../components/ProductApprovalActionModal/ProductApprovalActionModal';
import { useAdminToast } from '../../context/AdminToastContext';
import { useGlobalLoader } from '../../context/GlobalLoaderContext';
import { getLocalizedText } from '../../utils/productDisplay';
import './ProductApprovalPage.css';

export default function ProductApprovalPage() {
  const { setGlobalLoading } = useGlobalLoader();
  const { showToast } = useAdminToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const isInitialLoadRef = useRef(true);

  const load = useCallback(
    async (options = {}) => {
      const useGlobal = options?.useGlobalLoader === true;
      setLoading(true);
      setError('');
      if (useGlobal) setGlobalLoading(true);
      try {
        const pending = await fetchPendingProducts();
        setItems(pending);
      } catch (err) {
        setError(err.message || "Ma'lumotlarni yuklab bo'lmadi");
        setItems([]);
      } finally {
        setLoading(false);
        if (useGlobal) setGlobalLoading(false);
      }
    },
    [setGlobalLoading],
  );

  useEffect(() => {
    load({ useGlobalLoader: isInitialLoadRef.current });
    isInitialLoadRef.current = false;
  }, [load]);

  const handleAction = useCallback(
    async (actionKey) => {
      if (!selected?.id || actionLoading) return;

      setActionLoading(true);
      const productTitle =
        getLocalizedText(selected.title, 'uz') || `Mahsulot #${selected.id}`;

      try {
        if (actionKey === 'unrestricted' || actionKey === 'standard_only') {
          const result = await approvePendingProduct(selected.id, actionKey);
          const policyNote =
            actionKey === 'unrestricted'
              ? 'cheklovsiz tasdiqlandi'
              : 'faqat standart sifatida tasdiqlandi';
          const pauseNote = result?.sellerPaused
            ? ' (siller pauzada — saytda hozircha chiqmaydi)'
            : '';
          showToast({
            type: 'success',
            message: `"${productTitle}" ${policyNote}${pauseNote}`,
          });
        } else if (actionKey === 'reject') {
          await rejectPendingProduct(selected.id, 'Admin tomonidan rad etildi');
          showToast({
            type: 'success',
            message: `"${productTitle}" rad etildi va o‘chirildi`,
          });
        } else {
          return;
        }

        setSelected(null);
        await load();
      } catch (err) {
        showToast({
          type: 'error',
          message: err.message || 'Amalni bajarib bo‘lmadi',
        });
      } finally {
        setActionLoading(false);
      }
    },
    [actionLoading, load, selected, showToast],
  );

  return (
    <section className="product-approval-page">
      <header className="product-approval-page__header">
        <div className="product-approval-page__heading">
          <h1 className="product-approval-page__title">Mahsulotni tasdiqlash</h1>
          <p className="product-approval-page__subtitle">
            Xorij sillerlari qo‘shgan mahsulotlar. Kartochkani bosing — Cheklovsiz, Faqat
            standart yoki Rad etish.
          </p>
        </div>
        <span className="product-approval-page__count">{items.length} ta kutilmoqda</span>
      </header>

      {error ? (
        <Alert
          type="error"
          showIcon
          message={error}
          action={
            <button
              type="button"
              className="product-approval-page__retry"
              onClick={() => load()}
            >
              Qayta urinish
            </button>
          }
        />
      ) : null}

      {loading && items.length === 0 ? (
        <div className="product-approval-page__empty">
          <Spin />
        </div>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <div className="product-approval-page__empty">
          <p>Hozircha tasdiqlash kutilayotgan mahsulot yo‘q.</p>
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="product-approval-page__grid">
          {items.map((product) => (
            <ProductApprovalCard
              key={product.id}
              product={product}
              onOpen={setSelected}
            />
          ))}
        </div>
      ) : null}

      <ProductApprovalActionModal
        open={Boolean(selected)}
        product={selected}
        loading={actionLoading}
        onClose={() => {
          if (!actionLoading) setSelected(null);
        }}
        onAction={handleAction}
      />
    </section>
  );
}
