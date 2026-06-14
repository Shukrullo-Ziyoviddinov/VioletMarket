import React, { useEffect, useMemo, useState } from 'react';
import { ReloadOutlined } from '@ant-design/icons';
import { fetchFlashSaleRules, updateFlashSaleRules } from '../../api/flashSaleRulesAdminApi';

const FIELD_CONFIGS = [
  {
    key: 'key',
    title: "Qoidalar kaliti",
    techName: 'key',
    type: 'text',
    readOnly: true,
    group: 'general',
    description: "Qoidalar to'plamining nomi. Odatda 'default' bo'lib qoladi.",
  },
  {
    key: 'minSoldCount',
    title: 'Minimal sotuv soni',
    techName: 'minSoldCount',
    type: 'number',
    unit: 'dona',
    group: 'signals',
    description: "Mahsulotda flash-sale signal chiqishi uchun kerak bo'ladigan minimal sotuv soni.",
  },
  {
    key: 'minCartUsers',
    title: "Savatchaga qo'shganlar minimumi",
    techName: 'minCartUsers',
    type: 'number',
    unit: 'foydalanuvchi',
    group: 'signals',
    description: "Savatchaga qo'shildi signalini yoqish uchun minimal foydalanuvchi soni.",
  },
  {
    key: 'lowStockThreshold',
    title: 'Kam qolgan zaxira chegarasi',
    techName: 'lowStockThreshold',
    type: 'number',
    unit: 'dona',
    group: 'signals',
    description: "Qolgan mahsulot soni shu qiymatdan past bo'lsa low stock (kam qoldi) holati ishlaydi.",
  },
  {
    key: 'highStockThreshold',
    title: "Yuqori zaxira chegarasi",
    techName: 'highStockThreshold',
    type: 'number',
    unit: 'dona',
    group: 'signals',
    description: "Qolgan mahsulot soni shu qiymatdan yuqori bo'lsa yuqori zaxira holati ishlatiladi.",
  },
  {
    key: 'rotateEveryMs',
    title: 'Signal almashish oralig‘i',
    techName: 'rotateEveryMs',
    type: 'number',
    unit: 'ms',
    group: 'signals',
    description: 'Signal matnlari necha millisekundda almashishini belgilaydi.',
  },
  {
    key: 'active',
    title: 'Auto signal holati',
    techName: 'active',
    type: 'boolean',
    group: 'signals',
    description: "Flash-sale auto signal tizimi yoqilgan yoki o'chirilganini bildiradi.",
  },
  {
    key: 'liveMinViewers',
    title: "Live ko'ruvchilar minimumi",
    techName: 'liveMinViewers',
    type: 'number',
    unit: 'kishi',
    group: 'live',
    description: "Live ko'ruvchilar sonining eng kichik chegarasi.",
  },
  {
    key: 'liveMaxViewers',
    title: "Live ko'ruvchilar maksimumi",
    techName: 'liveMaxViewers',
    type: 'number',
    unit: 'kishi',
    group: 'live',
    description: "Live ko'ruvchilar sonining eng katta chegarasi.",
  },
  {
    key: 'liveUpdateEveryMs',
    title: 'Live yangilanish oralig‘i',
    techName: 'liveUpdateEveryMs',
    type: 'number',
    unit: 'ms',
    group: 'live',
    description: "Live ko'ruvchilar soni necha millisekundda bir yangilanishini belgilaydi.",
  },
  {
    key: 'liveModeRotateEveryMs',
    title: 'Live rejim almashish oralig‘i',
    techName: 'liveModeRotateEveryMs',
    type: 'number',
    unit: 'ms',
    group: 'live',
    description: 'Live rejim (normal/surge/cooldown/spike) necha millisekundda almashishini belgilaydi.',
  },
  {
    key: 'liveNormalStepMin',
    title: 'Normal rejim minimal qadam',
    techName: 'liveNormalStepMin',
    type: 'number',
    unit: 'kishi',
    group: 'live',
    description: 'Normal rejimda ko\'ruvchilar soni o\'zgarishining minimal qadami.',
  },
  {
    key: 'liveNormalStepMax',
    title: 'Normal rejim maksimal qadam',
    techName: 'liveNormalStepMax',
    type: 'number',
    unit: 'kishi',
    group: 'live',
    description: 'Normal rejimda ko\'ruvchilar soni o\'zgarishining maksimal qadami.',
  },
  {
    key: 'liveSurgeStepMin',
    title: 'Surge rejim minimal qadam',
    techName: 'liveSurgeStepMin',
    type: 'number',
    unit: 'kishi',
    group: 'live',
    description: "Surge rejimida ko'ruvchilar soni oshishining minimal qadami.",
  },
  {
    key: 'liveSurgeStepMax',
    title: 'Surge rejim maksimal qadam',
    techName: 'liveSurgeStepMax',
    type: 'number',
    unit: 'kishi',
    group: 'live',
    description: "Surge rejimida ko'ruvchilar soni oshishining maksimal qadami.",
  },
  {
    key: 'liveCooldownStepMin',
    title: 'Cooldown rejim minimal qadam',
    techName: 'liveCooldownStepMin',
    type: 'number',
    unit: 'kishi',
    group: 'live',
    description: "Cooldown rejimida ko'ruvchilar soni kamayishining minimal qadami.",
  },
  {
    key: 'liveCooldownStepMax',
    title: 'Cooldown rejim maksimal qadam',
    techName: 'liveCooldownStepMax',
    type: 'number',
    unit: 'kishi',
    group: 'live',
    description: "Cooldown rejimida ko'ruvchilar soni kamayishining maksimal qadami.",
  },
  {
    key: 'liveSpikeChancePercent',
    title: 'Keskin sakrash ehtimoli',
    techName: 'liveSpikeChancePercent',
    type: 'number',
    unit: 'foiz (%)',
    group: 'live',
    description: "Har yangilanishda keskin sakrash bo'lish ehtimoli (foizda).",
  },
];

const GROUP_CONFIGS = [
  {
    id: 'general',
    title: "Umumiy ma'lumot",
    description: "Bu bo'lim konfiguratsiya identifikatori haqida.",
  },
  {
    id: 'signals',
    title: 'Signal qoidalari',
    description:
      "Mahsulot kartasidagi 'kam qoldi', 'savatchaga qo'shildi' kabi signal va rang holatini boshqaradi.",
  },
  {
    id: 'live',
    title: "Live ko'ruvchilar qoidalari",
    description: "Flash sale tepasida ko'rinadigan live tomoshabinlar sonining harakatini boshqaradi.",
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

  const groupedFields = useMemo(() => {
    const map = new Map();
    GROUP_CONFIGS.forEach((group) => map.set(group.id, []));
    FIELD_CONFIGS.forEach((field) => {
      const groupId = field.group || 'general';
      if (!map.has(groupId)) map.set(groupId, []);
      map.get(groupId).push(field);
    });
    return map;
  }, []);

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

        <div className="global-section-modal__form-stack">
          {GROUP_CONFIGS.map((group) => {
            const fields = groupedFields.get(group.id) || [];
            if (!fields.length) return null;
            return (
              <div key={group.id} className="global-section-modal__sub-card">
                <h4 className="global-section-modal__block-title">{group.title}</h4>
                <p className="global-section-modal__meta">{group.description}</p>
                <div className="global-section-modal__grid global-section-modal__grid--2">
                  {fields.map((field) => (
                    <label
                      key={field.key}
                      className={`global-section-modal__field${
                        field.type === 'boolean' ? ' global-section-modal__field--full' : ''
                      }`}
                    >
                      <span className="global-section-modal__label">{field.title}</span>
                      <span className="global-section-modal__hint">Texnik nomi: {field.techName}</span>
                      {field.type === 'boolean' ? (
                        <div className="global-section-modal__check">
                          <input
                            type="checkbox"
                            checked={Boolean(draft[field.key])}
                            onChange={(e) =>
                              setDraft((prev) => ({ ...prev, [field.key]: e.target.checked }))
                            }
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
                          onChange={(e) =>
                            setDraft((prev) => ({ ...prev, [field.key]: e.target.value }))
                          }
                        />
                      )}
                      {field.unit ? (
                        <span className="global-section-modal__hint">Birligi: {field.unit}</span>
                      ) : null}
                      <span className="global-section-modal__hint">{field.description}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
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
