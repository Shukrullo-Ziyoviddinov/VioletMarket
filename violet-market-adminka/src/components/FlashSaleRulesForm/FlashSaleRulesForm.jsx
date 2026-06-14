import React, { useEffect, useMemo, useState } from 'react';
import { ReloadOutlined } from '@ant-design/icons';
import { fetchFlashSaleRules, updateFlashSaleRules } from '../../api/flashSaleRulesAdminApi';

const FIELD_CONFIGS = [
  {
    key: 'key',
    label: 'key',
    type: 'text',
    readOnly: true,
    description: "Qoidalar to'plamining nomi. Odatda 'default' bo'lib qoladi.",
  },
  {
    key: 'minSoldCount',
    label: 'minSoldCount',
    type: 'number',
    description: "Mahsulotda flash-sale signal chiqishi uchun kerak bo'ladigan minimal sotuv soni.",
  },
  {
    key: 'minCartUsers',
    label: 'minCartUsers',
    type: 'number',
    description: "Savatchaga qo'shildi signalini yoqish uchun minimal foydalanuvchi soni.",
  },
  {
    key: 'lowStockThreshold',
    label: 'lowStockThreshold',
    type: 'number',
    description: "Qolgan mahsulot soni shu qiymatdan past bo'lsa low stock (kam qoldi) holati ishlaydi.",
  },
  {
    key: 'highStockThreshold',
    label: 'highStockThreshold',
    type: 'number',
    description: "Qolgan mahsulot soni shu qiymatdan yuqori bo'lsa yuqori zaxira holati ishlatiladi.",
  },
  {
    key: 'rotateEveryMs',
    label: 'rotateEveryMs',
    type: 'number',
    description: 'Signal matnlari necha millisekundda almashishini belgilaydi.',
  },
  {
    key: 'active',
    label: 'active',
    type: 'boolean',
    description: "Flash-sale auto signal tizimi yoqilgan yoki o'chirilganini bildiradi.",
  },
  {
    key: 'liveMinViewers',
    label: 'liveMinViewers',
    type: 'number',
    description: "Live ko'ruvchilar sonining eng kichik chegarasi.",
  },
  {
    key: 'liveMaxViewers',
    label: 'liveMaxViewers',
    type: 'number',
    description: "Live ko'ruvchilar sonining eng katta chegarasi.",
  },
  {
    key: 'liveUpdateEveryMs',
    label: 'liveUpdateEveryMs',
    type: 'number',
    description: "Live ko'ruvchilar soni necha millisekundda bir yangilanishini belgilaydi.",
  },
  {
    key: 'liveModeRotateEveryMs',
    label: 'liveModeRotateEveryMs',
    type: 'number',
    description: 'Live rejim (normal/surge/cooldown/spike) necha millisekundda almashishini belgilaydi.',
  },
  {
    key: 'liveNormalStepMin',
    label: 'liveNormalStepMin',
    type: 'number',
    description: 'Normal rejimda ko\'ruvchilar soni o\'zgarishining minimal qadami.',
  },
  {
    key: 'liveNormalStepMax',
    label: 'liveNormalStepMax',
    type: 'number',
    description: 'Normal rejimda ko\'ruvchilar soni o\'zgarishining maksimal qadami.',
  },
  {
    key: 'liveSurgeStepMin',
    label: 'liveSurgeStepMin',
    type: 'number',
    description: "Surge rejimida ko'ruvchilar soni oshishining minimal qadami.",
  },
  {
    key: 'liveSurgeStepMax',
    label: 'liveSurgeStepMax',
    type: 'number',
    description: "Surge rejimida ko'ruvchilar soni oshishining maksimal qadami.",
  },
  {
    key: 'liveCooldownStepMin',
    label: 'liveCooldownStepMin',
    type: 'number',
    description: "Cooldown rejimida ko'ruvchilar soni kamayishining minimal qadami.",
  },
  {
    key: 'liveCooldownStepMax',
    label: 'liveCooldownStepMax',
    type: 'number',
    description: "Cooldown rejimida ko'ruvchilar soni kamayishining maksimal qadami.",
  },
  {
    key: 'liveSpikeChancePercent',
    label: 'liveSpikeChancePercent',
    type: 'number',
    description: "Har yangilanishda keskin sakrash bo'lish ehtimoli (foizda).",
  },
];

const INITIAL_DRAFT = FIELD_CONFIGS.reduce((acc, field) => {
  if (field.type === 'boolean') acc[field.key] = false;
  else acc[field.key] = '';
  return acc;
}, {});

function toNumberOrFallback(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

export default function FlashSaleRulesForm({ visible }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(INITIAL_DRAFT);

  const loadRules = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchFlashSaleRules();
      const next = { ...INITIAL_DRAFT };
      FIELD_CONFIGS.forEach((field) => {
        if (field.type === 'boolean') next[field.key] = Boolean(data?.[field.key]);
        else next[field.key] = data?.[field.key] ?? '';
      });
      setDraft(next);
    } catch (err) {
      setError(err.message || "Flash sale rulesni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadRules();
    }
  }, [visible]);

  const payload = useMemo(() => {
    const out = {};
    FIELD_CONFIGS.forEach((field) => {
      if (field.readOnly) return;
      if (field.type === 'boolean') {
        out[field.key] = Boolean(draft[field.key]);
      } else {
        out[field.key] = toNumberOrFallback(draft[field.key], 0);
      }
    });
    return out;
  }, [draft]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await updateFlashSaleRules(payload);
      const next = { ...INITIAL_DRAFT };
      FIELD_CONFIGS.forEach((field) => {
        if (field.type === 'boolean') next[field.key] = Boolean(updated?.[field.key]);
        else next[field.key] = updated?.[field.key] ?? '';
      });
      setDraft(next);
    } catch (err) {
      setError(err.message || "Flash sale rulesni saqlab bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="global-section-modal__form-stack">
      <div className="global-section-modal__card">
        <div className="global-section-modal__row-between">
          <h3 className="global-section-modal__block-title">Flash sale rules (faqat tahrirlash)</h3>
          <button type="button" className="global-section-modal__ghost-btn" onClick={loadRules}>
            <ReloadOutlined />
            <span>Yangilash</span>
          </button>
        </div>

        {loading ? <p className="global-section-modal__state">Yuklanmoqda...</p> : null}

        <div className="global-section-modal__grid global-section-modal__grid--2">
          {FIELD_CONFIGS.map((field) => (
            <label
              key={field.key}
              className={`global-section-modal__field${
                field.type === 'boolean' ? ' global-section-modal__field--full' : ''
              }`}
            >
              <span className="global-section-modal__label">{field.label}</span>
              {field.type === 'boolean' ? (
                <div className="global-section-modal__check">
                  <input
                    type="checkbox"
                    checked={Boolean(draft[field.key])}
                    onChange={(e) => setDraft((prev) => ({ ...prev, [field.key]: e.target.checked }))}
                    disabled={field.readOnly}
                  />
                  <span>{Boolean(draft[field.key]) ? 'Yoqilgan' : "O'chirilgan"}</span>
                </div>
              ) : (
                <input
                  className="global-section-modal__input"
                  type={field.type}
                  inputMode={field.type === 'number' ? 'numeric' : undefined}
                  value={draft[field.key]}
                  readOnly={field.readOnly}
                  onChange={(e) => setDraft((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
              )}
              <span className="global-section-modal__hint">{field.description}</span>
            </label>
          ))}
        </div>

        <div className="global-section-modal__actions">
          <button type="button" className="global-section-modal__btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </div>

      {error ? <p className="global-section-modal__error">{error}</p> : null}
    </div>
  );
}
