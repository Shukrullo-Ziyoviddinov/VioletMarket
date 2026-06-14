import React, { useEffect, useState } from 'react';
import { ArrowLeftOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
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
import ImageUploadField from '../ImageUploadField/ImageUploadField';
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
    category: '',
    nameUz: '',
    nameRu: '',
    image: '',
    descriptionUz: '',
    descriptionRu: '',
  };
}

function CategoryPicker({ value, onSelect, isOpen, onToggle }) {
  return (
    <div className="global-section-modal__category-picker">
      <button
        type="button"
        className={`global-section-modal__category-trigger${isOpen ? ' global-section-modal__category-trigger--active' : ''}`}
        onClick={onToggle}
      >
        <span>{value || 'Category tanlang'}</span>
        <span className="global-section-modal__category-caret">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen ? (
        <div className="global-section-modal__category-options">
          {NAVBAR_CATEGORY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`global-section-modal__category-option${value === option.value ? ' global-section-modal__category-option--active' : ''}`}
              onClick={() => onSelect(option.value)}
            >
              <span className="global-section-modal__category-main">{option.value}</span>
              <span className="global-section-modal__category-sub">{option.ru}</span>
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

  useEffect(() => {
    if (visible) {
      loadSections();
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
        if (field !== 'category') return { ...item, [field]: value };

        const selected = NAVBAR_CATEGORY_OPTIONS.find((opt) => opt.value === value);
        return {
          ...item,
          category: value,
          nameUz: item.nameUz || value,
          nameRu: item.nameRu || selected?.ru || value,
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
        category: item.category.trim(),
        name: { uz: item.nameUz.trim(), ru: item.nameRu.trim() },
        image: item.image.trim(),
        description: { uz: item.descriptionUz.trim(), ru: item.descriptionRu.trim() },
      }))
      .filter((item) => item.category || item.name.uz || item.name.ru || item.image || item.description.uz || item.description.ru);

    if (!title.uz || !title.ru) {
      setError("title.uz va title.ru to'ldirilishi shart");
      return;
    }
    if (normalizedItems.length === 0) {
      setError("Kamida bitta navbar item kiriting");
      return;
    }
    for (const [idx, item] of normalizedItems.entries()) {
      if (!item.category || !item.name.uz || !item.name.ru || !item.description.uz || !item.description.ru) {
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

    if (!payload.category || !payload.name.uz || !payload.name.ru || !payload.description.uz || !payload.description.ru) {
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

    if (!payload.category || !payload.name.uz || !payload.name.ru || !payload.description.uz || !payload.description.ru) {
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
                    value={item.category}
                    isOpen={openCreateCategoryItemId === item.localId}
                    onToggle={() =>
                      setOpenCreateCategoryItemId((prev) =>
                        prev === item.localId ? null : item.localId,
                      )
                    }
                    onSelect={(selectedValue) => {
                      handleItemChange(item.localId, 'category', selectedValue);
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
                        value={addingItemDraft.category}
                        isOpen={isAddCategoryOpen}
                        onToggle={() => setIsAddCategoryOpen((prev) => !prev)}
                        onSelect={(selectedValue) => {
                          setAddingItemDraft((prev) =>
                            prev ? { ...prev, category: selectedValue } : prev,
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
                              value={editingItemDraft.category}
                              isOpen={isEditCategoryOpen}
                              onToggle={() => setIsEditCategoryOpen((prev) => !prev)}
                              onSelect={(selectedValue) => {
                                setEditingItemDraft((prev) =>
                                  prev ? { ...prev, category: selectedValue } : prev,
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
    section?.key === 'navbar-category' ? (
      <NavbarCategoryForm visible={open} />
    ) : section?.key === 'video-banner' ? (
      <VideoBannerForm visible={open} />
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
