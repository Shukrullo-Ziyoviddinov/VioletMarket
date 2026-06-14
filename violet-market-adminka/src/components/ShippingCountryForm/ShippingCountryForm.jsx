import React, { useEffect, useState } from 'react';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  createShippingCountry,
  deleteShippingCountry,
  fetchShippingCountries,
  updateShippingCountry,
} from '../../api/shippingCountryAdminApi';

const EMPTY_DRAFT = {
  code: '',
  nameUz: '',
  nameRu: '',
  sortOrder: '',
  active: true,
};

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
  const code = String(draft?.code || '').trim().toLowerCase();
  const nameUz = String(draft?.nameUz || '').trim();
  const nameRu = String(draft?.nameRu || '').trim();
  if (!code) throw new Error("Hudud kodi to'ldirilishi shart");
  if (!/^[a-z0-9_-]+$/.test(code)) {
    throw new Error("Hudud kodi faqat kichik lotin harflari, raqam, _ yoki - bo'lishi mumkin");
  }
  if (!nameUz || !nameRu) {
    throw new Error("Hudud nomi (UZ/RU) to'ldirilishi shart");
  }

  const payload = {
    code,
    name: { uz: nameUz, ru: nameRu },
    active: Boolean(draft?.active),
  };
  const sortOrder = toSortOrderOrUndefined(draft?.sortOrder);
  if (sortOrder !== undefined) payload.sortOrder = sortOrder;
  return payload;
}

function buildDraft(row) {
  return {
    code: row?.code || '',
    nameUz: row?.name?.uz || '',
    nameRu: row?.name?.ru || '',
    sortOrder: row?.sortOrder ?? '',
    active: row?.active !== false,
  };
}

function ShippingCountryEditor({
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
          <span className="global-section-modal__label">Hudud kodi</span>
          <input
            className="global-section-modal__input"
            placeholder="masalan: china"
            value={draft.code}
            onChange={(e) => onChange('code', e.target.value)}
          />
          <span className="global-section-modal__hint">
            Kod keyinchalik kargo bo'limida tanlov sifatida ishlatiladi.
          </span>
        </label>
        <label className="global-section-modal__field">
          <span className="global-section-modal__label">Ko'rinish tartibi (ixtiyoriy)</span>
          <input
            className="global-section-modal__input"
            type="number"
            min={0}
            value={draft.sortOrder}
            onChange={(e) => onChange('sortOrder', e.target.value)}
          />
        </label>
        <label className="global-section-modal__field">
          <span className="global-section-modal__label">Hudud nomi (UZ)</span>
          <input
            className="global-section-modal__input"
            value={draft.nameUz}
            onChange={(e) => onChange('nameUz', e.target.value)}
          />
        </label>
        <label className="global-section-modal__field">
          <span className="global-section-modal__label">Hudud nomi (RU)</span>
          <input
            className="global-section-modal__input"
            value={draft.nameRu}
            onChange={(e) => onChange('nameRu', e.target.value)}
          />
        </label>
      </div>

      <label className="global-section-modal__check">
        <input
          type="checkbox"
          checked={Boolean(draft.active)}
          onChange={(e) => onChange('active', e.target.checked)}
        />
        <span>Faol holatda bo'lsin (kargo dropdownida ko'rinsin)</span>
      </label>

      <div className="global-section-modal__saved-actions global-section-modal__saved-actions--end">
        <button
          type="button"
          className="global-section-modal__ghost-btn"
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

export default function ShippingCountryForm({ visible }) {
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
      const data = await fetchShippingCountries();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Shipping country ma'lumotlarini yuklab bo'lmadi");
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
      await createShippingCountry(normalizePayload(createDraft));
      setCreateDraft(EMPTY_DRAFT);
      await loadData();
    } catch (err) {
      setError(err.message || "Shipping country qo'shib bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !editingDraft) return;
    setUpdating(true);
    setError('');
    try {
      await updateShippingCountry(editingId, normalizePayload(editingDraft));
      setEditingId(null);
      setEditingDraft(null);
      await loadData();
    } catch (err) {
      setError(err.message || "Shipping countryni yangilab bo'lmadi");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Bu shipping country o'chirilsinmi?");
    if (!ok) return;
    setUpdating(true);
    setError('');
    try {
      await deleteShippingCountry(id);
      if (editingId === id) {
        setEditingId(null);
        setEditingDraft(null);
      }
      await loadData();
    } catch (err) {
      setError(err.message || "Shipping countryni o'chirib bo'lmadi");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="global-section-modal__form-stack">
      <div className="global-section-modal__card">
        <div className="global-section-modal__row-between">
          <h3 className="global-section-modal__block-title">Yetkazib berish davlatlari</h3>
          <button type="button" className="global-section-modal__ghost-btn" onClick={loadData}>
            <ReloadOutlined />
            <span>Yangilash</span>
          </button>
        </div>
        <p className="global-section-modal__meta">
          Bu bo'limdan qo'shilgan hududlar kargo bo'limidagi <strong>Hudud kodi</strong> tanlovida
          chiqadi.
        </p>
        {loading ? <p className="global-section-modal__state">Yuklanmoqda...</p> : null}
      </div>

      <div className="global-section-modal__card">
        <h3 className="global-section-modal__block-title">Saqlangan hududlar</h3>
        {!loading && rows.length === 0 ? (
          <p className="global-section-modal__state">Hozircha hudud qo'shilmagan</p>
        ) : null}
        <div className="global-section-modal__list">
          {rows.map((row) => (
            <div key={row.id} className="global-section-modal__saved-card">
              <div className="global-section-modal__row-between">
                <div>
                  <div className="global-section-modal__saved-name">
                    {(row?.name?.uz || '-') + ' / ' + (row?.name?.ru || '-')}
                  </div>
                  <div className="global-section-modal__meta">
                    id: {row.id} | code: {row.code} | faol: {row.active ? 'ha' : "yo'q"} | tartib:{' '}
                    {row.sortOrder ?? 0}
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
        <ShippingCountryEditor
          title="Shipping countryni tahrirlash"
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

      <ShippingCountryEditor
        title="Yangi shipping country qo'shish"
        draft={createDraft}
        onChange={changeCreateField}
        onSubmit={handleCreate}
        submitText={saving ? "Qo'shilmoqda..." : "Qo'shish"}
        submitDisabled={saving}
      />

      {error ? <p className="global-section-modal__error">{error}</p> : null}
    </div>
  );
}
