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

function prettyJson(value) {
  try {
    return JSON.stringify(value || {}, null, 2);
  } catch (_error) {
    return '{}';
  }
}

function buildDraft(source) {
  return {
    key: source?.key || '',
    sortOrder: source?.sortOrder ?? '',
    dataText: prettyJson(source?.data || {}),
  };
}

function parsePayload(draft) {
  const key = String(draft?.key || '').trim();
  if (!key) {
    throw new Error("key bo'sh bo'lmasligi kerak");
  }

  let parsedData = {};
  try {
    parsedData = JSON.parse(String(draft?.dataText || '{}'));
  } catch (_error) {
    throw new Error("data JSON formati noto'g'ri");
  }

  if (!parsedData || typeof parsedData !== 'object' || Array.isArray(parsedData)) {
    throw new Error("data JSON object bo'lishi kerak");
  }

  const payload = {
    key,
    data: parsedData,
  };

  if (draft?.sortOrder !== '' && draft?.sortOrder != null) {
    const n = Number(draft.sortOrder);
    if (!Number.isFinite(n) || n < 0) {
      throw new Error("sortOrder 0 yoki undan katta bo'lishi kerak");
    }
    payload.sortOrder = Math.floor(n);
  }

  return payload;
}

function sectionName(dataObj) {
  const uz = String(dataObj?.name?.uz || '').trim();
  const ru = String(dataObj?.name?.ru || '').trim();
  if (uz || ru) return `${uz || '-'} / ${ru || '-'}`;
  return "name maydoni yo'q";
}

function SectionEditor({
  title,
  rows,
  editingKey,
  editingDraft,
  onStartEdit,
  onCancelEdit,
  onChangeEdit,
  onSaveEdit,
  onDelete,
  createDraft,
  onChangeCreate,
  onCreate,
  saving,
  updating,
}) {
  return (
    <div className="global-section-modal__card">
      <h3 className="global-section-modal__block-title">{title}</h3>

      <div className="global-section-modal__list">
        {(rows || []).map((row) => {
          const isEditing = editingKey === row.key;
          return (
            <div key={row.key} className="global-section-modal__saved-card">
              <div className="global-section-modal__row-between">
                <div>
                  <strong>{row.key}</strong>
                  <div className="global-section-modal__meta">
                    sortOrder: {row.sortOrder} | {sectionName(row.data)}
                  </div>
                </div>
                <div className="global-section-modal__saved-actions">
                  <button
                    type="button"
                    className="global-section-modal__ghost-btn"
                    onClick={() => onStartEdit(row)}
                  >
                    Tahrirlash
                  </button>
                  <button
                    type="button"
                    className="global-section-modal__danger-link"
                    onClick={() => onDelete(row.key)}
                    disabled={updating}
                  >
                    O'chirish
                  </button>
                </div>
              </div>

              {isEditing ? (
                <div className="global-section-modal__saved-item-edit global-section-modal__edit-block">
                  <div className="global-section-modal__grid global-section-modal__grid--2">
                    <label className="global-section-modal__field">
                      <span className="global-section-modal__label">key</span>
                      <input
                        className="global-section-modal__input"
                        value={editingDraft?.key || ''}
                        onChange={(e) => onChangeEdit('key', e.target.value)}
                      />
                    </label>
                    <label className="global-section-modal__field">
                      <span className="global-section-modal__label">sortOrder</span>
                      <input
                        className="global-section-modal__input"
                        type="number"
                        min={0}
                        value={editingDraft?.sortOrder ?? ''}
                        onChange={(e) => onChangeEdit('sortOrder', e.target.value)}
                      />
                    </label>
                    <label className="global-section-modal__field global-section-modal__field--full">
                      <span className="global-section-modal__label">data (JSON)</span>
                      <textarea
                        className="global-section-modal__textarea"
                        rows={10}
                        value={editingDraft?.dataText || ''}
                        onChange={(e) => onChangeEdit('dataText', e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="global-section-modal__saved-actions global-section-modal__saved-actions--end">
                    <button
                      type="button"
                      className="global-section-modal__ghost-btn"
                      onClick={onSaveEdit}
                      disabled={updating}
                    >
                      {updating ? 'Saqlanmoqda...' : 'Saqlash'}
                    </button>
                    <button type="button" className="global-section-modal__link-btn" onClick={onCancelEdit}>
                      Bekor
                    </button>
                  </div>
                </div>
              ) : (
                <div className="global-section-modal__saved-items">
                  <div className="global-section-modal__saved-item">
                    <pre className="global-section-modal__json-preview">{prettyJson(row.data)}</pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="global-section-modal__sub-card">
        <h3 className="global-section-modal__block-title">Yangi ma'lumot qo'shish</h3>
        <div className="global-section-modal__grid global-section-modal__grid--2">
          <label className="global-section-modal__field">
            <span className="global-section-modal__label">key</span>
            <input
              className="global-section-modal__input"
              value={createDraft.key}
              onChange={(e) => onChangeCreate('key', e.target.value)}
            />
          </label>
          <label className="global-section-modal__field">
            <span className="global-section-modal__label">sortOrder</span>
            <input
              className="global-section-modal__input"
              type="number"
              min={0}
              value={createDraft.sortOrder}
              onChange={(e) => onChangeCreate('sortOrder', e.target.value)}
            />
          </label>
          <label className="global-section-modal__field global-section-modal__field--full">
            <span className="global-section-modal__label">data (JSON)</span>
            <textarea
              className="global-section-modal__textarea"
              rows={10}
              value={createDraft.dataText}
              onChange={(e) => onChangeCreate('dataText', e.target.value)}
            />
          </label>
        </div>
        <div className="global-section-modal__saved-actions global-section-modal__saved-actions--end">
          <button type="button" className="global-section-modal__ghost-btn" onClick={onCreate} disabled={saving}>
            <PlusOutlined />
            <span>{saving ? 'Saqlanmoqda...' : "Qo'shish"}</span>
          </button>
        </div>
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

  const [createCargoDraft, setCreateCargoDraft] = useState(buildDraft());
  const [editingCargoKey, setEditingCargoKey] = useState('');
  const [editingCargoDraft, setEditingCargoDraft] = useState(null);

  const [createDeliveryDraft, setCreateDeliveryDraft] = useState(buildDraft());
  const [editingDeliveryKey, setEditingDeliveryKey] = useState('');
  const [editingDeliveryDraft, setEditingDeliveryDraft] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchCargoAdminData();
      setCargoRates(data.cargoRates || []);
      setDeliveryPrices(data.deliveryPrices || []);
    } catch (err) {
      setError(err.message || "Logistika ma'lumotlarini yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const createCargo = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = parsePayload(createCargoDraft);
      await createCargoRate(payload);
      setCreateCargoDraft(buildDraft());
      await loadData();
    } catch (err) {
      setError(err.message || "Cargo rate qo'shib bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  const saveCargoEdit = async () => {
    if (!editingCargoKey || !editingCargoDraft) return;
    setUpdating(true);
    setError('');
    try {
      const payload = parsePayload(editingCargoDraft);
      await updateCargoRate(editingCargoKey, payload);
      setEditingCargoKey('');
      setEditingCargoDraft(null);
      await loadData();
    } catch (err) {
      setError(err.message || "Cargo rate yangilab bo'lmadi");
    } finally {
      setUpdating(false);
    }
  };

  const removeCargo = async (key) => {
    const ok = window.confirm("Bu cargoRates ma'lumoti o'chirilsinmi?");
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
      setError(err.message || "Cargo rate o'chirib bo'lmadi");
    } finally {
      setUpdating(false);
    }
  };

  const createDelivery = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = parsePayload(createDeliveryDraft);
      await createDeliveryPrice(payload);
      setCreateDeliveryDraft(buildDraft());
      await loadData();
    } catch (err) {
      setError(err.message || "Delivery price qo'shib bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  const saveDeliveryEdit = async () => {
    if (!editingDeliveryKey || !editingDeliveryDraft) return;
    setUpdating(true);
    setError('');
    try {
      const payload = parsePayload(editingDeliveryDraft);
      await updateDeliveryPrice(editingDeliveryKey, payload);
      setEditingDeliveryKey('');
      setEditingDeliveryDraft(null);
      await loadData();
    } catch (err) {
      setError(err.message || "Delivery price yangilab bo'lmadi");
    } finally {
      setUpdating(false);
    }
  };

  const removeDelivery = async (key) => {
    const ok = window.confirm("Bu deliveryPrices ma'lumoti o'chirilsinmi?");
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
      setError(err.message || "Delivery price o'chirib bo'lmadi");
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
          Pastda ikki bo'lim alohida: <strong>cargoRates</strong> va <strong>deliveryPrices</strong>.
        </p>
        {loading ? <p className="global-section-modal__state">Yuklanmoqda...</p> : null}
      </div>

      <SectionEditor
        title="cargoRates"
        rows={cargoRates}
        editingKey={editingCargoKey}
        editingDraft={editingCargoDraft}
        onStartEdit={(row) => {
          setEditingCargoKey(row.key);
          setEditingCargoDraft(buildDraft(row));
          setError('');
        }}
        onCancelEdit={() => {
          setEditingCargoKey('');
          setEditingCargoDraft(null);
        }}
        onChangeEdit={(field, value) => setEditingCargoDraft((prev) => ({ ...prev, [field]: value }))}
        onSaveEdit={saveCargoEdit}
        onDelete={removeCargo}
        createDraft={createCargoDraft}
        onChangeCreate={(field, value) => setCreateCargoDraft((prev) => ({ ...prev, [field]: value }))}
        onCreate={createCargo}
        saving={saving}
        updating={updating}
      />

      <SectionEditor
        title="deliveryPrices"
        rows={deliveryPrices}
        editingKey={editingDeliveryKey}
        editingDraft={editingDeliveryDraft}
        onStartEdit={(row) => {
          setEditingDeliveryKey(row.key);
          setEditingDeliveryDraft(buildDraft(row));
          setError('');
        }}
        onCancelEdit={() => {
          setEditingDeliveryKey('');
          setEditingDeliveryDraft(null);
        }}
        onChangeEdit={(field, value) =>
          setEditingDeliveryDraft((prev) => ({ ...prev, [field]: value }))
        }
        onSaveEdit={saveDeliveryEdit}
        onDelete={removeDelivery}
        createDraft={createDeliveryDraft}
        onChangeCreate={(field, value) =>
          setCreateDeliveryDraft((prev) => ({ ...prev, [field]: value }))
        }
        onCreate={createDelivery}
        saving={saving}
        updating={updating}
      />

      {error ? <p className="global-section-modal__error">{error}</p> : null}
    </div>
  );
}
