import React from 'react';
import { createPortal } from 'react-dom';
import { getLocalizedText } from '../../utils/productDisplay';
import '../MiniGlobalModal/MiniGlobalModal.css';
import './ProductApprovalActionModal.css';

export default function ProductApprovalActionModal({
  open,
  product,
  loading = false,
  onClose,
  onAction,
}) {
  if (!open || !product) return null;

  const title = getLocalizedText(product.title, 'uz') || `Mahsulot #${product.id}`;
  const sellerName =
    getLocalizedText(product.seller?.name, 'uz') || product.sellerId || '—';
  const sellerCountry = String(
    product.seller?.sellerCountry || product.productCountry || '—',
  );

  return createPortal(
    <div className="mini-global-modal">
      <button
        type="button"
        className="mini-global-modal__backdrop"
        aria-label="Yopish"
        disabled={loading}
        onClick={loading ? undefined : onClose}
      />
      <div className="mini-global-modal__center">
        <div
          className="mini-global-modal__dialog product-approval-action-modal__dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-approval-modal-title"
        >
          <h2 id="product-approval-modal-title" className="mini-global-modal__title">
            Mahsulotni tasdiqlang
          </h2>
          <p className="mini-global-modal__message">
            <strong>{title}</strong>
            <br />
            Siller: {sellerName} · Davlat: {sellerCountry}
            <br />
            ID: {product.id}
          </p>
          <p className="product-approval-action-modal__hint">
            Cheklovsiz — Standard va Express. Faqat standart — Express yo‘q. Rad etish —
            mahsulot o‘chiriladi.
          </p>
          <div className="mini-global-modal__actions product-approval-action-modal__actions">
            <button
              type="button"
              className="mini-global-modal__btn mini-global-modal__btn--ghost"
              disabled={loading}
              onClick={() => onAction?.('unrestricted')}
            >
              {loading ? '...' : 'Cheklovsiz'}
            </button>
            <button
              type="button"
              className="mini-global-modal__btn mini-global-modal__btn--primary"
              disabled={loading}
              onClick={() => onAction?.('standard_only')}
            >
              {loading ? '...' : 'Faqat standart'}
            </button>
            <button
              type="button"
              className="mini-global-modal__btn mini-global-modal__btn--danger"
              disabled={loading}
              onClick={() => onAction?.('reject')}
            >
              {loading ? '...' : 'Rad etish'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
