import React, { useEffect, useState } from 'react';
import { ArrowLeftOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import {
  createAdminBrandCategory,
  createAdminCountryCategory,
  createAdminFilterValue,
  createAdminMasterCategory,
  deleteAdminBrandCategory,
  deleteAdminCountryCategory,
  deleteAdminFilterValue,
  deleteAdminMasterCategory,
  fetchAdminCategories,
  updateAdminBrandCategory,
  updateAdminCountryCategory,
  updateAdminFilterValue,
  updateAdminMasterCategory,
} from '../../api/adminCategoriesApi';
import {
  createHomeBanner,
  deleteHomeBanner,
  fetchHomeBanners,
  updateHomeBanner,
} from '../../api/homeBannerAdminApi';
import {
  createNavbarItem,
  createNavbarSection,
  deleteNavbarItem,
  deleteNavbarSection,
  fetchNavbarSections,
  toAbsoluteImageUrl,
  updateNavbarItem,
  updateNavbarSection,
} from '../../api/navbarAdminApi';
import {
  createVideoBanner,
  deleteVideoBanner,
  fetchVideoBanners,
  toAbsoluteVideoUrl,
  updateVideoBanner,
} from '../../api/videoBannerAdminApi';
import {
  deleteUzWarehouseData,
  fetchUzWarehouseData,
  updateUzWarehouseData,
} from '../../api/uzWarehouseAdminApi';
import FooterForm from '../FooterForm/FooterForm';
import FlashSaleRulesForm from '../FlashSaleRulesForm/FlashSaleRulesForm';
import ImageUploadField from '../ImageUploadField/ImageUploadField';
import LogisticsInfoForm from '../LogisticsInfoForm/LogisticsInfoForm';
import ProductEditForm from '../ProductEditForm/ProductEditForm';
import ProductPolicyForm from '../ProductPolicyForm/ProductPolicyForm';
import SellerSoldProductsModalContent from '../SellerSoldProductsModalContent/SellerSoldProductsModalContent';
import ProductSellingSellersModalContent from '../ProductSellingSellersModalContent/ProductSellingSellersModalContent';
import SalesStatisticsLegendModalContent from '../SalesStatisticsLegendModalContent/SalesStatisticsLegendModalContent';
import TopSellersStatisticsModalContent from '../TopSellersStatisticsModalContent/TopSellersStatisticsModalContent';
import TopSellingProductsStatisticsModalContent from '../TopSellingProductsStatisticsModalContent/TopSellingProductsStatisticsModalContent';
import ShippingCountryForm from '../ShippingCountryForm/ShippingCountryForm';
import ProductTypeForm from '../ProductTypeForm/ProductTypeForm';
import UzbProductDeliveryInfoForm from '../UzbProductDeliveryInfoForm/UzbProductDeliveryInfoForm';
import VideoUploadField from '../VideoUploadField/VideoUploadField';
import './GlobalSectionModal.css';

const NAVBAR_CATEGORY_OPTIONS = [
  { value: 'Sayoxat uchun asqotade', ru: 'Товары для путешествий' },
  { value: 'Sport va Faol turmush', ru: 'Спорт и активный образ жизни' },
  { value: "Vitaminlar va sog'liq", ru: 'Витамины и здоровье' },
  { value: 'Bolalar tovarlari', ru: 'Товары для детей' },
  { value: "Go'zallik va parvarish", ru: 'Красота и уход' },
  { value: 'Kanselyariya tovarlari', ru: 'Канцелярия' },
  { value: 'Kitoblar', ru: 'Книги' },
  { value: 'Qizlar kiyimi', ru: 'Одежда для девочек' },
  { value: 'Ayollar kiyimi', ru: 'Женская одежда' },
  { value: 'Ayollar poyabzali', ru: 'Женская обувь' },
  { value: "O'g'il bollar kiyimlar", ru: 'Одежда для мальчиков' },
  { value: 'Erkaklar poyabzali', ru: 'Мужская обувь' },
  { value: 'Erkaklar kiyimi', ru: 'Мужская одежда' },
  { value: 'Iqlim texnikasi', ru: 'Климатическая техника' },
  { value: "Go'zallik uchun texnika", ru: 'Техника для красоты' },
  { value: 'Smart gadjetlar', ru: 'Смарт-гаджеты' },
  { value: 'Aksessuarlar', ru: 'Аксессуары' },
  { value: 'Maishiy texnika', ru: 'Бытовая техника' },
  { value: 'Elektronika', ru: 'Электроника' },
];

function buildDefaultNavbarItem(index = 1) {
  return {
    localId: Date.now() + index,
    masterCategoryId: '',
    nameUz: '',
    nameRu: '',
    category: '',
    image: '',
    descriptionUz: '',
    descriptionRu: '',
  };
}

function buildEmptyItemDraft(sectionId) {
  return {
    sectionId,
    itemId: null,
    masterCategoryId: '',
    category: '',
    nameUz: '',
    nameRu: '',
    image: '',
    descriptionUz: '',
    descriptionRu: '',
  };
}

function CategoryPicker({
  value,
  onSelect,
  isOpen,
  onToggle,
  placeholder = 'Category tanlang',
  options = NAVBAR_CATEGORY_OPTIONS,
}) {
  const normalizedOptions = (Array.isArray(options) ? options : [])
    .map((option) => {
      const optionValue = String(option?.value || '').trim();
      if (!optionValue) return null;
      return {
        value: optionValue,
        main: String(option?.main || optionValue).trim() || optionValue,
        sub: String(option?.sub || option?.ru || '').trim(),
      };
    })
    .filter(Boolean);
  const selectedOption = normalizedOptions.find((option) => option.value === value);
  const triggerText = selectedOption?.main || value || placeholder;

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
          {normalizedOptions.map((option) => (
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

function NavbarCategoryForm({ visible }) {
  const [sectionTitleUz, setSectionTitleUz] = useState('');
  const [sectionTitleRu, setSectionTitleRu] = useState('');
  const [items, setItems] = useState([buildDefaultNavbarItem(1)]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [editingTitleUz, setEditingTitleUz] = useState('');
  const [editingTitleRu, setEditingTitleRu] = useState('');
  const [editingItemKey, setEditingItemKey] = useState('');
  const [editingItemDraft, setEditingItemDraft] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [openCreateCategoryItemId, setOpenCreateCategoryItemId] = useState(null);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [addingItemSectionId, setAddingItemSectionId] = useState(null);
  const [addingItemDraft, setAddingItemDraft] = useState(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [activeUploads, setActiveUploads] = useState(0);
  const [masterCategories, setMasterCategories] = useState([]);

  const masterCategoryOptions = masterCategories.map((item) => ({
    value: String(item.id),
    main: item?.name?.uz || String(item.id),
    sub: item?.name?.ru || '',
  }));

  const handleUploadStateChange = (isUploading) => {
    setActiveUploads((prev) => {
      const next = prev + (isUploading ? 1 : -1);
      return next < 0 ? 0 : next;
    });
  };

  const loadSections = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchNavbarSections();
      setSections(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Navbar sectionlarni yuklab bo‘lmadi');
    } finally {
      setLoading(false);
    }
  };

  const loadMasterCategories = async () => {
    try {
      const data = await fetchAdminCategories();
      setMasterCategories(Array.isArray(data?.masterCategories) ? data.masterCategories : []);
    } catch (_err) {
      setMasterCategories([]);
    }
  };

  useEffect(() => {
    if (visible) {
      loadSections();
      loadMasterCategories();
    }
  }, [visible]);

  const resetDraft = () => {
    setSectionTitleUz('');
    setSectionTitleRu('');
    setItems([buildDefaultNavbarItem(1)]);
    setOpenCreateCategoryItemId(null);
  };

  const handleItemChange = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.localId !== id) return item;
        if (field !== 'masterCategoryId') return { ...item, [field]: value };

        const selected = masterCategories.find((opt) => Number(opt.id) === Number(value));
        return {
          ...item,
          masterCategoryId: String(value),
          category: selected?.name?.uz || item.category,
          nameUz: item.nameUz || selected?.name?.uz || item.nameUz,
          nameRu: item.nameRu || selected?.name?.ru || item.nameRu,
        };
      }),
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, buildDefaultNavbarItem(prev.length + 1)]);
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.localId !== id));
  };

  const handleCreateSection = async () => {
    const title = { uz: sectionTitleUz.trim(), ru: sectionTitleRu.trim() };
    const normalizedItems = items
      .map((item) => ({
        masterCategoryId: Number(item.masterCategoryId),
        category: item.category.trim(),
        name: { uz: item.nameUz.trim(), ru: item.nameRu.trim() },
        image: item.image.trim(),
        description: { uz: item.descriptionUz.trim(), ru: item.descriptionRu.trim() },
      }))
      .filter((item) => item.masterCategoryId || item.category || item.name.uz || item.name.ru || item.image || item.description.uz || item.description.ru);

    if (!title.uz || !title.ru) {
      setError("title.uz va title.ru to'ldirilishi shart");
      return;
    }
    if (normalizedItems.length === 0) {
      setError("Kamida bitta navbar item kiriting");
      return;
    }
    for (const [idx, item] of normalizedItems.entries()) {
      if (!item.masterCategoryId || !item.name.uz || !item.name.ru || !item.description.uz || !item.description.ru) {
        setError(`Item #${idx + 1} da majburiy maydonlar bo'sh`);
        return;
      }
      if (!item.image) {
        setError(`Item #${idx + 1} da image yuklanishi shart`);
        return;
      }
    }

    setSaving(true);
    setError('');
    try {
      await createNavbarSection({ title, items: normalizedItems });
      resetDraft();
      await loadSections();
    } catch (err) {
      setError(err.message || 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    const ok = window.confirm('Bu navbar section o‘chirilsinmi?');
    if (!ok) return;
    try {
      await deleteNavbarSection(sectionId);
      if (addingItemSectionId === sectionId) {
        setAddingItemSectionId(null);
        setAddingItemDraft(null);
        setIsAddCategoryOpen(false);
      }
      await loadSections();
    } catch (err) {
      setError(err.message || 'Section o‘chmadi');
    }
  };

  const handleDeleteItem = async (sectionId, itemId) => {
    const ok = window.confirm('Bu item o‘chirilsinmi?');
    if (!ok) return;
    try {
      await deleteNavbarItem(sectionId, itemId);
      await loadSections();
    } catch (err) {
      setError(err.message || 'Item o‘chmadi');
    }
  };

  const startSectionEdit = (section) => {
    setEditingSectionId(section.id);
    setEditingTitleUz(section?.title?.uz || '');
    setEditingTitleRu(section?.title?.ru || '');
    setAddingItemSectionId(null);
    setAddingItemDraft(null);
    setIsAddCategoryOpen(false);
  };

  const cancelSectionEdit = () => {
    setEditingSectionId(null);
    setEditingTitleUz('');
    setEditingTitleRu('');
  };

  const saveSectionEdit = async (sectionId) => {
    const uz = editingTitleUz.trim();
    const ru = editingTitleRu.trim();
    if (!uz || !ru) {
      setError("Section title.uz va title.ru bo'sh bo'lmasligi kerak");
      return;
    }
    setUpdating(true);
    setError('');
    try {
      await updateNavbarSection(sectionId, { title: { uz, ru } });
      await loadSections();
      cancelSectionEdit();
    } catch (err) {
      setError(err.message || "Section tahrirlashda xatolik");
    } finally {
      setUpdating(false);
    }
  };

  const startItemEdit = (sectionId, item) => {
    setEditingItemKey(`${sectionId}-${item.id}`);
    setEditingItemDraft({
      sectionId,
      itemId: item.id,
      masterCategoryId: item.masterCategoryId ? String(item.masterCategoryId) : '',
      category: item.category || '',
      nameUz: item?.name?.uz || '',
      nameRu: item?.name?.ru || '',
      image: item.image || '',
      descriptionUz: item?.description?.uz || '',
      descriptionRu: item?.description?.ru || '',
    });
    setIsEditCategoryOpen(false);
    setAddingItemSectionId(null);
    setAddingItemDraft(null);
    setIsAddCategoryOpen(false);
  };

  const cancelItemEdit = () => {
    setEditingItemKey('');
    setEditingItemDraft(null);
    setIsEditCategoryOpen(false);
  };

  const startAddItem = (sectionId) => {
    setAddingItemSectionId(sectionId);
    setAddingItemDraft(buildEmptyItemDraft(sectionId));
    setIsAddCategoryOpen(false);
    setEditingItemKey('');
    setEditingItemDraft(null);
    setIsEditCategoryOpen(false);
    setError('');
  };

  const cancelAddItem = () => {
    setAddingItemSectionId(null);
    setAddingItemDraft(null);
    setIsAddCategoryOpen(false);
  };

  const saveAddItem = async () => {
    if (!addingItemDraft || !addingItemSectionId) return;

    const payload = {
      masterCategoryId: Number(addingItemDraft.masterCategoryId),
      category: addingItemDraft.category.trim(),
      name: {
        uz: addingItemDraft.nameUz.trim(),
        ru: addingItemDraft.nameRu.trim(),
      },
      image: addingItemDraft.image.trim(),
      description: {
        uz: addingItemDraft.descriptionUz.trim(),
        ru: addingItemDraft.descriptionRu.trim(),
      },
    };

    if (!payload.masterCategoryId || !payload.name.uz || !payload.name.ru || !payload.description.uz || !payload.description.ru) {
      setError("Yangi itemda category, name va description maydonlari to'liq bo'lishi kerak");
      return;
    }
    if (!payload.image) {
      setError("Yangi itemda image yuklanishi shart");
      return;
    }

    setUpdating(true);
    setError('');
    try {
      await createNavbarItem(addingItemSectionId, payload);
      await loadSections();
      cancelAddItem();
    } catch (err) {
      setError(err.message || "Yangi item qo'shishda xatolik");
    } finally {
      setUpdating(false);
    }
  };

  const saveItemEdit = async () => {
    if (!editingItemDraft) return;
    const payload = {
      masterCategoryId: Number(editingItemDraft.masterCategoryId),
      category: editingItemDraft.category.trim(),
      name: {
        uz: editingItemDraft.nameUz.trim(),
        ru: editingItemDraft.nameRu.trim(),
      },
      image: editingItemDraft.image.trim(),
      description: {
        uz: editingItemDraft.descriptionUz.trim(),
        ru: editingItemDraft.descriptionRu.trim(),
      },
    };

    if (!payload.masterCategoryId || !payload.name.uz || !payload.name.ru || !payload.description.uz || !payload.description.ru) {
      setError("Itemda category, name va description maydonlari to'liq bo'lishi kerak");
      return;
    }
    if (!payload.image) {
      setError("Itemda image yuklanishi shart");
      return;
    }

    setUpdating(true);
    setError('');
    try {
      await updateNavbarItem(editingItemDraft.sectionId, editingItemDraft.itemId, payload);
      await loadSections();
      cancelItemEdit();
    } catch (err) {
      setError(err.message || "Item tahrirlashda xatolik");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="global-section-modal__form-stack">
      <div className="global-section-modal__card">
        <h3 className="global-section-modal__block-title">Navbar section title</h3>
        <div className="global-section-modal__grid global-section-modal__grid--2">
          <label className="global-section-modal__field">
            <span className="global-section-modal__label">title.uz</span>
            <input
              className="global-section-modal__input"
              value={sectionTitleUz}
              onChange={(e) => setSectionTitleUz(e.target.value)}
              placeholder="Masalan: Har xil turdagi mahsulotlar"
            />
          </label>
          <label className="global-section-modal__field">
            <span className="global-section-modal__label">title.ru</span>
            <input
              className="global-section-modal__input"
              value={sectionTitleRu}
              onChange={(e) => setSectionTitleRu(e.target.value)}
              placeholder="Например: Разные товары"
            />
          </label>
        </div>
      </div>

      <div className="global-section-modal__card">
        <div className="global-section-modal__row-between">
          <h3 className="global-section-modal__block-title">Navbar items</h3>
          <button type="button" className="global-section-modal__btn" onClick={addItem}>
            <PlusOutlined />
            <span>Item qo'shish</span>
          </button>
        </div>

        <div className="global-section-modal__form-stack">
          {items.map((item, idx) => (
            <div key={item.localId} className="global-section-modal__sub-card">
              <div className="global-section-modal__row-between">
                <strong>Item #{idx + 1}</strong>
                {items.length > 1 ? (
                  <button
                    type="button"
                    className="global-section-modal__link-btn"
                    onClick={() => removeItem(item.localId)}
                  >
                    O'chirish
                  </button>
                ) : null}
              </div>

              <div className="global-section-modal__grid global-section-modal__grid--3">
                <label className="global-section-modal__field global-section-modal__field--full">
                  <span className="global-section-modal__label">category</span>
                  <CategoryPicker
                    value={item.masterCategoryId}
                    options={masterCategoryOptions}
                    isOpen={openCreateCategoryItemId === item.localId}
                    onToggle={() =>
                      setOpenCreateCategoryItemId((prev) =>
                        prev === item.localId ? null : item.localId,
                      )
                    }
                    onSelect={(selectedValue) => {
                      handleItemChange(item.localId, 'masterCategoryId', selectedValue);
                      setOpenCreateCategoryItemId(null);
                    }}
                  />
                </label>
                <label className="global-section-modal__field">
                  <span className="global-section-modal__label">name.uz</span>
                  <input
                    className="global-section-modal__input"
                    value={item.nameUz}
                    onChange={(e) => handleItemChange(item.localId, 'nameUz', e.target.value)}
                    placeholder="Masalan: Elektronika"
                  />
                </label>
                <label className="global-section-modal__field">
                  <span className="global-section-modal__label">name.ru</span>
                  <input
                    className="global-section-modal__input"
                    value={item.nameRu}
                    onChange={(e) => handleItemChange(item.localId, 'nameRu', e.target.value)}
                    placeholder="Например: Электроника"
                  />
                </label>
                <label className="global-section-modal__field global-section-modal__field--full">
                  <ImageUploadField
                    label="image"
                    value={item.image}
                    onChange={(uploadedPath) =>
                      handleItemChange(item.localId, 'image', uploadedPath)
                    }
                    onUploadStateChange={handleUploadStateChange}
                  />
                </label>
                <label className="global-section-modal__field">
                  <span className="global-section-modal__label">description.uz</span>
                  <textarea
                    className="global-section-modal__textarea"
                    value={item.descriptionUz}
                    onChange={(e) => handleItemChange(item.localId, 'descriptionUz', e.target.value)}
                    rows={3}
                  />
                </label>
                <label className="global-section-modal__field">
                  <span className="global-section-modal__label">description.ru</span>
                  <textarea
                    className="global-section-modal__textarea"
                    value={item.descriptionRu}
                    onChange={(e) => handleItemChange(item.localId, 'descriptionRu', e.target.value)}
                    rows={3}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="global-section-modal__actions">
          <button
            type="button"
            className="global-section-modal__btn"
            onClick={handleCreateSection}
            disabled={saving || activeUploads > 0}
          >
            {saving ? 'Saqlanmoqda...' : activeUploads > 0 ? 'Rasm yuklanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </div>

      <div className="global-section-modal__card">
        <div className="global-section-modal__row-between">
          <h3 className="global-section-modal__block-title">Saqlangan navbar sectionlar</h3>
          <button type="button" className="global-section-modal__ghost-btn" onClick={loadSections}>
            <ReloadOutlined />
            <span>Yangilash</span>
          </button>
        </div>

        {loading ? <p className="global-section-modal__state">Yuklanmoqda...</p> : null}
        {!loading && sections.length === 0 ? (
          <p className="global-section-modal__state">Hozircha section yo'q</p>
        ) : null}

        <div className="global-section-modal__list">
          {sections.map((section) => (
            <div key={section.id} className="global-section-modal__saved-card">
              <div className="global-section-modal__row-between">
                <div>
                  <strong>{section.title?.uz || 'Nomsiz section'}</strong>
                  <div className="global-section-modal__meta">
                    id: {section.id} | ru: {section.title?.ru || '-'}
                  </div>
                </div>
                <div className="global-section-modal__saved-actions">
                  {editingSectionId !== section.id ? (
                    <button
                      type="button"
                      className="global-section-modal__ghost-btn"
                      onClick={() => startAddItem(section.id)}
                    >
                      Item qo'shish
                    </button>
                  ) : null}
                  {editingSectionId === section.id ? (
                    <>
                      <button
                        type="button"
                        className="global-section-modal__ghost-btn"
                        onClick={() => saveSectionEdit(section.id)}
                        disabled={updating}
                      >
                        Saqlash
                      </button>
                      <button
                        type="button"
                        className="global-section-modal__link-btn"
                        onClick={cancelSectionEdit}
                      >
                        Bekor
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="global-section-modal__ghost-btn"
                      onClick={() => startSectionEdit(section)}
                    >
                      Tahrirlash
                    </button>
                  )}
                  <button
                    type="button"
                    className="global-section-modal__danger-btn"
                    onClick={() => handleDeleteSection(section.id)}
                  >
                    <DeleteOutlined />
                    <span>Section o'chirish</span>
                  </button>
                </div>
              </div>

              {editingSectionId === section.id ? (
                <div className="global-section-modal__grid global-section-modal__grid--2 global-section-modal__edit-block">
                  <label className="global-section-modal__field">
                    <span className="global-section-modal__label">title.uz</span>
                    <input
                      className="global-section-modal__input"
                      value={editingTitleUz}
                      onChange={(e) => setEditingTitleUz(e.target.value)}
                    />
                  </label>
                  <label className="global-section-modal__field">
                    <span className="global-section-modal__label">title.ru</span>
                    <input
                      className="global-section-modal__input"
                      value={editingTitleRu}
                      onChange={(e) => setEditingTitleRu(e.target.value)}
                    />
                  </label>
                </div>
              ) : null}

              {addingItemSectionId === section.id && addingItemDraft ? (
                <div className="global-section-modal__saved-item-edit global-section-modal__edit-block">
                  <div className="global-section-modal__grid global-section-modal__grid--2">
                    <label className="global-section-modal__field global-section-modal__field--full">
                      <span className="global-section-modal__label">category</span>
                      <CategoryPicker
                        value={addingItemDraft.masterCategoryId}
                        options={masterCategoryOptions}
                        isOpen={isAddCategoryOpen}
                        onToggle={() => setIsAddCategoryOpen((prev) => !prev)}
                        onSelect={(selectedValue) => {
                          const selected = masterCategories.find((opt) => Number(opt.id) === Number(selectedValue));
                          setAddingItemDraft((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  masterCategoryId: String(selectedValue),
                                  category: selected?.name?.uz || prev.category,
                                  nameUz: prev.nameUz || selected?.name?.uz || prev.nameUz,
                                  nameRu: prev.nameRu || selected?.name?.ru || prev.nameRu,
                                }
                              : prev,
                          );
                          setIsAddCategoryOpen(false);
                        }}
                      />
                    </label>
                    <label className="global-section-modal__field">
                      <span className="global-section-modal__label">name.uz</span>
                      <input
                        className="global-section-modal__input"
                        value={addingItemDraft.nameUz}
                        onChange={(e) =>
                          setAddingItemDraft((prev) =>
                            prev ? { ...prev, nameUz: e.target.value } : prev,
                          )
                        }
                      />
                    </label>
                    <label className="global-section-modal__field">
                      <span className="global-section-modal__label">name.ru</span>
                      <input
                        className="global-section-modal__input"
                        value={addingItemDraft.nameRu}
                        onChange={(e) =>
                          setAddingItemDraft((prev) =>
                            prev ? { ...prev, nameRu: e.target.value } : prev,
                          )
                        }
                      />
                    </label>
                    <label className="global-section-modal__field global-section-modal__field--full">
                      <ImageUploadField
                        label="image"
                        value={addingItemDraft.image}
                        onChange={(uploadedPath) =>
                          setAddingItemDraft((prev) =>
                            prev ? { ...prev, image: uploadedPath } : prev,
                          )
                        }
                        onUploadStateChange={handleUploadStateChange}
                      />
                    </label>
                    <label className="global-section-modal__field">
                      <span className="global-section-modal__label">description.uz</span>
                      <textarea
                        className="global-section-modal__textarea"
                        rows={3}
                        value={addingItemDraft.descriptionUz}
                        onChange={(e) =>
                          setAddingItemDraft((prev) =>
                            prev ? { ...prev, descriptionUz: e.target.value } : prev,
                          )
                        }
                      />
                    </label>
                    <label className="global-section-modal__field">
                      <span className="global-section-modal__label">description.ru</span>
                      <textarea
                        className="global-section-modal__textarea"
                        rows={3}
                        value={addingItemDraft.descriptionRu}
                        onChange={(e) =>
                          setAddingItemDraft((prev) =>
                            prev ? { ...prev, descriptionRu: e.target.value } : prev,
                          )
                        }
                      />
                    </label>
                  </div>

                  <div className="global-section-modal__saved-actions global-section-modal__saved-actions--end">
                    <button
                      type="button"
                      className="global-section-modal__ghost-btn"
                      onClick={saveAddItem}
                      disabled={updating || activeUploads > 0}
                    >
                      {activeUploads > 0 ? 'Rasm yuklanmoqda...' : "Yangi itemni saqlash"}
                    </button>
                    <button
                      type="button"
                      className="global-section-modal__link-btn"
                      onClick={cancelAddItem}
                    >
                      Bekor
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="global-section-modal__saved-items">
                {(section.items || []).map((item) => (
                  <div key={`${section.id}-${item.id}`} className="global-section-modal__saved-item">
                    {editingItemKey === `${section.id}-${item.id}` && editingItemDraft ? (
                      <div className="global-section-modal__saved-item-edit">
                        <div className="global-section-modal__grid global-section-modal__grid--2">
                          <label className="global-section-modal__field global-section-modal__field--full">
                            <span className="global-section-modal__label">category</span>
                            <CategoryPicker
                              value={editingItemDraft.masterCategoryId}
                              options={masterCategoryOptions}
                              isOpen={isEditCategoryOpen}
                              onToggle={() => setIsEditCategoryOpen((prev) => !prev)}
                              onSelect={(selectedValue) => {
                                const selected = masterCategories.find((opt) => Number(opt.id) === Number(selectedValue));
                                setEditingItemDraft((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        masterCategoryId: String(selectedValue),
                                        category: selected?.name?.uz || prev.category,
                                        nameUz: prev.nameUz || selected?.name?.uz || prev.nameUz,
                                        nameRu: prev.nameRu || selected?.name?.ru || prev.nameRu,
                                      }
                                    : prev,
                                );
                                setIsEditCategoryOpen(false);
                              }}
                            />
                          </label>
                          <label className="global-section-modal__field">
                            <span className="global-section-modal__label">name.uz</span>
                            <input
                              className="global-section-modal__input"
                              value={editingItemDraft.nameUz}
                              onChange={(e) =>
                                setEditingItemDraft((prev) =>
                                  prev ? { ...prev, nameUz: e.target.value } : prev,
                                )
                              }
                            />
                          </label>
                          <label className="global-section-modal__field">
                            <span className="global-section-modal__label">name.ru</span>
                            <input
                              className="global-section-modal__input"
                              value={editingItemDraft.nameRu}
                              onChange={(e) =>
                                setEditingItemDraft((prev) =>
                                  prev ? { ...prev, nameRu: e.target.value } : prev,
                                )
                              }
                            />
                          </label>
                          <label className="global-section-modal__field global-section-modal__field--full">
                            <ImageUploadField
                              label="image"
                              value={editingItemDraft.image}
                              onChange={(uploadedPath) =>
                                setEditingItemDraft((prev) =>
                                  prev ? { ...prev, image: uploadedPath } : prev,
                                )
                              }
                              onUploadStateChange={handleUploadStateChange}
                            />
                          </label>
                          <label className="global-section-modal__field">
                            <span className="global-section-modal__label">description.uz</span>
                            <textarea
                              className="global-section-modal__textarea"
                              rows={3}
                              value={editingItemDraft.descriptionUz}
                              onChange={(e) =>
                                setEditingItemDraft((prev) =>
                                  prev ? { ...prev, descriptionUz: e.target.value } : prev,
                                )
                              }
                            />
                          </label>
                          <label className="global-section-modal__field">
                            <span className="global-section-modal__label">description.ru</span>
                            <textarea
                              className="global-section-modal__textarea"
                              rows={3}
                              value={editingItemDraft.descriptionRu}
                              onChange={(e) =>
                                setEditingItemDraft((prev) =>
                                  prev ? { ...prev, descriptionRu: e.target.value } : prev,
                                )
                              }
                            />
                          </label>
                        </div>

                        <div className="global-section-modal__saved-actions global-section-modal__saved-actions--end">
                          <button
                            type="button"
                            className="global-section-modal__ghost-btn"
                            onClick={saveItemEdit}
                            disabled={updating || activeUploads > 0}
                          >
                            {activeUploads > 0 ? 'Rasm yuklanmoqda...' : 'Itemni saqlash'}
                          </button>
                          <button
                            type="button"
                            className="global-section-modal__link-btn"
                            onClick={cancelItemEdit}
                          >
                            Bekor
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <div className="global-section-modal__saved-name">
                            {item.name?.uz || '-'} ({item.category || '-'})
                          </div>
                          <div className="global-section-modal__meta">
                            itemId: {item.id} | ru: {item.name?.ru || '-'}
                          </div>
                          {item.image ? (
                            <div className="global-section-modal__saved-thumb-wrap">
                              <img
                                src={toAbsoluteImageUrl(item.image)}
                                alt={item.name?.uz || 'Navbar item image'}
                                className="global-section-modal__saved-thumb"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          ) : null}
                        </div>
                        <div className="global-section-modal__saved-actions">
                          <button
                            type="button"
                            className="global-section-modal__ghost-btn"
                            onClick={() => startItemEdit(section.id, item)}
                          >
                            Tahrirlash
                          </button>
                          <button
                            type="button"
                            className="global-section-modal__danger-link"
                            onClick={() => handleDeleteItem(section.id, item.id)}
                          >
                            O'chirish
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {error ? <p className="global-section-modal__error">{error}</p> : null}
    </div>
  );
}

function buildDefaultCountryCategoryDraft() {
  return {
    nameUz: '',
    nameRu: '',
    image: '',
    flag: '',
    link: '',
    filterValue: '',
  };
}

function buildDefaultBrandCategoryDraft() {
  return {
    name: '',
    image: '',
    link: '',
    filterValue: '',
  };
}

function buildDefaultFilterValueDraft() {
  return {
    type: 'country',
    filterValue: '',
  };
}

function getFilterTypeLabel(type) {
  if (type === 'brand') return 'Brend filteri';
  if (type === 'country') return 'Davlat filteri';
  return type;
}

function FilterValueFields({ draft, onChange }) {
  return (
    <>
      <label className="global-section-modal__field">
        <span className="global-section-modal__label">Filter turi</span>
        <select
          className="global-section-modal__select"
          value={draft.type}
          onChange={(e) => onChange('type', e.target.value)}
        >
          <option value="country">Davlat filteri</option>
          <option value="brand">Brend filteri</option>
        </select>
        <span className="global-section-modal__hint">
          Bu qiymat davlat uchunmi yoki brend uchunmi ekanini belgilaydi. Mahsulot va banner
          filterlarida shu tur bo‘yicha ishlatiladi.
        </span>
      </label>
      <label className="global-section-modal__field">
        <span className="global-section-modal__label">Tizim kodi (ichki nom)</span>
        <input
          className="global-section-modal__input"
          value={draft.filterValue}
          onChange={(e) => onChange('filterValue', e.target.value)}
          placeholder="Masalan: usa, xitoy, nike, puma"
        />
        <span className="global-section-modal__hint">
          Tizim ichida saqlanadigan qisqa nom. Kichik lotin harflarida yozing. Xaridor buni
          to‘g‘ridan-to‘g‘ri ko‘rmaydi — mahsulot va filter sozlamalarida ishlatiladi.
        </span>
      </label>
    </>
  );
}

function BrandCountryCategoriesForm({ visible, mode = 'brand-country-categories' }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [activeUploads, setActiveUploads] = useState(0);
  const [data, setData] = useState({
    masterCategories: [],
    categoriyCountries: [],
    categoriesBrend: [],
    filterValues: [],
  });

  const [countryDraft, setCountryDraft] = useState(buildDefaultCountryCategoryDraft());
  const [editingCountryId, setEditingCountryId] = useState(null);
  const [editingCountryDraft, setEditingCountryDraft] = useState(null);
  const [isCountryFilterOpen, setIsCountryFilterOpen] = useState(false);
  const [isCountryEditFilterOpen, setIsCountryEditFilterOpen] = useState(false);

  const [brandDraft, setBrandDraft] = useState(buildDefaultBrandCategoryDraft());
  const [editingBrandId, setEditingBrandId] = useState(null);
  const [editingBrandDraft, setEditingBrandDraft] = useState(null);
  const [isBrandFilterOpen, setIsBrandFilterOpen] = useState(false);
  const [isBrandEditFilterOpen, setIsBrandEditFilterOpen] = useState(false);

  const [filterDraft, setFilterDraft] = useState(buildDefaultFilterValueDraft());
  const [editingFilterId, setEditingFilterId] = useState(null);
  const [editingFilterDraft, setEditingFilterDraft] = useState(null);
  const [masterDraft, setMasterDraft] = useState({
    nameUz: '',
    nameRu: '',
    displayNameUz: '',
    displayNameEn: '',
    displayNameZh: '',
  });
  const [editingMasterId, setEditingMasterId] = useState(null);
  const [editingMasterDraft, setEditingMasterDraft] = useState(null);

  const handleUploadStateChange = (isUploading) => {
    setActiveUploads((prev) => {
      const next = prev + (isUploading ? 1 : -1);
      return next < 0 ? 0 : next;
    });
  };

  const loadCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await fetchAdminCategories();
      setData({
        masterCategories: Array.isArray(payload?.masterCategories) ? payload.masterCategories : [],
        categoriyCountries: Array.isArray(payload?.categoriyCountries) ? payload.categoriyCountries : [],
        categoriesBrend: Array.isArray(payload?.categoriesBrend) ? payload.categoriesBrend : [],
        filterValues: Array.isArray(payload?.filterValues) ? payload.filterValues : [],
      });
    } catch (err) {
      setError(err.message || "Brand/Country kategoriyalarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadCategories();
    }
  }, [visible]);

  const countryFilterOptions = (data.filterValues || [])
    .filter((item) => item.type === 'country')
    .map((item) => ({
      value: item.filterValue || '',
      main: item.filterValue || '',
      sub: 'Country filter',
    }));

  const brandFilterOptions = (data.filterValues || [])
    .filter((item) => item.type === 'brand')
    .map((item) => ({
      value: item.filterValue || '',
      main: item.filterValue || '',
      sub: 'Brand filter',
    }));

  const normalizeMasterPayload = (draft) => ({
    name: {
      uz: draft.nameUz.trim(),
      ru: draft.nameRu.trim(),
    },
    displayName: {
      uz: draft.displayNameUz.trim(),
      en: draft.displayNameEn.trim(),
      zh: draft.displayNameZh.trim(),
    },
  });

  const validateMasterPayload = (payload) => {
    if (!payload.name.uz || !payload.name.ru) {
      return 'Master category: name.uz va name.ru majburiy';
    }
    if (!payload.displayName.uz) {
      return 'Master category: UI matni (uz) majburiy';
    }
    return '';
  };

  const handleCreateMaster = async () => {
    const payload = normalizeMasterPayload(masterDraft);
    const validationError = validateMasterPayload(payload);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createAdminMasterCategory(payload);
      setMasterDraft({
        nameUz: '',
        nameRu: '',
        displayNameUz: '',
        displayNameEn: '',
        displayNameZh: '',
      });
      await loadCategories();
    } catch (err) {
      setError(err.message || "Master category qo'shib bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  const startMasterEdit = (item) => {
    setEditingMasterId(item.id);
    setEditingMasterDraft({
      nameUz: item?.name?.uz || '',
      nameRu: item?.name?.ru || '',
      displayNameUz: item?.displayName?.uz || item?.name?.uz || '',
      displayNameEn: item?.displayName?.en || '',
      displayNameZh: item?.displayName?.zh || '',
    });
    setError('');
  };

  const cancelMasterEdit = () => {
    setEditingMasterId(null);
    setEditingMasterDraft(null);
  };

  const saveMasterEdit = async () => {
    if (!editingMasterId || !editingMasterDraft) return;
    const payload = normalizeMasterPayload(editingMasterDraft);
    const validationError = validateMasterPayload(payload);
    if (validationError) {
      setError(validationError);
      return;
    }
    setUpdating(true);
    setError('');
    try {
      await updateAdminMasterCategory(editingMasterId, payload);
      cancelMasterEdit();
      await loadCategories();
    } catch (err) {
      setError(err.message || "Master category tahrirlab bo'lmadi");
    } finally {
      setUpdating(false);
    }
  };

  const removeMaster = async (masterId) => {
    const ok = window.confirm("Bu master category o'chirilsinmi?");
    if (!ok) return;
    setError('');
    try {
      await deleteAdminMasterCategory(masterId);
      if (editingMasterId === masterId) {
        cancelMasterEdit();
      }
      await loadCategories();
    } catch (err) {
      setError(err.message || "Master category o'chirib bo'lmadi");
    }
  };

  const normalizeCountryPayload = (draft) => ({
    name: {
      uz: draft.nameUz.trim(),
      ru: draft.nameRu.trim(),
    },
    image: draft.image.trim(),
    flag: draft.flag.trim(),
    link: draft.link.trim(),
    filterValue: draft.filterValue.trim(),
  });

  const normalizeBrandPayload = (draft) => ({
    name: draft.name.trim(),
    image: draft.image.trim(),
    link: draft.link.trim(),
    filterValue: draft.filterValue.trim(),
  });

  const normalizeFilterPayload = (draft) => ({
    type: draft.type,
    filterValue: draft.filterValue.trim(),
  });

  const validateCountryPayload = (payload) => {
    if (!payload.name.uz || !payload.name.ru) return "Country: name.uz va name.ru majburiy";
    if (!payload.image) return "Country: image majburiy";
    if (!payload.link) return "Country: link majburiy";
    if (!payload.filterValue) return "Country: filterValue majburiy";
    return '';
  };

  const validateBrandPayload = (payload) => {
    if (!payload.name) return "Brand: name majburiy";
    if (!payload.image) return "Brand: image majburiy";
    if (!payload.link) return "Brand: link majburiy";
    if (!payload.filterValue) return "Brand: filterValue majburiy";
    return '';
  };

  const validateFilterPayload = (payload) => {
    if (payload.type !== 'country' && payload.type !== 'brand') {
      return 'Filter turi noto‘g‘ri tanlangan';
    }
    if (!payload.filterValue) {
      return 'Tizim kodi (ichki nom) to‘ldirilishi shart';
    }
    return '';
  };

  const handleCreateFilter = async () => {
    const payload = normalizeFilterPayload(filterDraft);
    const validationError = validateFilterPayload(payload);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createAdminFilterValue(payload);
      setFilterDraft(buildDefaultFilterValueDraft());
      await loadCategories();
    } catch (err) {
      setError(err.message || "Filter value qo'shib bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  const startFilterEdit = (item) => {
    setEditingFilterId(item.id);
    setEditingFilterDraft({
      type: item.type || 'country',
      filterValue: item.filterValue || '',
    });
  };

  const cancelFilterEdit = () => {
    setEditingFilterId(null);
    setEditingFilterDraft(null);
  };

  const saveFilterEdit = async () => {
    if (!editingFilterId || !editingFilterDraft) return;
    const payload = normalizeFilterPayload(editingFilterDraft);
    const validationError = validateFilterPayload(payload);
    if (validationError) {
      setError(validationError);
      return;
    }
    setUpdating(true);
    setError('');
    try {
      await updateAdminFilterValue(editingFilterId, payload);
      cancelFilterEdit();
      await loadCategories();
    } catch (err) {
      setError(err.message || "Filter value tahrirlab bo'lmadi");
    } finally {
      setUpdating(false);
    }
  };

  const removeFilter = async (filterId) => {
    const ok = window.confirm("Bu filter value o'chirilsinmi?");
    if (!ok) return;
    setError('');
    try {
      await deleteAdminFilterValue(filterId);
      if (editingFilterId === filterId) {
        cancelFilterEdit();
      }
      await loadCategories();
    } catch (err) {
      setError(err.message || "Filter value o'chirib bo'lmadi");
    }
  };

  const handleCreateCountry = async () => {
    const payload = normalizeCountryPayload(countryDraft);
    const validationError = validateCountryPayload(payload);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createAdminCountryCategory(payload);
      setCountryDraft(buildDefaultCountryCategoryDraft());
      setIsCountryFilterOpen(false);
      await loadCategories();
    } catch (err) {
      setError(err.message || "Country category qo'shib bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  const startCountryEdit = (item) => {
    setEditingCountryId(item.id);
    setEditingCountryDraft({
      nameUz: item?.name?.uz || '',
      nameRu: item?.name?.ru || '',
      image: item.image || '',
      flag: item.flag || '',
      link: item.link || '',
      filterValue: item.filterValue || '',
    });
    setIsCountryEditFilterOpen(false);
    setError('');
  };

  const cancelCountryEdit = () => {
    setEditingCountryId(null);
    setEditingCountryDraft(null);
    setIsCountryEditFilterOpen(false);
  };

  const saveCountryEdit = async () => {
    if (!editingCountryId || !editingCountryDraft) return;
    const payload = normalizeCountryPayload(editingCountryDraft);
    const validationError = validateCountryPayload(payload);
    if (validationError) {
      setError(validationError);
      return;
    }
    setUpdating(true);
    setError('');
    try {
      await updateAdminCountryCategory(editingCountryId, payload);
      cancelCountryEdit();
      await loadCategories();
    } catch (err) {
      setError(err.message || "Country category tahrirlab bo'lmadi");
    } finally {
      setUpdating(false);
    }
  };

  const removeCountry = async (countryId) => {
    const ok = window.confirm("Bu country category o'chirilsinmi?");
    if (!ok) return;
    setError('');
    try {
      await deleteAdminCountryCategory(countryId);
      if (editingCountryId === countryId) {
        cancelCountryEdit();
      }
      await loadCategories();
    } catch (err) {
      setError(err.message || "Country category o'chirib bo'lmadi");
    }
  };

  const handleCreateBrand = async () => {
    const payload = normalizeBrandPayload(brandDraft);
    const validationError = validateBrandPayload(payload);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createAdminBrandCategory(payload);
      setBrandDraft(buildDefaultBrandCategoryDraft());
      setIsBrandFilterOpen(false);
      await loadCategories();
    } catch (err) {
      setError(err.message || "Brand category qo'shib bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  const startBrandEdit = (item) => {
    setEditingBrandId(item.id);
    setEditingBrandDraft({
      name: item.name || '',
      image: item.image || '',
      link: item.link || '',
      filterValue: item.filterValue || '',
    });
    setIsBrandEditFilterOpen(false);
    setError('');
  };

  const cancelBrandEdit = () => {
    setEditingBrandId(null);
    setEditingBrandDraft(null);
    setIsBrandEditFilterOpen(false);
  };

  const saveBrandEdit = async () => {
    if (!editingBrandId || !editingBrandDraft) return;
    const payload = normalizeBrandPayload(editingBrandDraft);
    const validationError = validateBrandPayload(payload);
    if (validationError) {
      setError(validationError);
      return;
    }
    setUpdating(true);
    setError('');
    try {
      await updateAdminBrandCategory(editingBrandId, payload);
      cancelBrandEdit();
      await loadCategories();
    } catch (err) {
      setError(err.message || "Brand category tahrirlab bo'lmadi");
    } finally {
      setUpdating(false);
    }
  };

  const removeBrand = async (brandId) => {
    const ok = window.confirm("Bu brand category o'chirilsinmi?");
    if (!ok) return;
    setError('');
    try {
      await deleteAdminBrandCategory(brandId);
      if (editingBrandId === brandId) {
        cancelBrandEdit();
      }
      await loadCategories();
    } catch (err) {
      setError(err.message || "Brand category o'chirib bo'lmadi");
    }
  };

  const showMaster = mode === 'master-categories';
  const showFilterValues = mode === 'brand-country-filter-values';
  const showBrandCountryCategories = mode === 'brand-country-categories';

  return (
    <div className="global-section-modal__form-stack">
      {showMaster ? (
      <div className="global-section-modal__card">
        <h3 className="global-section-modal__block-title">MasterCategory</h3>
        <div className="global-section-modal__grid global-section-modal__grid--2">
          <label className="global-section-modal__field">
            <span className="global-section-modal__label">name.uz</span>
            <input
              className="global-section-modal__input"
              value={masterDraft.nameUz}
              onChange={(e) => setMasterDraft((prev) => ({ ...prev, nameUz: e.target.value }))}
            />
          </label>
          <label className="global-section-modal__field">
            <span className="global-section-modal__label">name.ru</span>
            <input
              className="global-section-modal__input"
              value={masterDraft.nameRu}
              onChange={(e) => setMasterDraft((prev) => ({ ...prev, nameRu: e.target.value }))}
            />
          </label>
        </div>
        <p className="global-section-modal__meta">
          Seller admin UI matni (uz / en / zh). Bo&apos;sh qoldirilsa, en va zh uchun uz ishlatiladi.
        </p>
        <div className="global-section-modal__grid global-section-modal__grid--3">
          <label className="global-section-modal__field">
            <span className="global-section-modal__label">UI matni uz</span>
            <input
              className="global-section-modal__input"
              value={masterDraft.displayNameUz}
              onChange={(e) =>
                setMasterDraft((prev) => ({ ...prev, displayNameUz: e.target.value }))
              }
            />
          </label>
          <label className="global-section-modal__field">
            <span className="global-section-modal__label">UI matni en</span>
            <input
              className="global-section-modal__input"
              value={masterDraft.displayNameEn}
              onChange={(e) =>
                setMasterDraft((prev) => ({ ...prev, displayNameEn: e.target.value }))
              }
            />
          </label>
          <label className="global-section-modal__field">
            <span className="global-section-modal__label">UI matni zh</span>
            <input
              className="global-section-modal__input"
              value={masterDraft.displayNameZh}
              onChange={(e) =>
                setMasterDraft((prev) => ({ ...prev, displayNameZh: e.target.value }))
              }
            />
          </label>
        </div>
        <div className="global-section-modal__actions">
          <button
            type="button"
            className="global-section-modal__btn"
            onClick={handleCreateMaster}
            disabled={saving}
          >
            {saving ? 'Saqlanmoqda...' : "Master category qo'shish"}
          </button>
        </div>
        <div className="global-section-modal__list">
          {(data.masterCategories || []).map((item) => (
            <div key={item.id} className="global-section-modal__saved-card">
              {editingMasterId === item.id && editingMasterDraft ? (
                <div className="global-section-modal__saved-item-edit">
                  <div className="global-section-modal__grid global-section-modal__grid--2">
                    <label className="global-section-modal__field">
                      <span className="global-section-modal__label">name.uz</span>
                      <input
                        className="global-section-modal__input"
                        value={editingMasterDraft.nameUz}
                        onChange={(e) =>
                          setEditingMasterDraft((prev) =>
                            prev ? { ...prev, nameUz: e.target.value } : prev,
                          )
                        }
                      />
                    </label>
                    <label className="global-section-modal__field">
                      <span className="global-section-modal__label">name.ru</span>
                      <input
                        className="global-section-modal__input"
                        value={editingMasterDraft.nameRu}
                        onChange={(e) =>
                          setEditingMasterDraft((prev) =>
                            prev ? { ...prev, nameRu: e.target.value } : prev,
                          )
                        }
                      />
                    </label>
                  </div>
                  <div className="global-section-modal__grid global-section-modal__grid--3">
                    <label className="global-section-modal__field">
                      <span className="global-section-modal__label">UI matni uz</span>
                      <input
                        className="global-section-modal__input"
                        value={editingMasterDraft.displayNameUz}
                        onChange={(e) =>
                          setEditingMasterDraft((prev) =>
                            prev ? { ...prev, displayNameUz: e.target.value } : prev,
                          )
                        }
                      />
                    </label>
                    <label className="global-section-modal__field">
                      <span className="global-section-modal__label">UI matni en</span>
                      <input
                        className="global-section-modal__input"
                        value={editingMasterDraft.displayNameEn}
                        onChange={(e) =>
                          setEditingMasterDraft((prev) =>
                            prev ? { ...prev, displayNameEn: e.target.value } : prev,
                          )
                        }
                      />
                    </label>
                    <label className="global-section-modal__field">
                      <span className="global-section-modal__label">UI matni zh</span>
                      <input
                        className="global-section-modal__input"
                        value={editingMasterDraft.displayNameZh}
                        onChange={(e) =>
                          setEditingMasterDraft((prev) =>
                            prev ? { ...prev, displayNameZh: e.target.value } : prev,
                          )
                        }
                      />
                    </label>
                  </div>
                  <div className="global-section-modal__saved-actions global-section-modal__saved-actions--end">
                    <button
                      type="button"
                      className="global-section-modal__ghost-btn"
                      onClick={saveMasterEdit}
                      disabled={updating}
                    >
                      Saqlash
                    </button>
                    <button
                      type="button"
                      className="global-section-modal__link-btn"
                      onClick={cancelMasterEdit}
                    >
                      Bekor
                    </button>
                  </div>
                </div>
              ) : (
                <div className="global-section-modal__saved-item">
                  <div>
                    <div className="global-section-modal__saved-name">
                      {item?.name?.uz || '-'} / {item?.name?.ru || '-'}
                    </div>
                    <div className="global-section-modal__meta">
                      UI: {item?.displayName?.uz || item?.name?.uz || '-'}
                      {' / '}
                      {item?.displayName?.en || item?.displayName?.uz || item?.name?.uz || '-'}
                      {' / '}
                      {item?.displayName?.zh || item?.displayName?.uz || item?.name?.uz || '-'}
                    </div>
                    <div className="global-section-modal__meta">id: {item.id}</div>
                  </div>
                  <div className="global-section-modal__saved-actions">
                    <button
                      type="button"
                      className="global-section-modal__ghost-btn"
                      onClick={() => startMasterEdit(item)}
                    >
                      Tahrirlash
                    </button>
                    <button
                      type="button"
                      className="global-section-modal__danger-link"
                      onClick={() => removeMaster(item.id)}
                    >
                      O'chirish
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      ) : null}

      {showFilterValues ? (
      <div className="global-section-modal__card">
        <h3 className="global-section-modal__block-title">Brend va davlat filter qiymatlari</h3>
        <p className="global-section-modal__meta">
          Bu yerda mahsulotlar, bannerlar va filterlar uchun ishlatiladigan ichki kodlar
          qo‘shiladi. Avval shu ro‘yxatga qiymat qo‘shing, keyin “Brend va davlat categoriya”
          bo‘limida kartochkalarga bog‘lang.
        </p>
        <div className="global-section-modal__grid global-section-modal__grid--2">
          <FilterValueFields
            draft={filterDraft}
            onChange={(field, value) => setFilterDraft((prev) => ({ ...prev, [field]: value }))}
          />
        </div>
        <div className="global-section-modal__actions">
          <button
            type="button"
            className="global-section-modal__btn"
            onClick={handleCreateFilter}
            disabled={saving}
          >
            {saving ? 'Saqlanmoqda...' : "Yangi filter qo'shish"}
          </button>
        </div>
        <div className="global-section-modal__list">
          {(data.filterValues || []).map((item) => (
            <div key={item.id} className="global-section-modal__saved-card">
              {editingFilterId === item.id && editingFilterDraft ? (
                <div className="global-section-modal__saved-item-edit">
                  <div className="global-section-modal__grid global-section-modal__grid--2">
                    <FilterValueFields
                      draft={editingFilterDraft}
                      onChange={(field, value) =>
                        setEditingFilterDraft((prev) => (prev ? { ...prev, [field]: value } : prev))
                      }
                    />
                  </div>
                  <div className="global-section-modal__saved-actions global-section-modal__saved-actions--end">
                    <button
                      type="button"
                      className="global-section-modal__ghost-btn"
                      onClick={saveFilterEdit}
                      disabled={updating}
                    >
                      Saqlash
                    </button>
                    <button
                      type="button"
                      className="global-section-modal__link-btn"
                      onClick={cancelFilterEdit}
                    >
                      Bekor
                    </button>
                  </div>
                </div>
              ) : (
                <div className="global-section-modal__saved-item">
                  <div className="global-section-modal__saved-name">
                    {getFilterTypeLabel(item.type)} — {item.filterValue}
                  </div>
                  <div className="global-section-modal__saved-actions">
                    <button
                      type="button"
                      className="global-section-modal__ghost-btn"
                      onClick={() => startFilterEdit(item)}
                    >
                      Tahrirlash
                    </button>
                    <button
                      type="button"
                      className="global-section-modal__danger-link"
                      onClick={() => removeFilter(item.id)}
                    >
                      O'chirish
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      ) : null}

      {showBrandCountryCategories ? (
      <div className="global-section-modal__card">
        <div className="global-section-modal__row-between">
          <h3 className="global-section-modal__block-title">CountryCategories</h3>
          <button type="button" className="global-section-modal__ghost-btn" onClick={loadCategories}>
            <ReloadOutlined />
            <span>Yangilash</span>
          </button>
        </div>
        <div className="global-section-modal__grid global-section-modal__grid--2">
          <label className="global-section-modal__field">
            <span className="global-section-modal__label">name.uz</span>
            <input
              className="global-section-modal__input"
              value={countryDraft.nameUz}
              onChange={(e) => setCountryDraft((prev) => ({ ...prev, nameUz: e.target.value }))}
            />
          </label>
          <label className="global-section-modal__field">
            <span className="global-section-modal__label">name.ru</span>
            <input
              className="global-section-modal__input"
              value={countryDraft.nameRu}
              onChange={(e) => setCountryDraft((prev) => ({ ...prev, nameRu: e.target.value }))}
            />
          </label>
          <label className="global-section-modal__field">
            <ImageUploadField
              label="image"
              value={countryDraft.image}
              onChange={(uploadedPath) =>
                setCountryDraft((prev) => ({ ...prev, image: uploadedPath }))
              }
              onUploadStateChange={handleUploadStateChange}
            />
          </label>
          <label className="global-section-modal__field">
            <ImageUploadField
              label="flag (ixtiyoriy)"
              value={countryDraft.flag}
              onChange={(uploadedPath) =>
                setCountryDraft((prev) => ({ ...prev, flag: uploadedPath }))
              }
              onUploadStateChange={handleUploadStateChange}
            />
          </label>
          <label className="global-section-modal__field">
            <span className="global-section-modal__label">link</span>
            <input
              className="global-section-modal__input"
              value={countryDraft.link}
              onChange={(e) => setCountryDraft((prev) => ({ ...prev, link: e.target.value }))}
              placeholder="/category/china"
            />
          </label>
          <label className="global-section-modal__field">
            <span className="global-section-modal__label">filterValue</span>
            <CategoryPicker
              value={countryDraft.filterValue}
              options={countryFilterOptions}
              placeholder="Country filter tanlang"
              isOpen={isCountryFilterOpen}
              onToggle={() => setIsCountryFilterOpen((prev) => !prev)}
              onSelect={(selectedValue) => {
                setCountryDraft((prev) => ({ ...prev, filterValue: selectedValue }));
                setIsCountryFilterOpen(false);
              }}
            />
          </label>
        </div>
        <div className="global-section-modal__actions">
          <button
            type="button"
            className="global-section-modal__btn"
            onClick={handleCreateCountry}
            disabled={saving || activeUploads > 0}
          >
            {saving ? 'Saqlanmoqda...' : activeUploads > 0 ? 'Rasm yuklanmoqda...' : "Country qo'shish"}
          </button>
        </div>

        {loading ? <p className="global-section-modal__state">Yuklanmoqda...</p> : null}
        <div className="global-section-modal__list">
          {(data.categoriyCountries || []).map((item) => (
            <div key={item.id} className="global-section-modal__saved-card">
              {editingCountryId === item.id && editingCountryDraft ? (
                <div className="global-section-modal__saved-item-edit">
                  <div className="global-section-modal__grid global-section-modal__grid--2">
                    <label className="global-section-modal__field">
                      <span className="global-section-modal__label">name.uz</span>
                      <input
                        className="global-section-modal__input"
                        value={editingCountryDraft.nameUz}
                        onChange={(e) =>
                          setEditingCountryDraft((prev) =>
                            prev ? { ...prev, nameUz: e.target.value } : prev,
                          )
                        }
                      />
                    </label>
                    <label className="global-section-modal__field">
                      <span className="global-section-modal__label">name.ru</span>
                      <input
                        className="global-section-modal__input"
                        value={editingCountryDraft.nameRu}
                        onChange={(e) =>
                          setEditingCountryDraft((prev) =>
                            prev ? { ...prev, nameRu: e.target.value } : prev,
                          )
                        }
                      />
                    </label>
                    <label className="global-section-modal__field">
                      <ImageUploadField
                        label="image"
                        value={editingCountryDraft.image}
                        onChange={(uploadedPath) =>
                          setEditingCountryDraft((prev) =>
                            prev ? { ...prev, image: uploadedPath } : prev,
                          )
                        }
                        onUploadStateChange={handleUploadStateChange}
                      />
                    </label>
                    <label className="global-section-modal__field">
                      <ImageUploadField
                        label="flag (ixtiyoriy)"
                        value={editingCountryDraft.flag}
                        onChange={(uploadedPath) =>
                          setEditingCountryDraft((prev) =>
                            prev ? { ...prev, flag: uploadedPath } : prev,
                          )
                        }
                        onUploadStateChange={handleUploadStateChange}
                      />
                    </label>
                    <label className="global-section-modal__field">
                      <span className="global-section-modal__label">link</span>
                      <input
                        className="global-section-modal__input"
                        value={editingCountryDraft.link}
                        onChange={(e) =>
                          setEditingCountryDraft((prev) =>
                            prev ? { ...prev, link: e.target.value } : prev,
                          )
                        }
                      />
                    </label>
                    <label className="global-section-modal__field">
                      <span className="global-section-modal__label">filterValue</span>
                      <CategoryPicker
                        value={editingCountryDraft.filterValue}
                        options={countryFilterOptions}
                        placeholder="Country filter tanlang"
                        isOpen={isCountryEditFilterOpen}
                        onToggle={() => setIsCountryEditFilterOpen((prev) => !prev)}
                        onSelect={(selectedValue) => {
                          setEditingCountryDraft((prev) =>
                            prev ? { ...prev, filterValue: selectedValue } : prev,
                          );
                          setIsCountryEditFilterOpen(false);
                        }}
                      />
                    </label>
                  </div>
                  <div className="global-section-modal__saved-actions global-section-modal__saved-actions--end">
                    <button
                      type="button"
                      className="global-section-modal__ghost-btn"
                      onClick={saveCountryEdit}
                      disabled={updating || activeUploads > 0}
                    >
                      {activeUploads > 0 ? 'Rasm yuklanmoqda...' : 'Saqlash'}
                    </button>
                    <button
                      type="button"
                      className="global-section-modal__link-btn"
                      onClick={cancelCountryEdit}
                    >
                      Bekor
                    </button>
                  </div>
                </div>
              ) : (
                <div className="global-section-modal__saved-item">
                  <div>
                    <div className="global-section-modal__saved-name">
                      {item?.name?.uz || '-'} / {item?.name?.ru || '-'}
                    </div>
                    <div className="global-section-modal__meta">
                      id: {item.id} | filterValue: {item.filterValue || '-'}
                    </div>
                  </div>
                  <div className="global-section-modal__saved-actions">
                    <button
                      type="button"
                      className="global-section-modal__ghost-btn"
                      onClick={() => startCountryEdit(item)}
                    >
                      Tahrirlash
                    </button>
                    <button
                      type="button"
                      className="global-section-modal__danger-link"
                      onClick={() => removeCountry(item.id)}
                    >
                      O'chirish
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      ) : null}

      {showBrandCountryCategories ? (
      <div className="global-section-modal__card">
        <h3 className="global-section-modal__block-title">BrandCategories</h3>
        <div className="global-section-modal__grid global-section-modal__grid--2">
          <label className="global-section-modal__field">
            <span className="global-section-modal__label">name</span>
            <input
              className="global-section-modal__input"
              value={brandDraft.name}
              onChange={(e) => setBrandDraft((prev) => ({ ...prev, name: e.target.value }))}
            />
          </label>
          <label className="global-section-modal__field">
            <span className="global-section-modal__label">link</span>
            <input
              className="global-section-modal__input"
              value={brandDraft.link}
              onChange={(e) => setBrandDraft((prev) => ({ ...prev, link: e.target.value }))}
              placeholder="/category/puma"
            />
          </label>
          <label className="global-section-modal__field">
            <ImageUploadField
              label="image"
              value={brandDraft.image}
              onChange={(uploadedPath) =>
                setBrandDraft((prev) => ({ ...prev, image: uploadedPath }))
              }
              onUploadStateChange={handleUploadStateChange}
            />
          </label>
          <label className="global-section-modal__field">
            <span className="global-section-modal__label">filterValue</span>
            <CategoryPicker
              value={brandDraft.filterValue}
              options={brandFilterOptions}
              placeholder="Brand filter tanlang"
              isOpen={isBrandFilterOpen}
              onToggle={() => setIsBrandFilterOpen((prev) => !prev)}
              onSelect={(selectedValue) => {
                setBrandDraft((prev) => ({ ...prev, filterValue: selectedValue }));
                setIsBrandFilterOpen(false);
              }}
            />
          </label>
        </div>
        <div className="global-section-modal__actions">
          <button
            type="button"
            className="global-section-modal__btn"
            onClick={handleCreateBrand}
            disabled={saving || activeUploads > 0}
          >
            {saving ? 'Saqlanmoqda...' : activeUploads > 0 ? 'Rasm yuklanmoqda...' : "Brand qo'shish"}
          </button>
        </div>

        <div className="global-section-modal__list">
          {(data.categoriesBrend || []).map((item) => (
            <div key={item.id} className="global-section-modal__saved-card">
              {editingBrandId === item.id && editingBrandDraft ? (
                <div className="global-section-modal__saved-item-edit">
                  <div className="global-section-modal__grid global-section-modal__grid--2">
                    <label className="global-section-modal__field">
                      <span className="global-section-modal__label">name</span>
                      <input
                        className="global-section-modal__input"
                        value={editingBrandDraft.name}
                        onChange={(e) =>
                          setEditingBrandDraft((prev) =>
                            prev ? { ...prev, name: e.target.value } : prev,
                          )
                        }
                      />
                    </label>
                    <label className="global-section-modal__field">
                      <span className="global-section-modal__label">link</span>
                      <input
                        className="global-section-modal__input"
                        value={editingBrandDraft.link}
                        onChange={(e) =>
                          setEditingBrandDraft((prev) =>
                            prev ? { ...prev, link: e.target.value } : prev,
                          )
                        }
                      />
                    </label>
                    <label className="global-section-modal__field">
                      <ImageUploadField
                        label="image"
                        value={editingBrandDraft.image}
                        onChange={(uploadedPath) =>
                          setEditingBrandDraft((prev) =>
                            prev ? { ...prev, image: uploadedPath } : prev,
                          )
                        }
                        onUploadStateChange={handleUploadStateChange}
                      />
                    </label>
                    <label className="global-section-modal__field">
                      <span className="global-section-modal__label">filterValue</span>
                      <CategoryPicker
                        value={editingBrandDraft.filterValue}
                        options={brandFilterOptions}
                        placeholder="Brand filter tanlang"
                        isOpen={isBrandEditFilterOpen}
                        onToggle={() => setIsBrandEditFilterOpen((prev) => !prev)}
                        onSelect={(selectedValue) => {
                          setEditingBrandDraft((prev) =>
                            prev ? { ...prev, filterValue: selectedValue } : prev,
                          );
                          setIsBrandEditFilterOpen(false);
                        }}
                      />
                    </label>
                  </div>
                  <div className="global-section-modal__saved-actions global-section-modal__saved-actions--end">
                    <button
                      type="button"
                      className="global-section-modal__ghost-btn"
                      onClick={saveBrandEdit}
                      disabled={updating || activeUploads > 0}
                    >
                      {activeUploads > 0 ? 'Rasm yuklanmoqda...' : 'Saqlash'}
                    </button>
                    <button
                      type="button"
                      className="global-section-modal__link-btn"
                      onClick={cancelBrandEdit}
                    >
                      Bekor
                    </button>
                  </div>
                </div>
              ) : (
                <div className="global-section-modal__saved-item">
                  <div>
                    <div className="global-section-modal__saved-name">{item.name || '-'}</div>
                    <div className="global-section-modal__meta">
                      id: {item.id} | filterValue: {item.filterValue || '-'}
                    </div>
                  </div>
                  <div className="global-section-modal__saved-actions">
                    <button
                      type="button"
                      className="global-section-modal__ghost-btn"
                      onClick={() => startBrandEdit(item)}
                    >
                      Tahrirlash
                    </button>
                    <button
                      type="button"
                      className="global-section-modal__danger-link"
                      onClick={() => removeBrand(item.id)}
                    >
                      O'chirish
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      ) : null}

      {error ? <p className="global-section-modal__error">{error}</p> : null}
    </div>
  );
}

function buildDefaultHomeBannerDraft() {
  return {
    type: 'image',
    srcUz: '',
    srcRu: '',
    clickable: false,
    masterCategoryId: '',
    category: '',
    countriesCategories: '',
    brandCategories: '',
  };
}

function HomeBannerForm({ visible }) {
  const [draft, setDraft] = useState(buildDefaultHomeBannerDraft());
  const [banners, setBanners] = useState([]);
  const [categoryMaster, setCategoryMaster] = useState({ masterCategories: [], filterValues: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState(null);
  const [editingDraft, setEditingDraft] = useState(null);
  const [error, setError] = useState('');
  const [activeUploads, setActiveUploads] = useState(0);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [isCreateCountryOpen, setIsCreateCountryOpen] = useState(false);
  const [isCreateBrandOpen, setIsCreateBrandOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [isEditCountryOpen, setIsEditCountryOpen] = useState(false);
  const [isEditBrandOpen, setIsEditBrandOpen] = useState(false);

  const handleUploadStateChange = (isUploading) => {
    setActiveUploads((prev) => {
      const next = prev + (isUploading ? 1 : -1);
      return next < 0 ? 0 : next;
    });
  };

  const loadBanners = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchHomeBanners();
      setBanners(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Bannerlarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryMaster = async () => {
    try {
      const data = await fetchAdminCategories();
      setCategoryMaster({
        masterCategories: Array.isArray(data?.masterCategories) ? data.masterCategories : [],
        filterValues: Array.isArray(data?.filterValues) ? data.filterValues : [],
      });
    } catch (err) {
      setCategoryMaster({ masterCategories: [], filterValues: [] });
      setError(err.message || "Category ro'yxatini yuklab bo'lmadi");
    }
  };

  const masterCategoryOptions = (categoryMaster.masterCategories || []).map((item) => ({
    value: String(item.id),
    main: item?.name?.uz || String(item.id),
    sub: item?.name?.ru || '',
  }));

  const countryOptions = (categoryMaster.filterValues || [])
    .filter((item) => item.type === 'country')
    .map((item) => ({
      value: item.filterValue || '',
      main: item.filterValue || '',
      sub: 'Country filter',
    }));

  const brandOptions = (categoryMaster.filterValues || [])
    .filter((item) => item.type === 'brand')
    .map((item) => ({
      value: item.filterValue || '',
      main: item.filterValue || '',
      sub: 'Brand filter',
    }));

  useEffect(() => {
    if (visible) {
      loadBanners();
      loadCategoryMaster();
    }
  }, [visible]);

  const validatePayload = (payload, prefixText = "Ma'lumot") => {
    if (!payload.type.trim()) {
      return `${prefixText}: type tanlanishi shart`;
    }
    if (!payload.src.uz.trim() || !payload.src.ru.trim()) {
      return `${prefixText}: src.uz va src.ru majburiy`;
    }
    if (payload.clickable && !payload.masterCategoryId) {
      return `${prefixText}: clickable yoqilgan bo'lsa category tanlang`;
    }
    return '';
  };

  const mapDraftToPayload = (targetDraft) => ({
    type: targetDraft.type.trim() || 'image',
    src: {
      uz: targetDraft.srcUz.trim(),
      ru: targetDraft.srcRu.trim(),
    },
    clickable: Boolean(targetDraft.clickable),
    masterCategoryId: Number(targetDraft.masterCategoryId) || undefined,
    category: targetDraft.category.trim(),
    countriesCategories: targetDraft.countriesCategories.trim(),
    brandCategories: targetDraft.brandCategories.trim(),
  });

  const handleCreate = async () => {
    const payload = mapDraftToPayload(draft);
    const validationError = validatePayload(payload, 'Yangi banner');
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createHomeBanner(payload);
      setDraft(buildDefaultHomeBannerDraft());
      setIsCreateCategoryOpen(false);
      setIsCreateCountryOpen(false);
      setIsCreateBrandOpen(false);
      await loadBanners();
    } catch (err) {
      setError(err.message || "Banner qo'shib bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (banner) => {
    setEditingBannerId(banner.id);
    setEditingDraft({
      type: banner.type || 'image',
      srcUz: banner?.src?.uz || '',
      srcRu: banner?.src?.ru || '',
      clickable: Boolean(banner.clickable),
      masterCategoryId: banner.masterCategoryId ? String(banner.masterCategoryId) : '',
      category: banner.category || '',
      countriesCategories: banner.countriesCategories || '',
      brandCategories: banner.brandCategories || '',
    });
    setIsEditCategoryOpen(false);
    setIsEditCountryOpen(false);
    setIsEditBrandOpen(false);
    setError('');
  };

  const cancelEdit = () => {
    setEditingBannerId(null);
    setEditingDraft(null);
    setIsEditCategoryOpen(false);
    setIsEditCountryOpen(false);
    setIsEditBrandOpen(false);
  };

  const saveEdit = async () => {
    if (!editingDraft || !editingBannerId) return;
    const payload = mapDraftToPayload(editingDraft);
    const validationError = validatePayload(payload, 'Tahrirlash');
    if (validationError) {
      setError(validationError);
      return;
    }
    setUpdating(true);
    setError('');
    try {
      await updateHomeBanner(editingBannerId, payload);
      await loadBanners();
      cancelEdit();
    } catch (err) {
      setError(err.message || "Bannerni tahrirlab bo'lmadi");
    } finally {
      setUpdating(false);
    }
  };

  const removeBanner = async (bannerId) => {
    const ok = window.confirm("Bu banner o'chirilsinmi?");
    if (!ok) return;
    setError('');
    try {
      await deleteHomeBanner(bannerId);
      if (editingBannerId === bannerId) {
        cancelEdit();
      }
      await loadBanners();
    } catch (err) {
      setError(err.message || "Bannerni o'chirib bo'lmadi");
    }
  };

  return (
    <div className="global-section-modal__form-stack">
      <div className="global-section-modal__card">
        <h3 className="global-section-modal__block-title">Yangi home banner</h3>
        <div className="global-section-modal__grid global-section-modal__grid--2">
          <label className="global-section-modal__field">
            <span className="global-section-modal__label">type</span>
            <select
              className="global-section-modal__select"
              value={draft.type}
              onChange={(e) => setDraft((prev) => ({ ...prev, type: e.target.value }))}
            >
              <option value="image">image</option>
            </select>
          </label>

          <label className="global-section-modal__field">
            <span className="global-section-modal__label">clickable</span>
            <label className="global-section-modal__check">
              <input
                type="checkbox"
                checked={draft.clickable}
                onChange={(e) => setDraft((prev) => ({ ...prev, clickable: e.target.checked }))}
              />
              <span>Banner bosilganda category sahifaga o'tadi</span>
            </label>
          </label>

          <label className="global-section-modal__field global-section-modal__field--full">
            <span className="global-section-modal__label">category</span>
            <CategoryPicker
              value={draft.masterCategoryId}
              options={masterCategoryOptions}
              placeholder={draft.clickable ? 'Category tanlang' : 'Ixtiyoriy'}
              isOpen={isCreateCategoryOpen}
              onToggle={() => setIsCreateCategoryOpen((prev) => !prev)}
              onSelect={(selectedValue) => {
                const selected = (categoryMaster.masterCategories || []).find(
                  (item) => Number(item.id) === Number(selectedValue),
                );
                setDraft((prev) => ({
                  ...prev,
                  masterCategoryId: String(selectedValue),
                  category: selected?.name?.uz || prev.category,
                }));
                setIsCreateCategoryOpen(false);
              }}
            />
          </label>

          <label className="global-section-modal__field">
            <span className="global-section-modal__label">countriesCategories</span>
            <CategoryPicker
              value={draft.countriesCategories}
              placeholder="Davlat filter tanlang"
              options={countryOptions}
              isOpen={isCreateCountryOpen}
              onToggle={() => setIsCreateCountryOpen((prev) => !prev)}
              onSelect={(selectedValue) => {
                setDraft((prev) => ({ ...prev, countriesCategories: selectedValue }));
                setIsCreateCountryOpen(false);
              }}
            />
          </label>

          <label className="global-section-modal__field">
            <span className="global-section-modal__label">brandCategories</span>
            <CategoryPicker
              value={draft.brandCategories}
              placeholder="Brend filter tanlang"
              options={brandOptions}
              isOpen={isCreateBrandOpen}
              onToggle={() => setIsCreateBrandOpen((prev) => !prev)}
              onSelect={(selectedValue) => {
                setDraft((prev) => ({ ...prev, brandCategories: selectedValue }));
                setIsCreateBrandOpen(false);
              }}
            />
          </label>

          <label className="global-section-modal__field">
            <ImageUploadField
              label="src.uz (image)"
              value={draft.srcUz}
              onChange={(uploadedPath) =>
                setDraft((prev) => ({ ...prev, srcUz: uploadedPath }))
              }
              onUploadStateChange={handleUploadStateChange}
            />
          </label>

          <label className="global-section-modal__field">
            <ImageUploadField
              label="src.ru (image)"
              value={draft.srcRu}
              onChange={(uploadedPath) =>
                setDraft((prev) => ({ ...prev, srcRu: uploadedPath }))
              }
              onUploadStateChange={handleUploadStateChange}
            />
          </label>
        </div>

        <div className="global-section-modal__actions">
          <button
            type="button"
            className="global-section-modal__btn"
            onClick={handleCreate}
            disabled={saving || activeUploads > 0}
          >
            {saving ? 'Saqlanmoqda...' : activeUploads > 0 ? 'Rasm yuklanmoqda...' : "Qo'shish"}
          </button>
        </div>
      </div>

      <div className="global-section-modal__card">
        <div className="global-section-modal__row-between">
          <h3 className="global-section-modal__block-title">Saqlangan home bannerlar</h3>
          <button type="button" className="global-section-modal__ghost-btn" onClick={loadBanners}>
            <ReloadOutlined />
            <span>Yangilash</span>
          </button>
        </div>

        {loading ? <p className="global-section-modal__state">Yuklanmoqda...</p> : null}
        {!loading && banners.length === 0 ? (
          <p className="global-section-modal__state">Hozircha home banner yo'q</p>
        ) : null}

        <div className="global-section-modal__list">
          {banners.map((banner) => (
            <div key={banner.id} className="global-section-modal__saved-card">
              {editingBannerId === banner.id && editingDraft ? (
                <div className="global-section-modal__saved-item-edit">
                  <div className="global-section-modal__grid global-section-modal__grid--2">
                    <label className="global-section-modal__field">
                      <span className="global-section-modal__label">type</span>
                      <select
                        className="global-section-modal__select"
                        value={editingDraft.type}
                        onChange={(e) =>
                          setEditingDraft((prev) => (prev ? { ...prev, type: e.target.value } : prev))
                        }
                      >
                        <option value="image">image</option>
                      </select>
                    </label>

                    <label className="global-section-modal__field">
                      <span className="global-section-modal__label">clickable</span>
                      <label className="global-section-modal__check">
                        <input
                          type="checkbox"
                          checked={Boolean(editingDraft.clickable)}
                          onChange={(e) =>
                            setEditingDraft((prev) =>
                              prev ? { ...prev, clickable: e.target.checked } : prev,
                            )
                          }
                        />
                        <span>Banner bosilganda category sahifaga o'tadi</span>
                      </label>
                    </label>

                    <label className="global-section-modal__field global-section-modal__field--full">
                      <span className="global-section-modal__label">category</span>
                      <CategoryPicker
                        value={editingDraft.masterCategoryId}
                        options={masterCategoryOptions}
                        placeholder={editingDraft.clickable ? 'Category tanlang' : 'Ixtiyoriy'}
                        isOpen={isEditCategoryOpen}
                        onToggle={() => setIsEditCategoryOpen((prev) => !prev)}
                        onSelect={(selectedValue) => {
                          const selected = (categoryMaster.masterCategories || []).find(
                            (item) => Number(item.id) === Number(selectedValue),
                          );
                          setEditingDraft((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  masterCategoryId: String(selectedValue),
                                  category: selected?.name?.uz || prev.category,
                                }
                              : prev,
                          );
                          setIsEditCategoryOpen(false);
                        }}
                      />
                    </label>

                    <label className="global-section-modal__field">
                      <span className="global-section-modal__label">countriesCategories</span>
                      <CategoryPicker
                        value={editingDraft.countriesCategories}
                        placeholder="Davlat filter tanlang"
                        options={countryOptions}
                        isOpen={isEditCountryOpen}
                        onToggle={() => setIsEditCountryOpen((prev) => !prev)}
                        onSelect={(selectedValue) => {
                          setEditingDraft((prev) =>
                            prev ? { ...prev, countriesCategories: selectedValue } : prev,
                          );
                          setIsEditCountryOpen(false);
                        }}
                      />
                    </label>

                    <label className="global-section-modal__field">
                      <span className="global-section-modal__label">brandCategories</span>
                      <CategoryPicker
                        value={editingDraft.brandCategories}
                        placeholder="Brend filter tanlang"
                        options={brandOptions}
                        isOpen={isEditBrandOpen}
                        onToggle={() => setIsEditBrandOpen((prev) => !prev)}
                        onSelect={(selectedValue) => {
                          setEditingDraft((prev) =>
                            prev ? { ...prev, brandCategories: selectedValue } : prev,
                          );
                          setIsEditBrandOpen(false);
                        }}
                      />
                    </label>

                    <label className="global-section-modal__field">
                      <ImageUploadField
                        label="src.uz (image)"
                        value={editingDraft.srcUz}
                        onChange={(uploadedPath) =>
                          setEditingDraft((prev) => (prev ? { ...prev, srcUz: uploadedPath } : prev))
                        }
                        onUploadStateChange={handleUploadStateChange}
                      />
                    </label>

                    <label className="global-section-modal__field">
                      <ImageUploadField
                        label="src.ru (image)"
                        value={editingDraft.srcRu}
                        onChange={(uploadedPath) =>
                          setEditingDraft((prev) => (prev ? { ...prev, srcRu: uploadedPath } : prev))
                        }
                        onUploadStateChange={handleUploadStateChange}
                      />
                    </label>
                  </div>

                  <div className="global-section-modal__saved-actions global-section-modal__saved-actions--end">
                    <button
                      type="button"
                      className="global-section-modal__ghost-btn"
                      onClick={saveEdit}
                      disabled={updating || activeUploads > 0}
                    >
                      {activeUploads > 0 ? 'Rasm yuklanmoqda...' : 'Saqlash'}
                    </button>
                    <button
                      type="button"
                      className="global-section-modal__link-btn"
                      onClick={cancelEdit}
                    >
                      Bekor
                    </button>
                  </div>
                </div>
              ) : (
                <div className="global-section-modal__saved-item">
                  <div>
                    <div className="global-section-modal__saved-name">
                      type: {banner.type || '-'} | clickable: {banner.clickable ? 'ha' : "yo'q"}
                    </div>
                    <div className="global-section-modal__meta">
                      id: {banner.id} | categoryId: {banner.masterCategoryId || '-'} | category: {banner.category || '-'}
                    </div>
                    <div className="global-section-modal__meta">
                      country: {banner.countriesCategories || '-'} | brand: {banner.brandCategories || '-'}
                    </div>
                    <div className="global-section-modal__saved-thumb-wrap">
                      {banner?.src?.uz ? (
                        <img
                          src={toAbsoluteImageUrl(banner.src.uz)}
                          alt={`Home banner uz ${banner.id}`}
                          className="global-section-modal__saved-thumb"
                        />
                      ) : null}
                      {banner?.src?.ru ? (
                        <img
                          src={toAbsoluteImageUrl(banner.src.ru)}
                          alt={`Home banner ru ${banner.id}`}
                          className="global-section-modal__saved-thumb"
                        />
                      ) : null}
                    </div>
                  </div>
                  <div className="global-section-modal__saved-actions">
                    <button
                      type="button"
                      className="global-section-modal__ghost-btn"
                      onClick={() => startEdit(banner)}
                    >
                      Tahrirlash
                    </button>
                    <button
                      type="button"
                      className="global-section-modal__danger-link"
                      onClick={() => removeBanner(banner.id)}
                    >
                      O'chirish
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {error ? <p className="global-section-modal__error">{error}</p> : null}
    </div>
  );
}

function buildDefaultVideoBannerDraft() {
  return {
    title: '',
    subtitle: '',
    src: '',
  };
}

function VideoBannerForm({ visible }) {
  const [draft, setDraft] = useState(buildDefaultVideoBannerDraft());
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [activeUploads, setActiveUploads] = useState(0);
  const [editingBannerId, setEditingBannerId] = useState(null);
  const [editingDraft, setEditingDraft] = useState(null);
  const [error, setError] = useState('');

  const handleUploadStateChange = (isUploading) => {
    setActiveUploads((prev) => {
      const next = prev + (isUploading ? 1 : -1);
      return next < 0 ? 0 : next;
    });
  };

  const loadBanners = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchVideoBanners();
      setBanners(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Video bannerlarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadBanners();
    }
  }, [visible]);

  const validatePayload = (payload, prefixText = "Ma'lumot") => {
    if (!payload.title.trim()) {
      return `${prefixText}: title to'ldirilishi shart`;
    }
    if (!payload.subtitle.trim()) {
      return `${prefixText}: subtitle to'ldirilishi shart`;
    }
    if (!payload.src.trim()) {
      return `${prefixText}: video yuklanishi shart`;
    }
    return '';
  };

  const handleCreate = async () => {
    const payload = {
      title: draft.title.trim(),
      subtitle: draft.subtitle.trim(),
      src: draft.src.trim(),
    };
    const validationError = validatePayload(payload, 'Yangi video');
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createVideoBanner(payload);
      setDraft(buildDefaultVideoBannerDraft());
      await loadBanners();
    } catch (err) {
      setError(err.message || "Yangi video banner qo'shilmadi");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (banner) => {
    setEditingBannerId(banner.id);
    setEditingDraft({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      src: banner.src || '',
    });
    setError('');
  };

  const cancelEdit = () => {
    setEditingBannerId(null);
    setEditingDraft(null);
  };

  const saveEdit = async () => {
    if (!editingDraft || !editingBannerId) return;
    const payload = {
      title: editingDraft.title.trim(),
      subtitle: editingDraft.subtitle.trim(),
      src: editingDraft.src.trim(),
    };
    const validationError = validatePayload(payload, 'Tahrirlash');
    if (validationError) {
      setError(validationError);
      return;
    }
    setUpdating(true);
    setError('');
    try {
      await updateVideoBanner(editingBannerId, payload);
      await loadBanners();
      cancelEdit();
    } catch (err) {
      setError(err.message || "Video bannerni tahrirlab bo'lmadi");
    } finally {
      setUpdating(false);
    }
  };

  const removeBanner = async (bannerId) => {
    const ok = window.confirm("Bu video banner o'chirilsinmi?");
    if (!ok) return;
    setError('');
    try {
      await deleteVideoBanner(bannerId);
      if (editingBannerId === bannerId) {
        cancelEdit();
      }
      await loadBanners();
    } catch (err) {
      setError(err.message || "Video bannerni o'chirib bo'lmadi");
    }
  };

  return (
    <div className="global-section-modal__form-stack">
      <div className="global-section-modal__card">
        <h3 className="global-section-modal__block-title">Yangi video banner</h3>
        <div className="global-section-modal__grid global-section-modal__grid--2">
          <label className="global-section-modal__field">
            <span className="global-section-modal__label">title</span>
            <input
              className="global-section-modal__input"
              value={draft.title}
              onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Masalan: Yangi moda kolleksiyasi"
            />
          </label>
          <label className="global-section-modal__field">
            <span className="global-section-modal__label">subtitle</span>
            <input
              className="global-section-modal__input"
              value={draft.subtitle}
              onChange={(e) => setDraft((prev) => ({ ...prev, subtitle: e.target.value }))}
              placeholder="Masalan: 2026 yil trendlari"
            />
          </label>
          <label className="global-section-modal__field global-section-modal__field--full">
            <VideoUploadField
              label="src (video)"
              value={draft.src}
              onChange={(uploadedPath) => setDraft((prev) => ({ ...prev, src: uploadedPath }))}
              onUploadStateChange={handleUploadStateChange}
            />
          </label>
        </div>

        <div className="global-section-modal__actions">
          <button
            type="button"
            className="global-section-modal__btn"
            onClick={handleCreate}
            disabled={saving || activeUploads > 0}
          >
            {saving ? 'Saqlanmoqda...' : activeUploads > 0 ? 'Video yuklanmoqda...' : "Qo'shish"}
          </button>
        </div>
      </div>

      <div className="global-section-modal__card">
        <div className="global-section-modal__row-between">
          <h3 className="global-section-modal__block-title">Saqlangan video bannerlar</h3>
          <button type="button" className="global-section-modal__ghost-btn" onClick={loadBanners}>
            <ReloadOutlined />
            <span>Yangilash</span>
          </button>
        </div>

        {loading ? <p className="global-section-modal__state">Yuklanmoqda...</p> : null}
        {!loading && banners.length === 0 ? (
          <p className="global-section-modal__state">Hozircha video banner yo'q</p>
        ) : null}

        <div className="global-section-modal__list">
          {banners.map((banner) => (
            <div key={banner.id} className="global-section-modal__saved-card">
              {editingBannerId === banner.id && editingDraft ? (
                <div className="global-section-modal__saved-item-edit">
                  <div className="global-section-modal__grid global-section-modal__grid--2">
                    <label className="global-section-modal__field">
                      <span className="global-section-modal__label">title</span>
                      <input
                        className="global-section-modal__input"
                        value={editingDraft.title}
                        onChange={(e) =>
                          setEditingDraft((prev) => (prev ? { ...prev, title: e.target.value } : prev))
                        }
                      />
                    </label>
                    <label className="global-section-modal__field">
                      <span className="global-section-modal__label">subtitle</span>
                      <input
                        className="global-section-modal__input"
                        value={editingDraft.subtitle}
                        onChange={(e) =>
                          setEditingDraft((prev) =>
                            prev ? { ...prev, subtitle: e.target.value } : prev,
                          )
                        }
                      />
                    </label>
                    <label className="global-section-modal__field global-section-modal__field--full">
                      <VideoUploadField
                        label="src (video)"
                        value={editingDraft.src}
                        onChange={(uploadedPath) =>
                          setEditingDraft((prev) => (prev ? { ...prev, src: uploadedPath } : prev))
                        }
                        onUploadStateChange={handleUploadStateChange}
                      />
                    </label>
                  </div>

                  <div className="global-section-modal__saved-actions global-section-modal__saved-actions--end">
                    <button
                      type="button"
                      className="global-section-modal__ghost-btn"
                      onClick={saveEdit}
                      disabled={updating || activeUploads > 0}
                    >
                      {activeUploads > 0 ? 'Video yuklanmoqda...' : 'Saqlash'}
                    </button>
                    <button
                      type="button"
                      className="global-section-modal__link-btn"
                      onClick={cancelEdit}
                    >
                      Bekor
                    </button>
                  </div>
                </div>
              ) : (
                <div className="global-section-modal__saved-item">
                  <div>
                    <div className="global-section-modal__saved-name">{banner.title || '-'}</div>
                    <div className="global-section-modal__meta">
                      id: {banner.id} | subtitle: {banner.subtitle || '-'}
                    </div>
                    {banner.src ? (
                      <div className="global-section-modal__saved-thumb-wrap">
                        <video
                          src={toAbsoluteVideoUrl(banner.src)}
                          className="global-section-modal__saved-video"
                          controls
                          preload="metadata"
                        />
                      </div>
                    ) : null}
                  </div>
                  <div className="global-section-modal__saved-actions">
                    <button
                      type="button"
                      className="global-section-modal__ghost-btn"
                      onClick={() => startEdit(banner)}
                    >
                      Tahrirlash
                    </button>
                    <button
                      type="button"
                      className="global-section-modal__danger-link"
                      onClick={() => removeBanner(banner.id)}
                    >
                      O'chirish
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {error ? <p className="global-section-modal__error">{error}</p> : null}
    </div>
  );
}

function buildWarehouseDraft(srcPair) {
  return {
    uz: srcPair?.uz || '',
    ru: srcPair?.ru || '',
  };
}

function UzWarehouseForm({ visible }) {
  const SLOT_CONFIG = [
    {
      slotKey: 'uz',
      dataKey: 'uzWarehouseData',
      title: 'Uz warehouse banner',
    },
    {
      slotKey: 'china',
      dataKey: 'chinaWarehouseData',
      title: 'China warehouse banner',
    },
  ];

  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingSlotKey, setDeletingSlotKey] = useState('');
  const [error, setError] = useState('');
  const [activeUploads, setActiveUploads] = useState(0);
  const [savedData, setSavedData] = useState({
    uzWarehouseData: null,
    chinaWarehouseData: null,
  });
  const [editingSlotKey, setEditingSlotKey] = useState('');
  const [editingDraft, setEditingDraft] = useState(buildWarehouseDraft());

  const handleUploadStateChange = (isUploading) => {
    setActiveUploads((prev) => {
      const next = prev + (isUploading ? 1 : -1);
      return next < 0 ? 0 : next;
    });
  };

  const loadWarehouseData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchUzWarehouseData();
      setSavedData({
        uzWarehouseData: data?.uzWarehouseData || null,
        chinaWarehouseData: data?.chinaWarehouseData || null,
      });
    } catch (err) {
      setError(err.message || "Warehouse bannerlarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadWarehouseData();
    }
  }, [visible]);

  const startEdit = (slotKey, sourcePair) => {
    setEditingSlotKey(slotKey);
    setEditingDraft(buildWarehouseDraft(sourcePair));
    setError('');
  };

  const cancelEdit = () => {
    setEditingSlotKey('');
    setEditingDraft(buildWarehouseDraft());
  };

  const handleSaveEdit = async () => {
    if (!editingSlotKey) return;
    const nextUz = editingDraft.uz.trim();
    const nextRu = editingDraft.ru.trim();
    if (!nextUz || !nextRu) {
      setError("src.uz va src.ru to'ldirilishi shart");
      return;
    }

    const payload =
      editingSlotKey === 'uz'
        ? { uzWarehouseData: { src: { uz: nextUz, ru: nextRu } } }
        : { chinaWarehouseData: { src: { uz: nextUz, ru: nextRu } } };

    setUpdating(true);
    setError('');
    try {
      const data = await updateUzWarehouseData(payload);
      setSavedData({
        uzWarehouseData: data?.uzWarehouseData || null,
        chinaWarehouseData: data?.chinaWarehouseData || null,
      });
      cancelEdit();
    } catch (err) {
      setError(err.message || "Warehouse bannerlarni saqlab bo'lmadi");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (slotKey) => {
    const ok = window.confirm("Bu banner o'chirilsinmi?");
    if (!ok) return;
    setDeletingSlotKey(slotKey);
    setError('');
    try {
      const data = await deleteUzWarehouseData(slotKey);
      setSavedData({
        uzWarehouseData: data?.uzWarehouseData || null,
        chinaWarehouseData: data?.chinaWarehouseData || null,
      });
      if (editingSlotKey === slotKey) {
        cancelEdit();
      }
    } catch (err) {
      setError(err.message || "Warehouse bannerni o'chirib bo'lmadi");
    } finally {
      setDeletingSlotKey('');
    }
  };

  return (
    <div className="global-section-modal__form-stack">
      <div className="global-section-modal__card">
        <div className="global-section-modal__row-between">
          <h3 className="global-section-modal__block-title">Saqlangan warehouse bannerlar</h3>
          <button type="button" className="global-section-modal__ghost-btn" onClick={loadWarehouseData}>
            <ReloadOutlined />
            <span>Yangilash</span>
          </button>
        </div>
        {loading ? <p className="global-section-modal__state">Yuklanmoqda...</p> : null}
        <div className="global-section-modal__list">
          {SLOT_CONFIG.map((slot) => {
            const current = savedData?.[slot.dataKey];
            const srcPair = current?.src || {};
            const hasData = Boolean(srcPair.uz || srcPair.ru);
            const isEditing = editingSlotKey === slot.slotKey;

            return (
              <div key={slot.slotKey} className="global-section-modal__saved-card">
                <div className="global-section-modal__row-between">
                  <div>
                    <strong>{slot.title}</strong>
                    <div className="global-section-modal__meta">
                      holat: {hasData ? 'saqlangan' : "hozircha yo'q"}
                    </div>
                  </div>
                  <div className="global-section-modal__saved-actions">
                    {!isEditing ? (
                      <button
                        type="button"
                        className="global-section-modal__ghost-btn"
                        onClick={() => startEdit(slot.slotKey, srcPair)}
                      >
                        {hasData ? 'Tahrirlash' : "Qo'shish"}
                      </button>
                    ) : null}
                    {hasData ? (
                      <button
                        type="button"
                        className="global-section-modal__danger-link"
                        onClick={() => handleDelete(slot.slotKey)}
                        disabled={deletingSlotKey === slot.slotKey}
                      >
                        {deletingSlotKey === slot.slotKey ? "O'chirilmoqda..." : "O'chirish"}
                      </button>
                    ) : null}
                  </div>
                </div>

                {isEditing ? (
                  <div className="global-section-modal__saved-item-edit global-section-modal__edit-block">
                    <div className="global-section-modal__grid global-section-modal__grid--2">
                      <label className="global-section-modal__field">
                        <ImageUploadField
                          label="src.uz (image)"
                          value={editingDraft.uz}
                          onChange={(uploadedPath) =>
                            setEditingDraft((prev) => ({ ...prev, uz: uploadedPath }))
                          }
                          onUploadStateChange={handleUploadStateChange}
                        />
                      </label>
                      <label className="global-section-modal__field">
                        <ImageUploadField
                          label="src.ru (image)"
                          value={editingDraft.ru}
                          onChange={(uploadedPath) =>
                            setEditingDraft((prev) => ({ ...prev, ru: uploadedPath }))
                          }
                          onUploadStateChange={handleUploadStateChange}
                        />
                      </label>
                    </div>
                    <div className="global-section-modal__saved-actions global-section-modal__saved-actions--end">
                      <button
                        type="button"
                        className="global-section-modal__ghost-btn"
                        onClick={handleSaveEdit}
                        disabled={updating || activeUploads > 0}
                      >
                        {updating ? 'Saqlanmoqda...' : activeUploads > 0 ? 'Fayl yuklanmoqda...' : 'Saqlash'}
                      </button>
                      <button
                        type="button"
                        className="global-section-modal__link-btn"
                        onClick={cancelEdit}
                      >
                        Bekor
                      </button>
                    </div>
                  </div>
                ) : hasData ? (
                  <div className="global-section-modal__saved-thumb-wrap">
                    {srcPair.uz ? (
                      <img
                        src={toAbsoluteImageUrl(srcPair.uz)}
                        alt={`${slot.title} uz`}
                        className="global-section-modal__saved-thumb"
                      />
                    ) : null}
                    {srcPair.ru ? (
                      <img
                        src={toAbsoluteImageUrl(srcPair.ru)}
                        alt={`${slot.title} ru`}
                        className="global-section-modal__saved-thumb"
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
      {error ? <p className="global-section-modal__error">{error}</p> : null}
    </div>
  );
}

function SimpleSectionForm({ sectionLabel }) {
  const [imagePath, setImagePath] = useState('');

  return (
    <div className="global-section-modal__form-stack">
      <div className="global-section-modal__card">
        <h3 className="global-section-modal__block-title">{sectionLabel} ma'lumotlari</h3>
        <div className="global-section-modal__grid global-section-modal__grid--2">
          <label className="global-section-modal__field">
            <span className="global-section-modal__label">Nomi (uz)</span>
            <input className="global-section-modal__input" placeholder="Nomi" />
          </label>
          <label className="global-section-modal__field">
            <span className="global-section-modal__label">Nomi (ru)</span>
            <input className="global-section-modal__input" placeholder="Название" />
          </label>
          <label className="global-section-modal__field global-section-modal__field--full">
            <ImageUploadField
              label="image"
              value={imagePath}
              onChange={(uploadedPath) => setImagePath(uploadedPath)}
            />
          </label>
          <label className="global-section-modal__field">
            <span className="global-section-modal__label">Tavsif (uz)</span>
            <textarea className="global-section-modal__textarea" rows={4} />
          </label>
          <label className="global-section-modal__field">
            <span className="global-section-modal__label">Tavsif (ru)</span>
            <textarea className="global-section-modal__textarea" rows={4} />
          </label>
        </div>
      </div>
    </div>
  );
}

export default function GlobalSectionModal({ open, section, onClose }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const media = window.matchMedia('(max-width: 768px)');
    const apply = () => setIsMobile(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  const title = section?.label || 'Bo‘lim';

  const content =
    section?.key === 'brand-country-filter-values' ? (
      <BrandCountryCategoriesForm visible={open} mode="brand-country-filter-values" />
    ) : section?.key === 'brand-country-categories' ? (
      <BrandCountryCategoriesForm visible={open} mode="brand-country-categories" />
    ) : section?.key === 'master-categories' ? (
      <BrandCountryCategoriesForm visible={open} mode="master-categories" />
    ) : section?.key === 'banner' ? (
      <HomeBannerForm visible={open} />
    ) : section?.key === 'navbar-category' ? (
      <NavbarCategoryForm visible={open} />
    ) : section?.key === 'product-policy' ? (
      <ProductPolicyForm visible={open} />
    ) : section?.key === 'video-banner' ? (
      <VideoBannerForm visible={open} />
    ) : section?.key === 'country-seller-banner' ? (
      <UzWarehouseForm visible={open} />
    ) : section?.key === 'shipping-country' ? (
      <ShippingCountryForm visible={open} />
    ) : section?.key === 'product-types' ? (
      <ProductTypeForm visible={open} />
    ) : section?.key === 'product-uzb-warehouse-info' ? (
      <UzbProductDeliveryInfoForm visible={open} />
    ) : section?.key === 'logistics-info' ? (
      <LogisticsInfoForm visible={open} />
    ) : section?.key === 'footer' ? (
      <FooterForm visible={open} />
    ) : section?.key === 'flash-sale-rules' ? (
      <FlashSaleRulesForm visible={open} />
    ) : section?.key === 'product-edit' ? (
      <ProductEditForm
        visible={open}
        productId={section?.productId}
        onRefresh={section?.onRefresh}
      />
    ) : section?.key === 'seller-sold-products' ? (
      <SellerSoldProductsModalContent
        visible={open}
        sellerId={section?.sellerId}
      />
    ) : section?.key === 'product-selling-sellers' ? (
      <ProductSellingSellersModalContent
        visible={open}
        productId={section?.productId}
      />
    ) : section?.key === 'sales-statistics-legend' ? (
      <SalesStatisticsLegendModalContent
        visible={open}
        periodLabel={section?.periodLabel}
        scopeLabel={section?.scopeLabel}
        items={section?.items}
      />
    ) : section?.key === 'top-sellers-statistics-list' ? (
      <TopSellersStatisticsModalContent
        visible={open}
        periodLabel={section?.periodLabel}
        sellers={section?.sellers}
      />
    ) : section?.key === 'top-selling-products-statistics-list' ? (
      <TopSellingProductsStatisticsModalContent
        visible={open}
        periodLabel={section?.periodLabel}
        products={section?.products}
      />
    ) : (
      <SimpleSectionForm sectionLabel={title} />
    );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closeIcon={null}
      mask={{ closable: true }}
      centered={!isMobile}
      width={isMobile ? '100vw' : 920}
      className={`global-section-modal${isMobile ? ' global-section-modal--mobile' : ''}`}
      styles={{
        content: isMobile ? { margin: 0, borderRadius: 0, padding: 0, height: '100dvh' } : undefined,
        body: isMobile ? { height: '100dvh', padding: 0 } : undefined,
      }}
    >
      <div className="global-section-modal__shell">
        <div className="global-section-modal__header">
          <button
            type="button"
            className="global-section-modal__back-btn"
            onClick={onClose}
            aria-label="Ortga"
          >
            <ArrowLeftOutlined />
          </button>
          <h2 className="global-section-modal__title">{title}</h2>
        </div>
        <div className="global-section-modal__body">{content}</div>
      </div>
    </Modal>
  );
}
