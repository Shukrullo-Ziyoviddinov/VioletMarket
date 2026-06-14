import React, { useEffect, useState } from 'react';
import { ReloadOutlined } from '@ant-design/icons';
import {
  deleteUzbProductDeliveryInfo,
  fetchUzbProductDeliveryInfo,
  updateUzbProductDeliveryInfo,
} from '../../api/uzbProductDeliveryInfoAdminApi';

const EMPTY_DRAFT = {
  titleUz: '',
  titleRu: '',
  textUz: '',
  textRu: '',
};

function toDraft(deliveryInfo) {
  return {
    titleUz: deliveryInfo?.title?.uz || '',
    titleRu: deliveryInfo?.title?.ru || '',
    textUz: deliveryInfo?.text?.uz || '',
    textRu: deliveryInfo?.text?.ru || '',
  };
}

function toPayload(draft) {
  const titleUz = String(draft?.titleUz || '').trim();
  const titleRu = String(draft?.titleRu || '').trim();
  const textUz = String(draft?.textUz || '').trim();
  const textRu = String(draft?.textRu || '').trim();

  if (!titleUz || !titleRu) {
    throw new Error("Sarlavha (UZ/RU) to'ldirilishi shart");
  }
  if (!textUz || !textRu) {
    throw new Error("Matn (UZ/RU) to'ldirilishi shart");
  }

  return {
    deliveryInfo: {
      title: { uz: titleUz, ru: titleRu },
      text: { uz: textUz, ru: textRu },
    },
  };
}

function DeliveryInfoEditor({
  title,
  draft,
  onChange,
  onSubmit,
  submitText,
  submitDisabled,
  onCancel,
}) {
  return (
    <div className="global-section-modal__sub-card">
      <h4 className="global-section-modal__block-title">{title}</h4>
      <div className="global-section-modal__grid global-section-modal__grid--2">
        <label className="global-section-modal__field">
          <span className="global-section-modal__label">Sarlavha (UZ)</span>
          <input
            className="global-section-modal__input"
            value={draft.titleUz}
            onChange={(e) => onChange('titleUz', e.target.value)}
          />
        </label>
        <label className="global-section-modal__field">
          <span className="global-section-modal__label">Sarlavha (RU)</span>
          <input
            className="global-section-modal__input"
            value={draft.titleRu}
            onChange={(e) => onChange('titleRu', e.target.value)}
          />
        </label>
        <label className="global-section-modal__field">
          <span className="global-section-modal__label">Matn (UZ)</span>
          <textarea
            className="global-section-modal__textarea"
            rows={4}
            value={draft.textUz}
            onChange={(e) => onChange('textUz', e.target.value)}
          />
        </label>
        <label className="global-section-modal__field">
          <span className="global-section-modal__label">Matn (RU)</span>
          <textarea
            className="global-section-modal__textarea"
            rows={4}
            value={draft.textRu}
            onChange={(e) => onChange('textRu', e.target.value)}
          />
        </label>
      </div>

      <div className="global-section-modal__saved-actions global-section-modal__saved-actions--end">
        <button
          type="button"
          className="global-section-modal__ghost-btn"
          onClick={onSubmit}
          disabled={submitDisabled}
        >
          <span>{submitText}</span>
        </button>
        {onCancel ? (
          <button type="button" className="global-section-modal__link-btn" onClick={onCancel}>
            Bekor
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function UzbProductDeliveryInfoForm({ visible }) {
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [savedInfo, setSavedInfo] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchUzbProductDeliveryInfo();
      const info = data?.deliveryInfo || null;
      setSavedInfo(info);
      setEditing(false);
      setDraft(toDraft(info));
    } catch (err) {
      setError(err.message || "Mahsulot UZB ombori ma'lumotini yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) loadData();
  }, [visible]);

  const changeField = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setUpdating(true);
    setError('');
    try {
      await updateUzbProductDeliveryInfo(toPayload(draft));
      await loadData();
    } catch (err) {
      setError(err.message || "Ma'lumotni saqlab bo'lmadi");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    const ok = window.confirm("Mahsulot UZB ombori ma'lumoti o'chirilsinmi?");
    if (!ok) return;
    setUpdating(true);
    setError('');
    try {
      await deleteUzbProductDeliveryInfo();
      await loadData();
    } catch (err) {
      setError(err.message || "Ma'lumotni o'chirib bo'lmadi");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="global-section-modal__form-stack">
      <div className="global-section-modal__card">
        <div className="global-section-modal__row-between">
          <h3 className="global-section-modal__block-title">Mahsulot UZB omborida ma'lumoti</h3>
          <button type="button" className="global-section-modal__ghost-btn" onClick={loadData}>
            <ReloadOutlined />
            <span>Yangilash</span>
          </button>
        </div>
        <p className="global-section-modal__meta">
          Bu matn `countries` ichida <strong>uzb</strong> bo'lgan mahsulotlarda avtomatik ko'rinadi.
        </p>
        {loading ? <p className="global-section-modal__state">Yuklanmoqda...</p> : null}
      </div>

      <div className="global-section-modal__card">
        <h3 className="global-section-modal__block-title">Saqlangan ma'lumot</h3>
        {!savedInfo ? (
          <p className="global-section-modal__state">Hozircha ma'lumot qo'shilmagan</p>
        ) : (
          <div className="global-section-modal__saved-card">
            <div className="global-section-modal__row-between">
              <div>
                <div className="global-section-modal__saved-name">
                  {(savedInfo?.title?.uz || '-') + ' / ' + (savedInfo?.title?.ru || '-')}
                </div>
                <div className="global-section-modal__meta">UZ: {savedInfo?.text?.uz || '-'}</div>
                <div className="global-section-modal__meta">RU: {savedInfo?.text?.ru || '-'}</div>
              </div>
              <div className="global-section-modal__saved-actions">
                <button
                  type="button"
                  className="global-section-modal__ghost-btn"
                  onClick={() => {
                    setEditing(true);
                    setDraft(toDraft(savedInfo));
                  }}
                >
                  Tahrirlash
                </button>
                <button
                  type="button"
                  className="global-section-modal__danger-link"
                  onClick={handleDelete}
                  disabled={updating}
                >
                  O'chirish
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {editing ? (
        <DeliveryInfoEditor
          title="Ma'lumotni tahrirlash"
          draft={draft}
          onChange={changeField}
          onSubmit={handleSave}
          submitText={updating ? 'Saqlanmoqda...' : 'Saqlash'}
          submitDisabled={updating}
          onCancel={() => {
            setEditing(false);
            setDraft(toDraft(savedInfo));
          }}
        />
      ) : (
        <DeliveryInfoEditor
          title="Yangi ma'lumot qo'shish"
          draft={draft}
          onChange={changeField}
          onSubmit={handleSave}
          submitText={updating ? "Qo'shilmoqda..." : "Qo'shish"}
          submitDisabled={updating}
        />
      )}

      {error ? <p className="global-section-modal__error">{error}</p> : null}
    </div>
  );
}
