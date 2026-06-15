import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  fetchAdminProductById,
  fetchProductPickerOptions,
  updateAdminProduct,
} from '../../api/productsAdminApi';
import { fetchAdminCategories } from '../../api/adminCategoriesApi';
import { getLocalizedText } from '../../utils/productDisplay';
import VideoUploadField from '../VideoUploadField/VideoUploadField';
import './ProductEditForm.css';

const LABEL_OPTIONS = [
  {
    value: 'chegirma',
    label: 'Chegirma',
    hint: 'Faqat foiz qo‘lda yoziladi. Matn va icon avtomatik beriladi.',
  },
  {
    value: 'original',
    label: 'Original',
    hint: 'Matn va icon avtomatik beriladi.',
  },
  {
    value: 'superNarx',
    label: 'Super narx',
    hint: "Icon avtomatik: <i class='bx bxs-hot'></i>",
  },
];

function MasterCategoryPicker({ value, options, isOpen, onToggle, onSelect, placeholder = 'Category tanlang' }) {
  const selectedOption = options.find((option) => option.value === value);
  const triggerText = selectedOption?.main || placeholder;

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
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`global-section-modal__category-option${value === option.value ? ' global-section-modal__category-option--active' : ''}`}
              onClick={() => onSelect(option.value)}
            >
              <span className="global-section-modal__category-main">{option.main}</span>
              {option.sub ? (
                <span className="global-section-modal__category-sub">{option.sub}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function createRelatedGroupDraft(index = 0) {
  return {
    localId: `${Date.now()}-${index}`,
    titleUz: '',
    titleRu: '',
    productIds: [],
  };
}

function parseLabelDraftFromProduct(product) {
  const types = [];
  let chegirmaPercent = '';

  for (const label of Array.isArray(product?.labels) ? product.labels : []) {
    const uz = String(label?.text?.uz || '').trim();
    const ru = String(label?.text?.ru || '').trim();
    const icon = String(label?.icon || '');

    if (uz.includes('Super narx') || ru.includes('Супер цена') || icon.includes('bxs-hot')) {
      types.push('superNarx');
      continue;
    }

    if (uz.includes('Original') || ru.includes('Оригинал')) {
      types.push('original');
      continue;
    }

    if (/chegirma|скидка/i.test(`${uz} ${ru}`) || icon.includes('animated-hourglass')) {
      types.push('chegirma');
      const match = uz.match(/(\d+)/) || ru.match(/(\d+)/);
      if (match) chegirmaPercent = match[1];
    }
  }

  return {
    types: [...new Set(types)],
    chegirmaPercent,
  };
}

function buildDraftFromProduct(product) {
  const labelDraft = parseLabelDraftFromProduct(product);

  return {
    sellerId: product?.sellerId || null,
    masterCategoryId: product?.masterCategoryId ? String(product.masterCategoryId) : '',
    category: product?.category || '',
    titleUz: product?.title?.uz || '',
    titleRu: product?.title?.ru || '',
    price: product?.price || '',
    originalPrice: product?.originalPrice || '',
    discountUz: product?.discount?.uz || '',
    discountRu: product?.discount?.ru || '',
    video: product?.video || '',
    labelTypes: labelDraft.types,
    chegirmaPercent: labelDraft.chegirmaPercent,
    relatedGroups: (Array.isArray(product?.relatedGroups) ? product.relatedGroups : []).map(
      (group, index) => ({
        localId: `${Date.now()}-${index}`,
        titleUz: group?.title?.uz || '',
        titleRu: group?.title?.ru || '',
        productIds: Array.isArray(group?.productIds) ? group.productIds.map(Number) : [],
      }),
    ),
  };
}

function buildPayloadFromDraft(draft) {
  return {
    masterCategoryId: draft.masterCategoryId ? Number(draft.masterCategoryId) : null,
    category: draft.category || '',
    title: {
      uz: String(draft.titleUz || '').trim(),
      ru: String(draft.titleRu || '').trim(),
    },
    price: String(draft.price || '').trim(),
    originalPrice: String(draft.originalPrice || '').trim(),
    discount:
      String(draft.discountUz || '').trim() || String(draft.discountRu || '').trim()
        ? {
            uz: String(draft.discountUz || '').trim(),
            ru: String(draft.discountRu || '').trim(),
          }
        : null,
    video: String(draft.video || '').trim(),
    labels: {
      types: draft.labelTypes,
      chegirmaPercent: draft.chegirmaPercent,
    },
    relatedGroups: (draft.relatedGroups || []).map((group) => ({
      title: {
        uz: String(group.titleUz || '').trim(),
        ru: String(group.titleRu || '').trim(),
      },
      productIds: (group.productIds || []).map(Number).filter((id) => Number.isFinite(id)),
    })),
  };
}

function ProductIdPicker({ value, options, usedIds, onSelect, disabled = false, placeholder = 'Mahsulot tanlang' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find((item) => Number(item.id) === Number(value));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter((item) => {
      if (usedIds.has(Number(item.id)) && Number(item.id) !== Number(value)) return false;
      if (!q) return true;
      const titleUz = getLocalizedText(item.title, 'uz').toLowerCase();
      const titleRu = getLocalizedText(item.title, 'ru').toLowerCase();
      return titleUz.includes(q) || titleRu.includes(q) || String(item.id).includes(q);
    });
  }, [options, query, usedIds, value]);

  return (
    <div className="product-edit-form__picker">
      <button
        type="button"
        className="product-edit-form__picker-trigger"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setIsOpen((open) => !open);
        }}
      >
        {disabled
          ? 'Sotuvchi biriktirilmagan'
          : selected
            ? `#${selected.id} — ${getLocalizedText(selected.title, 'uz')}`
            : placeholder}
      </button>
      {isOpen ? (
        <div className="product-edit-form__picker-dropdown">
          <input
            className="global-section-modal__input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Qidirish..."
          />
          <div className="product-edit-form__picker-list">
            {filtered.length === 0 ? (
              <p className="global-section-modal__meta">Mahsulot topilmadi</p>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="product-edit-form__picker-option"
                  onClick={() => {
                    onSelect(item.id);
                    setIsOpen(false);
                    setQuery('');
                  }}
                >
                  <span className="product-edit-form__picker-option-id">#{item.id}</span>
                  <span>{getLocalizedText(item.title, 'uz')}</span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ProductEditForm({ visible, productId, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(null);
  const [pickerOptions, setPickerOptions] = useState([]);
  const [masterCategories, setMasterCategories] = useState([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [activeUploads, setActiveUploads] = useState(0);

  const sellerId = draft?.sellerId || null;

  const masterCategoryOptions = useMemo(
    () =>
      masterCategories.map((item) => ({
        value: String(item.id),
        main: item?.name?.uz || String(item.id),
        sub: item?.name?.ru || '',
      })),
    [masterCategories],
  );

  const loadData = useCallback(async () => {
    if (!visible || productId == null) return;

    setLoading(true);
    setError('');

    try {
      const [product, options, categoriesData] = await Promise.all([
        fetchAdminProductById(productId),
        fetchProductPickerOptions(productId),
        fetchAdminCategories(),
      ]);
      setDraft(buildDraftFromProduct(product));
      setPickerOptions(options);
      setMasterCategories(
        Array.isArray(categoriesData?.masterCategories) ? categoriesData.masterCategories : [],
      );
      setIsCategoryOpen(false);
    } catch (err) {
      setDraft(null);
      setPickerOptions([]);
      setMasterCategories([]);
      setIsCategoryOpen(false);
      setError(err.message || 'Mahsulotni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, [visible, productId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const changeField = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleMasterCategorySelect = (selectedValue) => {
    const selected = masterCategories.find((item) => String(item.id) === String(selectedValue));
    setDraft((prev) => ({
      ...prev,
      masterCategoryId: String(selectedValue),
      category: selected?.name?.uz || '',
    }));
    setIsCategoryOpen(false);
  };

  const toggleLabelType = (type) => {
    setDraft((prev) => {
      const current = new Set(prev.labelTypes || []);
      if (current.has(type)) current.delete(type);
      else current.add(type);
      return { ...prev, labelTypes: [...current] };
    });
  };

  const changeGroupField = (localId, field, value) => {
    setDraft((prev) => ({
      ...prev,
      relatedGroups: (prev.relatedGroups || []).map((group) =>
        group.localId === localId ? { ...group, [field]: value } : group,
      ),
    }));
  };

  const changeGroupProductId = (localId, slotIndex, nextProductId) => {
    setDraft((prev) => ({
      ...prev,
      relatedGroups: (prev.relatedGroups || []).map((group) => {
        if (group.localId !== localId) return group;
        const nextIds = [...(group.productIds || [])];
        nextIds[slotIndex] = Number(nextProductId);
        return { ...group, productIds: nextIds.filter((id) => Number.isFinite(id)) };
      }),
    }));
  };

  const removeGroupProductId = (localId, slotIndex) => {
    setDraft((prev) => ({
      ...prev,
      relatedGroups: (prev.relatedGroups || []).map((group) => {
        if (group.localId !== localId) return group;
        const nextIds = [...(group.productIds || [])];
        nextIds.splice(slotIndex, 1);
        return { ...group, productIds: nextIds };
      }),
    }));
  };

  const addRelatedGroup = () => {
    setDraft((prev) => ({
      ...prev,
      relatedGroups: [
        ...(prev.relatedGroups || []),
        createRelatedGroupDraft((prev.relatedGroups || []).length),
      ],
    }));
  };

  const removeRelatedGroup = (localId) => {
    setDraft((prev) => ({
      ...prev,
      relatedGroups: (prev.relatedGroups || []).filter((group) => group.localId !== localId),
    }));
  };

  const handleSave = async () => {
    if (!draft || productId == null) return;

    setSaving(true);
    setError('');

    try {
      await updateAdminProduct(productId, buildPayloadFromDraft(draft));
      if (typeof onRefresh === 'function') onRefresh();
      await loadData();
    } catch (err) {
      setError(err.message || 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="global-section-modal__form-stack product-edit-form">
      <div className="global-section-modal__card">
        <div className="global-section-modal__row-between">
          <h3 className="global-section-modal__block-title">Mahsulotni tahrirlash</h3>
          <button type="button" className="global-section-modal__ghost-btn" onClick={loadData}>
            <ReloadOutlined />
            <span>Yangilash</span>
          </button>
        </div>
        <p className="global-section-modal__meta">
          Faqat asosiy maydonlar tahrirlanadi. To‘liq mahsulot qo‘shish keyinroq seller
          kabinetida bo‘ladi.
        </p>
        {loading ? <p className="global-section-modal__state">Yuklanmoqda...</p> : null}
        {error ? <p className="global-section-modal__error">{error}</p> : null}
      </div>

      {draft ? (
        <>
          <div className="global-section-modal__card">
            <h3 className="global-section-modal__block-title">Asosiy ma’lumotlar</h3>
            <div className="global-section-modal__grid global-section-modal__grid--2">
              <label className="global-section-modal__field">
                <span className="global-section-modal__label">Sarlavha (uz)</span>
                <input
                  className="global-section-modal__input"
                  value={draft.titleUz}
                  onChange={(event) => changeField('titleUz', event.target.value)}
                />
              </label>
              <label className="global-section-modal__field">
                <span className="global-section-modal__label">Sarlavha (ru)</span>
                <input
                  className="global-section-modal__input"
                  value={draft.titleRu}
                  onChange={(event) => changeField('titleRu', event.target.value)}
                />
              </label>
              <label className="global-section-modal__field global-section-modal__field--full">
                <span className="global-section-modal__label">Category (Master categoriya)</span>
                <MasterCategoryPicker
                  value={draft.masterCategoryId}
                  options={masterCategoryOptions}
                  isOpen={isCategoryOpen}
                  onToggle={() => setIsCategoryOpen((open) => !open)}
                  onSelect={handleMasterCategorySelect}
                />
                <span className="global-section-modal__hint">
                  Tanlangan category avtomatik mahsulot `category` maydoniga yoziladi.
                  {draft.category ? ` Hozir: ${draft.category}` : ''}
                </span>
              </label>
              <label className="global-section-modal__field">
                <span className="global-section-modal__label">Narx (price)</span>
                <input
                  className="global-section-modal__input"
                  value={draft.price}
                  onChange={(event) => changeField('price', event.target.value)}
                />
              </label>
              <label className="global-section-modal__field">
                <span className="global-section-modal__label">Eski narx (originalPrice)</span>
                <input
                  className="global-section-modal__input"
                  value={draft.originalPrice}
                  onChange={(event) => changeField('originalPrice', event.target.value)}
                />
              </label>
              <label className="global-section-modal__field">
                <span className="global-section-modal__label">Chegirma matni (uz)</span>
                <input
                  className="global-section-modal__input"
                  value={draft.discountUz}
                  onChange={(event) => changeField('discountUz', event.target.value)}
                  placeholder="30% chegirma"
                />
              </label>
              <label className="global-section-modal__field">
                <span className="global-section-modal__label">Chegirma matni (ru)</span>
                <input
                  className="global-section-modal__input"
                  value={draft.discountRu}
                  onChange={(event) => changeField('discountRu', event.target.value)}
                  placeholder="30% скидка"
                />
              </label>
            </div>
            <VideoUploadField
              label="Video"
              value={draft.video}
              onChange={(path) => changeField('video', path)}
              onUploadStateChange={(isUploading) =>
                setActiveUploads((count) => (isUploading ? count + 1 : Math.max(0, count - 1)))
              }
            />
          </div>

          <div className="global-section-modal__card">
            <h3 className="global-section-modal__block-title">Label (yorliq) turlari</h3>
            <p className="global-section-modal__hint">
              Chegirma, Original va Super narx tanlov asosida beriladi. Faqat chegirma foizi
              qo‘lda yoziladi.
            </p>
            <div className="product-edit-form__label-options">
              {LABEL_OPTIONS.map((option) => (
                <label key={option.value} className="product-edit-form__label-option">
                  <input
                    type="checkbox"
                    checked={(draft.labelTypes || []).includes(option.value)}
                    onChange={() => toggleLabelType(option.value)}
                  />
                  <span className="product-edit-form__label-option-title">{option.label}</span>
                  <span className="global-section-modal__hint">{option.hint}</span>
                </label>
              ))}
            </div>
            {(draft.labelTypes || []).includes('chegirma') ? (
              <label className="global-section-modal__field">
                <span className="global-section-modal__label">Chegirma foizi</span>
                <input
                  className="global-section-modal__input"
                  value={draft.chegirmaPercent}
                  onChange={(event) => changeField('chegirmaPercent', event.target.value)}
                  placeholder="20"
                />
                <span className="global-section-modal__hint">
                  Masalan: 20 yozilsa label matni avtomatik &quot;Chegirma 20%&quot; bo‘ladi.
                </span>
              </label>
            ) : null}
          </div>

          <div className="global-section-modal__card">
            <div className="global-section-modal__row-between">
              <h3 className="global-section-modal__block-title">Related groups</h3>
              <button type="button" className="global-section-modal__ghost-btn" onClick={addRelatedGroup}>
                <PlusOutlined />
                <span>Boshqa turkum qo‘shish</span>
              </button>
            </div>
            <p className="global-section-modal__hint">
              Har bir turkumda sarlavha va maksimal 3 ta mahsulot ID biriktiriladi. Tanlovda faqat
              shu mahsulot sotuvchisidagi mahsulotlar chiqadi.
            </p>
            {!sellerId ? (
              <p className="global-section-modal__meta">
                Bu mahsulotga sotuvchi biriktirilmagan — related mahsulot tanlash mumkin emas.
              </p>
            ) : null}
            {sellerId && pickerOptions.length === 0 ? (
              <p className="global-section-modal__meta">
                Sotuvchi ({sellerId}) uchun boshqa mahsulot topilmadi.
              </p>
            ) : null}

            {(draft.relatedGroups || []).length === 0 ? (
              <p className="global-section-modal__state">Hozircha related group yo‘q</p>
            ) : null}

            {(draft.relatedGroups || []).map((group, groupIndex) => {
              const usedIds = new Set(
                (draft.relatedGroups || [])
                  .flatMap((item) => item.productIds || [])
                  .map(Number)
                  .filter((id) => Number.isFinite(id)),
              );

              return (
                <div key={group.localId} className="global-section-modal__sub-card product-edit-form__group">
                  <div className="global-section-modal__row-between">
                    <h4 className="global-section-modal__block-title">Turkum #{groupIndex + 1}</h4>
                    <button
                      type="button"
                      className="global-section-modal__danger-link"
                      onClick={() => removeRelatedGroup(group.localId)}
                    >
                      O‘chirish
                    </button>
                  </div>
                  <div className="global-section-modal__grid global-section-modal__grid--2">
                    <label className="global-section-modal__field">
                      <span className="global-section-modal__label">Title (uz)</span>
                      <input
                        className="global-section-modal__input"
                        value={group.titleUz}
                        onChange={(event) =>
                          changeGroupField(group.localId, 'titleUz', event.target.value)
                        }
                      />
                    </label>
                    <label className="global-section-modal__field">
                      <span className="global-section-modal__label">Title (ru)</span>
                      <input
                        className="global-section-modal__input"
                        value={group.titleRu}
                        onChange={(event) =>
                          changeGroupField(group.localId, 'titleRu', event.target.value)
                        }
                      />
                    </label>
                  </div>

                  <div className="product-edit-form__product-slots">
                    {[0, 1, 2].map((slotIndex) => {
                      const currentId = group.productIds?.[slotIndex];
                      const previousFilled =
                        slotIndex === 0 || Number.isFinite(Number(group.productIds?.[slotIndex - 1]));
                      if (!previousFilled) return null;

                      return (
                        <div key={`${group.localId}-${slotIndex}`} className="product-edit-form__product-slot">
                          <span className="global-section-modal__label">
                            Mahsulot {slotIndex + 1}
                          </span>
                          <ProductIdPicker
                            value={currentId}
                            options={pickerOptions}
                            usedIds={usedIds}
                            disabled={!sellerId}
                            onSelect={(id) => changeGroupProductId(group.localId, slotIndex, id)}
                          />
                          {currentId ? (
                            <button
                              type="button"
                              className="global-section-modal__danger-link"
                              onClick={() => removeGroupProductId(group.localId, slotIndex)}
                            >
                              Olib tashlash
                            </button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="global-section-modal__card">
            <button
              type="button"
              className="global-section-modal__btn"
              onClick={handleSave}
              disabled={saving || activeUploads > 0}
            >
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
