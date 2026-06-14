import React, { useEffect, useState } from 'react';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  createCargoRate,
  createDeliveryPrice,
  deleteCargoRate,
  deleteDeliveryPrice,
  fetchCargoAdminData,
  updateCargoRate,
  updateDeliveryPrice,
} from '../../api/cargoAdminApi';

const EMPTY_CARGO_DRAFT = {
  key: '',
  sortOrder: '',
  nameUz: '',
  nameRu: '',
  standard: '',
  express: '',
  infoUz: '',
  infoRu: '',
};

function createTier() {
  return {
    id: `${Date.now()}-${Math.random()}`,
    labelUz: '',
    labelRu: '',
    price: '',
  };
}

function normalizeOptionalNumber(value, fieldLabel) {
  const text = String(value ?? '').trim();
  if (!text) return undefined;
  const n = Number(text);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`${fieldLabel} 0 yoki undan katta bo'lishi kerak`);
  }
  return n;
}

function normalizeRequiredNumber(value, fieldLabel) {
  const text = String(value ?? '').trim();
  if (!text) {
    throw new Error(`${fieldLabel} to'ldirilishi shart`);
  }
  const n = Number(text);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`${fieldLabel} 0 yoki undan katta bo'lishi kerak`);
  }
  return n;
}

function toNumericOrEmpty(value) {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : '';
}

function getDeliveryPrefixes(regionKey) {
  const safe = String(regionKey || '').trim().toLowerCase();
  if (safe === 'viloyat') {
    return { namePrefix: 'namePricev', pricePrefix: 'pricev' };
  }
  return { namePrefix: 'namePricetsh', pricePrefix: 'pricetsh' };
}

function extractDeliveryTiers(data, regionKey) {
  const { namePrefix, pricePrefix } = getDeliveryPrefixes(regionKey);
  const rows = data && typeof data === 'object' ? data : {};

  const indexSet = new Set();
  Object.keys(rows).forEach((key) => {
    const nameMatch = key.match(new RegExp(`^${namePrefix}(\\d+)$`));
    if (nameMatch) {
      indexSet.add(Number(nameMatch[1]));
    }
    const priceMatch = key.match(new RegExp(`^${pricePrefix}(\\d+)$`));
    if (priceMatch) {
      indexSet.add(Number(priceMatch[1]));
    }
  });

  const indexes = Array.from(indexSet)
    .filter((i) => Number.isFinite(i) && i > 0)
    .sort((a, b) => a - b);

  if (!indexes.length) return [createTier()];

  return indexes.map((idx) => ({
    id: `${Date.now()}-${idx}-${Math.random()}`,
    labelUz: rows?.[`${namePrefix}${idx}`]?.uz || '',
    labelRu: rows?.[`${namePrefix}${idx}`]?.ru || '',
    price: toNumericOrEmpty(rows?.[`${pricePrefix}${idx}`]),
  }));
}

function createEmptyDeliveryDraft(regionKey = 'toshkent') {
  return {
    key: regionKey,
    sortOrder: '',
    nameUz: '',
    nameRu: '',
    tiers: [createTier()],
  };
}

function buildCargoDraft(source) {
  const data = source?.data || {};
  return {
    key: source?.key || '',
    sortOrder: source?.sortOrder ?? '',
    nameUz: data?.name?.uz || '',
    nameRu: data?.name?.ru || '',
    standard: toNumericOrEmpty(data?.standard),
    express: toNumericOrEmpty(data?.express),
    infoUz: data?.infoCargo?.uz || '',
    infoRu: data?.infoCargo?.ru || '',
  };
}

function cargoDraftToPayload(draft) {
  const key = String(draft?.key || '').trim();
  if (!key) throw new Error("Hudud kodi bo'sh bo'lmasligi kerak");

  const nameUz = String(draft?.nameUz || '').trim();
  const nameRu = String(draft?.nameRu || '').trim();
  const infoUz = String(draft?.infoUz || '').trim();
  const infoRu = String(draft?.infoRu || '').trim();

  if (!nameUz || !nameRu) {
    throw new Error("Kargo nomi (UZ/RU) to'ldirilishi shart");
  }
  if (!infoUz || !infoRu) {
    throw new Error("Kargo izohi (UZ/RU) to'ldirilishi shart");
  }

  const standard = normalizeOptionalNumber(draft?.standard, 'Standard narx');
  const express = normalizeOptionalNumber(draft?.express, 'Express narx');

  const data = {
    name: { uz: nameUz, ru: nameRu },
    infoCargo: { uz: infoUz, ru: infoRu },
  };
  if (standard !== undefined) data.standard = standard;
  if (express !== undefined) data.express = express;

  const payload = { key, data };
  const sortOrder = normalizeOptionalNumber(draft?.sortOrder, "Ko'rinish tartibi");
  if (sortOrder !== undefined) payload.sortOrder = Math.floor(sortOrder);
  return payload;
}

function buildDeliveryDraft(source) {
  const data = source?.data || {};
  const key = source?.key || 'toshkent';
  return {
    key,
    sortOrder: source?.sortOrder ?? '',
    nameUz: data?.name?.uz || '',
    nameRu: data?.name?.ru || '',
    tiers: extractDeliveryTiers(data, key),
  };
}

function deliveryDraftToPayload(draft) {
  const key = String(draft?.key || '').trim().toLowerCase();
  if (!key) throw new Error("Hudud kodi bo'sh bo'lmasligi kerak");
  if (key !== 'toshkent' && key !== 'viloyat') {
    throw new Error("Hudud kodi faqat 'toshkent' yoki 'viloyat' bo'lishi kerak");
  }

  const nameUz = String(draft?.nameUz || '').trim();
  const nameRu = String(draft?.nameRu || '').trim();
  if (!nameUz || !nameRu) {
    throw new Error("Yetkazib berish nomi (UZ/RU) to'ldirilishi shart");
  }

  const tiers = Array.isArray(draft?.tiers) ? draft.tiers : [];
  if (!tiers.length) {
    throw new Error("Kamida bitta narx bosqichi bo'lishi kerak");
  }

  const { namePrefix, pricePrefix } = getDeliveryPrefixes(key);
  const data = { name: { uz: nameUz, ru: nameRu } };

  tiers.forEach((tier, index) => {
    const rowNo = index + 1;
    const labelUz = String(tier?.labelUz || '').trim();
    const labelRu = String(tier?.labelRu || '').trim();
    if (!labelUz || !labelRu) {
      throw new Error(`${rowNo}-bosqich nomlari (UZ/RU) to'ldirilishi shart`);
    }
    data[`${namePrefix}${rowNo}`] = { uz: labelUz, ru: labelRu };
    data[`${pricePrefix}${rowNo}`] = normalizeRequiredNumber(tier?.price, `${rowNo}-bosqich narxi`);
  });

  const payload = { key, data };
  const sortOrder = normalizeOptionalNumber(draft?.sortOrder, "Ko'rinish tartibi");
  if (sortOrder !== undefined) payload.sortOrder = Math.floor(sortOrder);
  return payload;
}

function CargoFormCard({
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
            placeholder="Masalan: china, usa, turkiya, korea, uzb"
            value={draft.key}
            onChange={(e) => onChange('key', e.target.value)}
          />
          <span className="global-section-modal__hint">Qaysi davlat/yunalish uchun ekanini yozing.</span>
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
          <span className="global-section-modal__label">Kargo nomi (UZ)</span>
          <input
            className="global-section-modal__input"
            value={draft.nameUz}
            onChange={(e) => onChange('nameUz', e.target.value)}
          />
        </label>
        <label className="global-section-modal__field">
          <span className="global-section-modal__label">Kargo nomi (RU)</span>
          <input
            className="global-section-modal__input"
            value={draft.nameRu}
            onChange={(e) => onChange('nameRu', e.target.value)}
          />
        </label>
        <label className="global-section-modal__field">
          <span className="global-section-modal__label">Standard narx ($/kg, ixtiyoriy)</span>
          <input
            className="global-section-modal__input"
            type="number"
            min={0}
            value={draft.standard}
            onChange={(e) => onChange('standard', e.target.value)}
          />
        </label>
        <label className="global-section-modal__field">
          <span className="global-section-modal__label">Express narx ($/kg, ixtiyoriy)</span>
          <input
            className="global-section-modal__input"
            type="number"
            min={0}
            value={draft.express}
            onChange={(e) => onChange('express', e.target.value)}
          />
        </label>
        <label className="global-section-modal__field">
          <span className="global-section-modal__label">Izoh matni (UZ)</span>
          <textarea
            className="global-section-modal__textarea"
            rows={3}
            value={draft.infoUz}
            onChange={(e) => onChange('infoUz', e.target.value)}
          />
        </label>
        <label className="global-section-modal__field">
          <span className="global-section-modal__label">Izoh matni (RU)</span>
          <textarea
            className="global-section-modal__textarea"
            rows={3}
            value={draft.infoRu}
            onChange={(e) => onChange('infoRu', e.target.value)}
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

function DeliveryFormCard({
  title,
  draft,
  onChange,
  onChangeTier,
  onAddTier,
  onRemoveTier,
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
          <input className="global-section-modal__input" value={draft.key} readOnly />
          <span className="global-section-modal__hint">Faqat `toshkent` yoki `viloyat` ishlatiladi.</span>
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
          <span className="global-section-modal__label">Yetkazib berish nomi (UZ)</span>
          <input
            className="global-section-modal__input"
            value={draft.nameUz}
            onChange={(e) => onChange('nameUz', e.target.value)}
          />
        </label>
        <label className="global-section-modal__field">
          <span className="global-section-modal__label">Yetkazib berish nomi (RU)</span>
          <input
            className="global-section-modal__input"
            value={draft.nameRu}
            onChange={(e) => onChange('nameRu', e.target.value)}
          />
        </label>
      </div>

      <div className="global-section-modal__saved-items">
        {draft.tiers.map((tier, index) => (
          <div key={tier.id} className="global-section-modal__saved-item">
            <div className="global-section-modal__grid global-section-modal__grid--3 global-section-modal__saved-item-edit">
              <label className="global-section-modal__field">
                <span className="global-section-modal__label">{index + 1}-bosqich nomi (UZ)</span>
                <input
                  className="global-section-modal__input"
                  value={tier.labelUz}
                  onChange={(e) => onChangeTier(tier.id, 'labelUz', e.target.value)}
                />
              </label>
              <label className="global-section-modal__field">
                <span className="global-section-modal__label">{index + 1}-bosqich nomi (RU)</span>
                <input
                  className="global-section-modal__input"
                  value={tier.labelRu}
                  onChange={(e) => onChangeTier(tier.id, 'labelRu', e.target.value)}
                />
              </label>
              <label className="global-section-modal__field">
                <span className="global-section-modal__label">{index + 1}-bosqich narxi (so'm)</span>
                <input
                  className="global-section-modal__input"
                  type="number"
                  min={0}
                  value={tier.price}
                  onChange={(e) => onChangeTier(tier.id, 'price', e.target.value)}
                />
              </label>
            </div>
            {draft.tiers.length > 1 ? (
              <button
                type="button"
                className="global-section-modal__danger-link"
                onClick={() => onRemoveTier(tier.id)}
              >
                Bosqichni o'chirish
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <div className="global-section-modal__saved-actions">
        <button type="button" className="global-section-modal__ghost-btn" onClick={onAddTier}>
          <PlusOutlined />
          <span>Narx bosqichi qo'shish</span>
        </button>
      </div>

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

export default function LogisticsInfoForm({ visible }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [cargoRates, setCargoRates] = useState([]);
  const [deliveryPrices, setDeliveryPrices] = useState([]);

  const [createCargoDraft, setCreateCargoDraft] = useState(EMPTY_CARGO_DRAFT);
  const [editingCargoKey, setEditingCargoKey] = useState('');
  const [editingCargoDraft, setEditingCargoDraft] = useState(null);

  const [createDeliveryDraft, setCreateDeliveryDraft] = useState(createEmptyDeliveryDraft('toshkent'));
  const [editingDeliveryKey, setEditingDeliveryKey] = useState('');
  const [editingDeliveryDraft, setEditingDeliveryDraft] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchCargoAdminData();
      setCargoRates(Array.isArray(data?.cargoRates) ? data.cargoRates : []);
      setDeliveryPrices(Array.isArray(data?.deliveryPrices) ? data.deliveryPrices : []);
    } catch (err) {
      setError(err.message || "Logistika ma'lumotlarini yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) loadData();
  }, [visible]);

  const changeCargoField = (setter) => (field, value) =>
    setter((prev) => ({ ...prev, [field]: value }));
  const changeDeliveryField = (setter) => (field, value) =>
    setter((prev) => ({ ...prev, [field]: value }));

  const changeTier = (setter) => (tierId, field, value) => {
    setter((prev) => ({
      ...prev,
      tiers: (prev?.tiers || []).map((tier) =>
        tier.id === tierId ? { ...tier, [field]: value } : tier,
      ),
    }));
  };

  const addTier = (setter) => () => {
    setter((prev) => ({ ...prev, tiers: [...(prev?.tiers || []), createTier()] }));
  };

  const removeTier = (setter) => (tierId) => {
    setter((prev) => {
      const nextTiers = (prev?.tiers || []).filter((tier) => tier.id !== tierId);
      return {
        ...prev,
        tiers: nextTiers.length ? nextTiers : [createTier()],
      };
    });
  };

  const handleCreateCargo = async () => {
    setSaving(true);
    setError('');
    try {
      await createCargoRate(cargoDraftToPayload(createCargoDraft));
      setCreateCargoDraft(EMPTY_CARGO_DRAFT);
      await loadData();
    } catch (err) {
      setError(err.message || "Kargo ma'lumotini qo'shib bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCargo = async () => {
    if (!editingCargoKey || !editingCargoDraft) return;
    setUpdating(true);
    setError('');
    try {
      await updateCargoRate(editingCargoKey, cargoDraftToPayload(editingCargoDraft));
      setEditingCargoKey('');
      setEditingCargoDraft(null);
      await loadData();
    } catch (err) {
      setError(err.message || "Kargo ma'lumotini yangilab bo'lmadi");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteCargo = async (key) => {
    const ok = window.confirm("Bu kargo ma'lumoti o'chirilsinmi?");
    if (!ok) return;
    setUpdating(true);
    setError('');
    try {
      await deleteCargoRate(key);
      if (editingCargoKey === key) {
        setEditingCargoKey('');
        setEditingCargoDraft(null);
      }
      await loadData();
    } catch (err) {
      setError(err.message || "Kargo ma'lumotini o'chirib bo'lmadi");
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateDelivery = async () => {
    setSaving(true);
    setError('');
    try {
      await createDeliveryPrice(deliveryDraftToPayload(createDeliveryDraft));
      setCreateDeliveryDraft(createEmptyDeliveryDraft(createDeliveryDraft.key || 'toshkent'));
      await loadData();
    } catch (err) {
      setError(err.message || "Yetkazib berish ma'lumotini qo'shib bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateDelivery = async () => {
    if (!editingDeliveryKey || !editingDeliveryDraft) return;
    setUpdating(true);
    setError('');
    try {
      await updateDeliveryPrice(editingDeliveryKey, deliveryDraftToPayload(editingDeliveryDraft));
      setEditingDeliveryKey('');
      setEditingDeliveryDraft(null);
      await loadData();
    } catch (err) {
      setError(err.message || "Yetkazib berish ma'lumotini yangilab bo'lmadi");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteDelivery = async (key) => {
    const ok = window.confirm("Bu yetkazib berish ma'lumoti o'chirilsinmi?");
    if (!ok) return;
    setUpdating(true);
    setError('');
    try {
      await deleteDeliveryPrice(key);
      if (editingDeliveryKey === key) {
        setEditingDeliveryKey('');
        setEditingDeliveryDraft(null);
      }
      await loadData();
    } catch (err) {
      setError(err.message || "Yetkazib berish ma'lumotini o'chirib bo'lmadi");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="global-section-modal__form-stack">
      <div className="global-section-modal__card">
        <div className="global-section-modal__row-between">
          <h3 className="global-section-modal__block-title">Logistika ma'lumoti</h3>
          <button type="button" className="global-section-modal__ghost-btn" onClick={loadData}>
            <ReloadOutlined />
            <span>Yangilash</span>
          </button>
        </div>
        <p className="global-section-modal__meta">
          Ikki bo'lim alohida: <strong>Kargo tariflari</strong> va{' '}
          <strong>Yetkazib berish narxlari</strong>.
        </p>
        {loading ? <p className="global-section-modal__state">Yuklanmoqda...</p> : null}
      </div>

      <div className="global-section-modal__card">
        <h3 className="global-section-modal__block-title">Kargo tariflari (`cargoRates`)</h3>
        <div className="global-section-modal__list">
          {cargoRates.map((row) => (
            <div key={row.key} className="global-section-modal__saved-card">
              <div className="global-section-modal__row-between">
                <div>
                  <strong>{row.key}</strong>
                  <div className="global-section-modal__meta">
                    {(row?.data?.name?.uz || '-') + ' / ' + (row?.data?.name?.ru || '-')}
                  </div>
                </div>
                <div className="global-section-modal__saved-actions">
                  <button
                    type="button"
                    className="global-section-modal__ghost-btn"
                    onClick={() => {
                      setEditingCargoKey(row.key);
                      setEditingCargoDraft(buildCargoDraft(row));
                    }}
                  >
                    Tahrirlash
                  </button>
                  <button
                    type="button"
                    className="global-section-modal__danger-link"
                    onClick={() => handleDeleteCargo(row.key)}
                    disabled={updating}
                  >
                    O'chirish
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {editingCargoDraft ? (
          <CargoFormCard
            title="Kargo ma'lumotini tahrirlash"
            draft={editingCargoDraft}
            onChange={changeCargoField(setEditingCargoDraft)}
            onSubmit={handleUpdateCargo}
            submitText={updating ? 'Saqlanmoqda...' : 'Saqlash'}
            submitDisabled={updating}
            onCancel={() => {
              setEditingCargoKey('');
              setEditingCargoDraft(null);
            }}
          />
        ) : null}

        <CargoFormCard
          title="Yangi kargo ma'lumoti qo'shish"
          draft={createCargoDraft}
          onChange={changeCargoField(setCreateCargoDraft)}
          onSubmit={handleCreateCargo}
          submitText={saving ? "Qo'shilmoqda..." : "Qo'shish"}
          submitDisabled={saving}
        />
      </div>

      <div className="global-section-modal__card">
        <h3 className="global-section-modal__block-title">
          Yetkazib berish narxlari (`deliveryPrices`)
        </h3>
        <div className="global-section-modal__list">
          {deliveryPrices.map((row) => (
            <div key={row.key} className="global-section-modal__saved-card">
              <div className="global-section-modal__row-between">
                <div>
                  <strong>{row.key}</strong>
                  <div className="global-section-modal__meta">
                    {(row?.data?.name?.uz || '-') + ' / ' + (row?.data?.name?.ru || '-')}
                  </div>
                </div>
                <div className="global-section-modal__saved-actions">
                  <button
                    type="button"
                    className="global-section-modal__ghost-btn"
                    onClick={() => {
                      setEditingDeliveryKey(row.key);
                      setEditingDeliveryDraft(buildDeliveryDraft(row));
                    }}
                  >
                    Tahrirlash
                  </button>
                  <button
                    type="button"
                    className="global-section-modal__danger-link"
                    onClick={() => handleDeleteDelivery(row.key)}
                    disabled={updating}
                  >
                    O'chirish
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {editingDeliveryDraft ? (
          <DeliveryFormCard
            title="Yetkazib berish ma'lumotini tahrirlash"
            draft={editingDeliveryDraft}
            onChange={changeDeliveryField(setEditingDeliveryDraft)}
            onChangeTier={changeTier(setEditingDeliveryDraft)}
            onAddTier={addTier(setEditingDeliveryDraft)}
            onRemoveTier={removeTier(setEditingDeliveryDraft)}
            onSubmit={handleUpdateDelivery}
            submitText={updating ? 'Saqlanmoqda...' : 'Saqlash'}
            submitDisabled={updating}
            onCancel={() => {
              setEditingDeliveryKey('');
              setEditingDeliveryDraft(null);
            }}
          />
        ) : null}

        <div className="global-section-modal__sub-card">
          <h4 className="global-section-modal__block-title">Yangi yetkazib berish ma'lumoti</h4>
          <div className="global-section-modal__saved-actions">
            <button
              type="button"
              className={`global-section-modal__ghost-btn${
                createDeliveryDraft.key === 'toshkent' ? ' global-section-modal__ghost-btn--active' : ''
              }`}
              onClick={() => setCreateDeliveryDraft(createEmptyDeliveryDraft('toshkent'))}
            >
              Toshkent
            </button>
            <button
              type="button"
              className={`global-section-modal__ghost-btn${
                createDeliveryDraft.key === 'viloyat' ? ' global-section-modal__ghost-btn--active' : ''
              }`}
              onClick={() => setCreateDeliveryDraft(createEmptyDeliveryDraft('viloyat'))}
            >
              Viloyat
            </button>
          </div>
          <DeliveryFormCard
            title={`Yangi ma'lumot (${createDeliveryDraft.key || 'toshkent'})`}
            draft={createDeliveryDraft}
            onChange={changeDeliveryField(setCreateDeliveryDraft)}
            onChangeTier={changeTier(setCreateDeliveryDraft)}
            onAddTier={addTier(setCreateDeliveryDraft)}
            onRemoveTier={removeTier(setCreateDeliveryDraft)}
            onSubmit={handleCreateDelivery}
            submitText={saving ? "Qo'shilmoqda..." : "Qo'shish"}
            submitDisabled={saving}
          />
        </div>
      </div>

      {error ? <p className="global-section-modal__error">{error}</p> : null}
    </div>
  );
}
