import React, { useEffect, useState } from 'react';
import GlobalModal from '../../GlobalModal/GlobalModal';
import './PaymentRequestRejectModal.css';

export default function PaymentRequestRejectModal({
  open,
  loading = false,
  onClose,
  onSubmit,
}) {
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!open) {
      setComment('');
    }
  }, [open]);

  const handleSubmit = () => {
    const trimmed = comment.trim();
    if (!trimmed || loading) return;
    onSubmit?.(trimmed);
  };

  return (
    <GlobalModal open={open} title="Rad etish sababi" onClose={onClose}>
      <div className="payment-request-reject-modal">
        <label className="payment-request-reject-modal__label" htmlFor="payment-request-reject-comment">
          Izoh
        </label>
        <textarea
          id="payment-request-reject-comment"
          className="payment-request-reject-modal__input"
          rows={5}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Rad etish sababini yozing..."
          disabled={loading}
        />
        <button
          type="button"
          className="payment-request-reject-modal__submit"
          onClick={handleSubmit}
          disabled={loading || !comment.trim()}
        >
          {loading ? 'Yuborilmoqda...' : 'Yuborish'}
        </button>
      </div>
    </GlobalModal>
  );
}
