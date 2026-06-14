import React, { useEffect, useState } from 'react';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  createProductPolicyBlock,
  deleteProductPolicyBlock,
  fetchProductPolicyBlocks,
  updateProductPolicyBlock,
} from '../../api/productPolicyAdminApi';
import { toAbsoluteImageUrl } from '../../api/navbarAdminApi';
import ImageUploadField from '../ImageUploadField/ImageUploadField';

const ICON_OPTIONS = [
  {
    value: 'package',
    label: 'Quti (package)',
    hint: 'Yetkazish muddati kabi umumiy ma’lumotlar uchun.',
  },
  {
    value: 'truck',
    label: 'Yuk mashinasi (truck)',
    hint: 'Yetkazib berish xizmati haqidagi bloklar uchun.',
  },
  {
    value: 'refresh',
    label: 'Qaytarish (refresh)',
    hint: 'Qaytarish siyosati haqidagi bloklar uchun.',
  },
  {
    value: 'chat',
    label: 'Chat (chat)',
    hint: 'Aloqa va qo‘llab-quvvatlash haqidagi bloklar uchun.',
  },
  {
    value: 'credit-card',
    label: 'To‘lov kartasi (credit-card)',
    hint: 'To‘lov shartlari va to‘lov ikonkalari uchun.',
  },
];

function createPaymentIconDraft() {
  return {
    id: `${Date.now()}-${Math.random()}`,
    src: '',
    altUz: '',
    altRu: '',
  };
}

function buildEmptyDraft() {
  return {
    order: '',
    icon: 'package',
    customIcon: '',
    divider: true,
    titleUz: '',
    titleRu: '',
    textUz: '',
    textRu: '',
    paymentIcons: [],
  };
}

function buildDraftFromRow(row) {
  const block = row?.block || {};
  const icon = String(block?.icon || 'package').trim();
  const knownIcon = ICON_OPTIONS.some((opt) => opt.value === icon);
  const paymentIcons = Array.isArray(block?.paymentIcons)
    ? block.paymentIcons.map((item) => ({
        id: `${Date.now()}-${Math.random()}`,
        src: item?.src || '',
        altUz: item?.alt?.uz || '',
        altRu: item?.alt?.ru || '',
      }))
    : [];

  return {
    order: row?.order ?? '',
    icon: knownIcon ? icon : 'package',
    customIcon: knownIcon ? '' : icon,
    divider: block?.divider !== false,
    titleUz: block?.title?.uz || '',
    titleRu: block?.title?.ru || '',
    textUz: block?.text?.uz || '',
    textRu: block?.text?.ru || '',
    paymentIcons,
  };
}

function normalizePayload(draft) {
  const titleUz = String(draft?.titleUz || '').trim();
  const titleRu = String(draft?.titleRu || '').trim();
  const textUz = String(draft?.textUz || '').trim();
  const textRu = String(draft?.textRu || '').trim();
  const customIcon = String(draft?.customIcon || '').trim().toLowerCase();
  const selectedIcon = String(draft?.icon || '').trim().toLowerCase();
  const icon = customIcon || selectedIcon;

  if (!icon) throw new Error("Ikonka tanlanishi yoki kod sifatida kiritilishi shart");
  if (!titleUz || !titleRu) throw new Error("Sarlavha (UZ/RU) to'ldirilishi shart");
  if (!textUz || !textRu) throw new Error("Matn (UZ/RU) to'ldirilishi shart");

  const block = {
    icon,
    divider: Boolean(draft?.divider),
    title: { uz: titleUz, ru: titleRu },
    text: { uz: textUz, ru: textRu },
  };

  const paymentIcons = (Array.isArray(draft?.paymentIcons) ? draft.paymentIcons : [])
    .map((item) => ({
      src: String(item?.src || '').trim(),
      altUz: String(item?.altUz || '').trim(),
      altRu: String(item?.altRu || '').trim(),
    }))
    .filter((item) => item.src);

  if (paymentIcons.length) {
    block.paymentIcons = paymentIcons.map((item) => ({
      src: item.src,
      alt: { uz: item.altUz || item.src, ru: item.altRu || item.src },
    }));
  }

  const payload = { block };
  const orderText = String(draft?.order ?? '').trim();
  if (orderText) {
    const order = Number(orderText);
    if (!Number.isFinite(order) || order < 0) {
      throw new Error("Ko'rinish tartibi 0 yoki undan katta bo'lishi kerak");
    }
    payload.order = Math.floor(order);
  }

  return payload;
}

function IconPicker({ value, customValue, onSelect, onCustomChange, isOpen, onToggle }) {
  const selected = ICON_OPTIONS.find((opt) => opt.value === value);
  const triggerText = customValue
    ? `Maxsus kod: ${customValue}`
    : selected?.label || 'Ikonka tanlang';

  return (
    <div className="global-section-modal__category-picker">
      <button
        type="button"
        className={`global-section-modal__category-trigger${isOpen ? ' global-section-modal__category-trigger--active' : ''}`}
        onClick={onToggle}
      >
        <span>{triggerText}</span>
        <span className="global-section-modal__category-caret">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen ? (
        <div className="global-section-modal__category-options">
          {ICON_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`global-section-modal__category-option${value === option.value && !customValue ? ' global-section-modal__category-option--active' : ''}`}
              onClick={() => {
                onSelect(option.value);
                onCustomChange('');
                onToggle(false);
              }}
            >
              <span className="global-section-modal__category-main">{option.label}</span>
              <span className="global-section-modal__category-sub">{option.hint}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PolicyBlockEditor({
  title,
  draft,
  onChange,
  onChangePaymentIcon,
  onAddPaymentIcon,
  onRemovePaymentIcon,
  onSubmit,
  submitText,
  submitDisabled,
  onCancel,
  isIconPickerOpen,
  onToggleIconPicker,
  onUploadStateChange,
}) {
  const selectedIconHint =
    ICON_OPTIONS.find((opt) => opt.value === draft.icon)?.hint ||
    'Client sahifada shu ikonka kaliti bo‘yicha belgi chiqadi.';

  return (
    <div className="global-section-modal__sub-card">
      <h4 className="global-section-modal__block-title">{title}</h4>

      <div className="global-section-modal__grid global-section-modal__grid--2">
        <label className="global-section-modal__field">
          <span className="global-section-modal__label">Ko‘rinish tartibi (ixtiyoriy)</span>
          <input
            className="global-section-modal__input"
            type="number"
            min={0}
            value={draft.order}
            onChange={(e) => onChange('order', e.target.value)}
          />
          <span className="global-section-modal__hint">
            Bloklar qaysi tartibda chiqishini belgilaydi. Kichik raqam yuqorida ko‘rinadi.
          </span>
        </label>

        <label className="global-section-modal__field">
          <span className="global-section-modal__label">Ikonka (icon)</span>
          <IconPicker
            value={draft.icon}
            customValue={draft.customIcon}
            onSelect={(next) => onChange('icon', next)}
            onCustomChange={(next) => onChange('customIcon', next)}
            isOpen={isIconPickerOpen}
            onToggle={onToggleIconPicker}
          />
          <span className="global-section-modal__hint">{selectedIconHint}</span>
        </label>

        <label className="global-section-modal__field global-section-modal__field--full">
          <span className="global-section-modal__label">Ikonka kodi (ixtiyoriy, maxsus)</span>
          <input
            className="global-section-modal__input"
            placeholder="Masalan: package, truck, refresh, chat, credit-card"
            value={draft.customIcon}
            onChange={(e) => onChange('customIcon', e.target.value)}
          />
          <span className="global-section-modal__hint">
            Agar ro‘yxatdan tanlamasangiz, shu yerga kod yozing. Client faqat shu 5 ta kodni
            qo‘llab-quvvatlaydi.
          </span>
        </label>

        <label className="global-section-modal__field global-section-modal__field--full">
          <span className="global-section-modal__check">
            <input
              type="checkbox"
              checked={Boolean(draft.divider)}
              onChange={(e) => onChange('divider', e.target.checked)}
            />
            <span>Pastki chiziq (divider) ko‘rsatilsin</span>
          </span>
          <span className="global-section-modal__hint">
            Bu yoqilsa, blok ostida ajratuvchi chiziq chiqadi va keyingi blokdan vizual ajratiladi.
            Oxirgi blokda client avtomatik chiziqni yashirishi mumkin.
          </span>
        </label>

        <label className="global-section-modal__field">
          <span className="global-section-modal__label">Sarlavha (UZ)</span>
          <input
            className="global-section-modal__input"
            value={draft.titleUz}
            onChange={(e) => onChange('titleUz', e.target.value)}
          />
          <span className="global-section-modal__hint">
            Masalan: &quot;Yetkazib berish muddati&quot; — mahsulot sahifasidagi sarlavha.
          </span>
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
          <span className="global-section-modal__hint">
            Foydalanuvchiga ko‘rinadigan asosiy izoh matni (o‘zbekcha).
          </span>
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

      <div className="global-section-modal__card">
        <h4 className="global-section-modal__block-title">To‘lov ikonkalari (ixtiyoriy)</h4>
        <p className="global-section-modal__meta">
          Faqat &quot;To‘lov shartlari&quot; kabi bloklarda kerak. Masalan Visa, Humo, Uzcard,
          Payme logotiplari.
        </p>

        {draft.paymentIcons.map((item, index) => (
          <div key={item.id} className="global-section-modal__saved-item">
            <div className="global-section-modal__grid global-section-modal__grid--2 global-section-modal__saved-item-edit">
              <ImageUploadField
                label={`${index + 1}-to‘lov ikonkasi`}
                value={item.src}
                onChange={(next) => onChangePaymentIcon(item.id, 'src', next)}
                onUploadStateChange={onUploadStateChange}
              />
              <label className="global-section-modal__field">
                <span className="global-section-modal__label">Alt matn (UZ)</span>
                <input
                  className="global-section-modal__input"
                  value={item.altUz}
                  onChange={(e) => onChangePaymentIcon(item.id, 'altUz', e.target.value)}
                />
              </label>
              <label className="global-section-modal__field">
                <span className="global-section-modal__label">Alt matn (RU)</span>
                <input
                  className="global-section-modal__input"
                  value={item.altRu}
                  onChange={(e) => onChangePaymentIcon(item.id, 'altRu', e.target.value)}
                />
              </label>
              {item.src ? (
                <div className="global-section-modal__saved-thumb-wrap">
                  <img
                    src={toAbsoluteImageUrl(item.src)}
                    alt={item.altUz || 'payment icon'}
                    className="global-section-modal__saved-thumb"
                  />
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="global-section-modal__danger-link"
              onClick={() => onRemovePaymentIcon(item.id)}
            >
              Ikonkani o‘chirish
            </button>
          </div>
        ))}

        <div className="global-section-modal__saved-actions">
          <button type="button" className="global-section-modal__ghost-btn" onClick={onAddPaymentIcon}>
            <PlusOutlined />
            <span>To‘lov ikonkasi qo‘shish</span>
          </button>
        </div>
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

export default function ProductPolicyForm({ visible }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [createDraft, setCreateDraft] = useState(buildEmptyDraft());
  const [editingOrder, setEditingOrder] = useState(null);
  const [editingDraft, setEditingDraft] = useState(null);
  const [isCreateIconOpen, setIsCreateIconOpen] = useState(false);
  const [isEditIconOpen, setIsEditIconOpen] = useState(false);
  const [activeUploads, setActiveUploads] = useState(0);

  const handleUploadStateChange = (isUploading) => {
    setActiveUploads((prev) => {
      const next = prev + (isUploading ? 1 : -1);
      return next < 0 ? 0 : next;
    });
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchProductPolicyBlocks();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Product policy ma'lumotlarini yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) loadData();
  }, [visible]);

  const changeCreateField = (field, value) =>
    setCreateDraft((prev) => ({ ...prev, [field]: value }));
  const changeEditField = (field, value) =>
    setEditingDraft((prev) => ({ ...prev, [field]: value }));

  const changeCreatePaymentIcon = (id, field, value) => {
    setCreateDraft((prev) => ({
      ...prev,
      paymentIcons: (prev.paymentIcons || []).map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const changeEditPaymentIcon = (id, field, value) => {
    setEditingDraft((prev) => ({
      ...prev,
      paymentIcons: (prev.paymentIcons || []).map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const addCreatePaymentIcon = () => {
    setCreateDraft((prev) => ({
      ...prev,
      paymentIcons: [...(prev.paymentIcons || []), createPaymentIconDraft()],
    }));
  };

  const addEditPaymentIcon = () => {
    setEditingDraft((prev) => ({
      ...prev,
      paymentIcons: [...(prev.paymentIcons || []), createPaymentIconDraft()],
    }));
  };

  const removeCreatePaymentIcon = (id) => {
    setCreateDraft((prev) => ({
      ...prev,
      paymentIcons: (prev.paymentIcons || []).filter((item) => item.id !== id),
    }));
  };

  const removeEditPaymentIcon = (id) => {
    setEditingDraft((prev) => ({
      ...prev,
      paymentIcons: (prev.paymentIcons || []).filter((item) => item.id !== id),
    }));
  };

  const handleCreate = async () => {
    setSaving(true);
    setError('');
    try {
      await createProductPolicyBlock(normalizePayload(createDraft));
      setCreateDraft(buildEmptyDraft());
      setIsCreateIconOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message || "Product policy blokini qo'shib bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (editingOrder == null || !editingDraft) return;
    setUpdating(true);
    setError('');
    try {
      await updateProductPolicyBlock(editingOrder, normalizePayload(editingDraft));
      setEditingOrder(null);
      setEditingDraft(null);
      setIsEditIconOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message || "Product policy blokini yangilab bo'lmadi");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (order) => {
    const ok = window.confirm("Bu product policy bloki o'chirilsinmi?");
    if (!ok) return;
    setUpdating(true);
    setError('');
    try {
      await deleteProductPolicyBlock(order);
      if (editingOrder === order) {
        setEditingOrder(null);
        setEditingDraft(null);
        setIsEditIconOpen(false);
      }
      await loadData();
    } catch (err) {
      setError(err.message || "Product policy blokini o'chirib bo'lmadi");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="global-section-modal__form-stack">
      <div className="global-section-modal__card">
        <div className="global-section-modal__row-between">
          <h3 className="global-section-modal__block-title">Product policy</h3>
          <button type="button" className="global-section-modal__ghost-btn" onClick={loadData}>
            <ReloadOutlined />
            <span>Yangilash</span>
          </button>
        </div>
        <p className="global-section-modal__meta">
          Bu bloklar mahsulot sahifasi va savat modalidagi siyosat qismida ko‘rinadi. Har bir
          blokda ikonka, sarlavha, matn va ixtiyoriy to‘lov ikonkalari bo‘ladi.
        </p>
        {loading ? <p className="global-section-modal__state">Yuklanmoqda...</p> : null}
      </div>

      <div className="global-section-modal__card">
        <h3 className="global-section-modal__block-title">Saqlangan policy bloklari</h3>
        {!loading && rows.length === 0 ? (
          <p className="global-section-modal__state">Hozircha policy bloki yo‘q</p>
        ) : null}
        <div className="global-section-modal__list">
          {rows.map((row) => (
            <div key={row.order} className="global-section-modal__saved-card">
              <div className="global-section-modal__row-between">
                <div>
                  <div className="global-section-modal__saved-name">
                    #{row.order} | {row?.block?.title?.uz || '-'} / {row?.block?.title?.ru || '-'}
                  </div>
                  <div className="global-section-modal__meta">
                    icon: {row?.block?.icon || '-'} | divider:{' '}
                    {row?.block?.divider !== false ? 'ha' : "yo'q"} | paymentIcons:{' '}
                    {Array.isArray(row?.block?.paymentIcons) ? row.block.paymentIcons.length : 0}
                  </div>
                  <div className="global-section-modal__meta">UZ: {row?.block?.text?.uz || '-'}</div>
                </div>
                <div className="global-section-modal__saved-actions">
                  <button
                    type="button"
                    className="global-section-modal__ghost-btn"
                    onClick={() => {
                      setEditingOrder(row.order);
                      setEditingDraft(buildDraftFromRow(row));
                      setIsEditIconOpen(false);
                    }}
                  >
                    Tahrirlash
                  </button>
                  <button
                    type="button"
                    className="global-section-modal__danger-link"
                    onClick={() => handleDelete(row.order)}
                    disabled={updating}
                  >
                    O‘chirish
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingDraft ? (
        <PolicyBlockEditor
          title="Policy blokini tahrirlash"
          draft={editingDraft}
          onChange={changeEditField}
          onChangePaymentIcon={changeEditPaymentIcon}
          onAddPaymentIcon={addEditPaymentIcon}
          onRemovePaymentIcon={removeEditPaymentIcon}
          onSubmit={handleUpdate}
          submitText={updating ? 'Saqlanmoqda...' : 'Saqlash'}
          submitDisabled={updating || activeUploads > 0}
          onCancel={() => {
            setEditingOrder(null);
            setEditingDraft(null);
            setIsEditIconOpen(false);
          }}
          isIconPickerOpen={isEditIconOpen}
          onToggleIconPicker={setIsEditIconOpen}
          onUploadStateChange={handleUploadStateChange}
        />
      ) : null}

      <PolicyBlockEditor
        title="Yangi policy bloki qo‘shish"
        draft={createDraft}
        onChange={changeCreateField}
        onChangePaymentIcon={changeCreatePaymentIcon}
        onAddPaymentIcon={addCreatePaymentIcon}
        onRemovePaymentIcon={removeCreatePaymentIcon}
        onSubmit={handleCreate}
        submitText={saving ? "Qo'shilmoqda..." : "Qo'shish"}
        submitDisabled={saving || activeUploads > 0}
        isIconPickerOpen={isCreateIconOpen}
        onToggleIconPicker={setIsCreateIconOpen}
        onUploadStateChange={handleUploadStateChange}
      />

      {error ? <p className="global-section-modal__error">{error}</p> : null}
    </div>
  );
}
