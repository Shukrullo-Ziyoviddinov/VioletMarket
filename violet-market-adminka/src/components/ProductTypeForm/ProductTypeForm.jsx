import React, { useEffect, useState } from 'react';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  createProductType,
  deleteProductType,
  fetchProductTypes,
  updateProductType,
} from '../../api/productTypeAdminApi';

const EMPTY_DRAFT = {
  code: '',
  title: '',
  group: '',
  sortOrder: '',
  active: true,
};

function normalizeCodeInput(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function toSortOrderOrUndefined(value) {
  const text = String(value ?? '').trim();
  if (!text) return undefined;
  const n = Number(text);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error("Ko'rinish tartibi 0 yoki undan katta bo'lishi kerak");
  }
  return Math.floor(n);
}

function normalizePayload(draft) {
  const code = normalizeCodeInput(draft?.code);
  const title = String(draft?.title || '').trim();
  const group = String(draft?.group || '').trim();
  if (!code) throw new Error("Tizim kodi to'ldirilishi shart");
  if (!/^[a-z0-9_]+$/.test(code)) {
    throw new Error("Tizim kodi faqat kichik lotin harflari, raqam va _ belgisidan iborat bo'lishi kerak");
  }
  if (!title) throw new Error("Ko'rinadigan nom to'ldirilishi shart");

  const payload = {
    code,
    title,
    group,
    active: Boolean(draft?.active),
  };
  const sortOrder = toSortOrderOrUndefined(draft?.sortOrder);
  if (sortOrder !== undefined) payload.sortOrder = sortOrder;
  return payload;
}

function buildDraft(row) {
  return {
    code: row?.code || '',
    title: row?.title || '',
    group: row?.group || '',
    sortOrder: row?.sortOrder ?? '',
    active: row?.active !== false,
  };
}

function ProductTypeEditor({
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
          <span className="global-section-modal__label">Tizim kodi (ichki nom)</span>
          <input
            className="global-section-modal__input"
            placeholder="Masalan: smartphones yoki pants"
            value={draft.code}
            onChange={(e) => onChange('code', e.target.value)}
          />
          <span className="global-section-modal__hint">
            Tizim ichida ishlatiladigan qisqa nom. Faqat kichik lotin harflari, raqam va _ yoziladi.
            Xaridor buni ko‘rmaydi — faqat admin va tizim uchun.
          </span>
        </label>
        <label className="global-section-modal__field">
          <span className="global-section-modal__label">Ko‘rinadigan nom</span>
          <input
            className="global-section-modal__input"
            placeholder="Masalan: Smartfonlar, telefonlar"
            value={draft.title}
            onChange={(e) => onChange('title', e.target.value)}
          />
          <span className="global-section-modal__hint">
            Mahsulot tahrirlashda va ro‘yxatda ko‘rinadigan nom. Oddiy, tushunarli yozing.
          </span>
        </label>
        <label className="global-section-modal__field">
          <span className="global-section-modal__label">Guruh nomi (ixtiyoriy)</span>
          <input
            className="global-section-modal__input"
            placeholder="Masalan: Elektronika va Texnika"
            value={draft.group}
            onChange={(e) => onChange('group', e.target.value)}
          />
          <span className="global-section-modal__hint">
            Bu tur qaysi katta bo‘limga tegishli ekanini ko‘rsatish uchun. To‘ldirish majburiy emas.
          </span>
        </label>
        <label className="global-section-modal__field">
          <span className="global-section-modal__label">Ro‘yxatdagi tartib raqami</span>
          <input
            className="global-section-modal__input"
            value={draft.sortOrder}
            onChange={(e) => onChange('sortOrder', e.target.value)}
            placeholder="Masalan: 1"
          />
          <span className="global-section-modal__hint">
            Qaysi tartibda chiqishini belgilaydi. Kichik raqam yuqoriroq turadi. Bo‘sh qoldirsangiz
            avtomatik beriladi.
          </span>
        </label>
        <label className="global-section-modal__field global-section-modal__field--full">
          <span className="global-section-modal__label">Holati</span>
          <label className="global-section-modal__check">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(e) => onChange('active', e.target.checked)}
            />
            <span>Faol — mahsulotlarga tanlash mumkin</span>
          </label>
          <span className="global-section-modal__hint">
            Belgini olib tashlasangiz, bu tur yashirin bo‘ladi va yangi mahsulotlarga tanlab bo‘lmaydi.
          </span>
        </label>
      </div>
      <div className="global-section-modal__actions">
        <button
          type="button"
          className="global-section-modal__btn"
          onClick={onSubmit}
          disabled={submitDisabled}
        >
          <PlusOutlined />
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

export default function ProductTypeForm({ visible }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [createDraft, setCreateDraft] = useState(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState(null);
  const [editingDraft, setEditingDraft] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchProductTypes();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Mahsulot turlarini yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) loadData();
  }, [visible]);

  const changeCreateField = (field, value) =>
    setCreateDraft((prev) => ({
      ...prev,
      [field]: value,
    }));

  const changeEditField = (field, value) =>
    setEditingDraft((prev) => ({
      ...prev,
      [field]: value,
    }));

  const handleCreate = async () => {
    setSaving(true);
    setError('');
    try {
      await createProductType(normalizePayload(createDraft));
      setCreateDraft(EMPTY_DRAFT);
      await loadData();
    } catch (err) {
      setError(err.message || "Mahsulot turini qo'shib bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !editingDraft) return;
    setUpdating(true);
    setError('');
    try {
      await updateProductType(editingId, normalizePayload(editingDraft));
      setEditingId(null);
      setEditingDraft(null);
      await loadData();
    } catch (err) {
      setError(err.message || "Mahsulot turini yangilab bo'lmadi");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Bu mahsulot turi o'chirilsinmi?");
    if (!ok) return;
    setUpdating(true);
    setError('');
    try {
      await deleteProductType(id);
      if (editingId === id) {
        setEditingId(null);
        setEditingDraft(null);
      }
      await loadData();
    } catch (err) {
      setError(err.message || "Mahsulot turini o'chirib bo'lmadi");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="global-section-modal__form-stack">
      <div className="global-section-modal__card">
        <div className="global-section-modal__row-between">
          <h3 className="global-section-modal__block-title">Mahsulot turlari</h3>
          <button type="button" className="global-section-modal__ghost-btn" onClick={loadData}>
            <ReloadOutlined />
            <span>Yangilash</span>
          </button>
        </div>
        <p className="global-section-modal__meta">
          Bu yerda mahsulot turlarini qo‘shasiz va tahrirlaysiz. Har bir turda ichki kod va odamlar
          ko‘radigan nom bo‘ladi. Qo‘shilgan turlar mahsulot tahrirlashda tanlov ro‘yxatida chiqadi.
        </p>
        {loading ? <p className="global-section-modal__state">Yuklanmoqda...</p> : null}
        {error ? <p className="global-section-modal__error">{error}</p> : null}
      </div>

      <div className="global-section-modal__card">
        <h3 className="global-section-modal__block-title">Saqlangan turlar</h3>
        {!loading && rows.length === 0 ? (
          <p className="global-section-modal__state">Hozircha mahsulot turi qo‘shilmagan</p>
        ) : null}
        <div className="global-section-modal__list">
          {rows.map((row) => (
            <div key={row.id} className="global-section-modal__saved-card">
              <div className="global-section-modal__row-between">
                <div>
                  <div className="global-section-modal__saved-name">{row.title}</div>
                  <div className="global-section-modal__meta">
                    Tizim kodi: {row.code}
                    {row.group ? ` | Guruh: ${row.group}` : ''} | Holat:{' '}
                    {row.active ? 'faol' : "faol emas"} | Tartib: {row.sortOrder ?? 0}
                  </div>
                </div>
                <div className="global-section-modal__saved-actions">
                  <button
                    type="button"
                    className="global-section-modal__ghost-btn"
                    onClick={() => {
                      setEditingId(row.id);
                      setEditingDraft(buildDraft(row));
                    }}
                  >
                    Tahrirlash
                  </button>
                  <button
                    type="button"
                    className="global-section-modal__danger-link"
                    onClick={() => handleDelete(row.id)}
                    disabled={updating}
                  >
                    O'chirish
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingDraft ? (
        <ProductTypeEditor
          title="Mahsulot turini tahrirlash"
          draft={editingDraft}
          onChange={changeEditField}
          onSubmit={handleUpdate}
          submitText={updating ? 'Saqlanmoqda...' : 'Saqlash'}
          submitDisabled={updating}
          onCancel={() => {
            setEditingId(null);
            setEditingDraft(null);
          }}
        />
      ) : null}

      <ProductTypeEditor
        title="Yangi mahsulot turi qo'shish"
        draft={createDraft}
        onChange={changeCreateField}
        onSubmit={handleCreate}
        submitText={saving ? 'Saqlanmoqda...' : "Qo'shish"}
        submitDisabled={saving}
      />
    </div>
  );
}
