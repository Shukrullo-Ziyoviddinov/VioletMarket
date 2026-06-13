import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import './GlobalSectionModal.css';

const NAVBAR_CATEGORY_OPTIONS = [
  'Sayoxat uchun asqotade',
  'Sport va Faol turmush',
  "Vitaminlar va sog'liq",
  'Bolalar tovarlari',
  "Go'zallik va parvarish",
  'Kanselyariya tovarlari',
  'Kitoblar',
  'Qizlar kiyimi',
  'Ayollar kiyimi',
  'Ayollar poyabzali',
  "O'g'il bollar kiyimlar",
  'Erkaklar poyabzali',
  'Erkaklar kiyimi',
  'Iqlim texnikasi',
  "Go'zallik uchun texnika",
  'Smart gadjetlar',
  'Aksessuarlar',
  'Maishiy texnika',
  'Elektronika',
];

function buildDefaultNavbarItem(index = 1) {
  return {
    id: Date.now() + index,
    itemId: index,
    nameUz: '',
    nameRu: '',
    category: '',
    image: '',
    descriptionUz: '',
    descriptionRu: '',
  };
}

function NavbarCategoryForm() {
  const [sectionTitleUz, setSectionTitleUz] = useState('');
  const [sectionTitleRu, setSectionTitleRu] = useState('');
  const [items, setItems] = useState([buildDefaultNavbarItem(1)]);

  const handleItemChange = (id, field, value) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const addItem = () => {
    setItems((prev) => [...prev, buildDefaultNavbarItem(prev.length + 1)]);
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
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
            <div key={item.id} className="global-section-modal__sub-card">
              <div className="global-section-modal__row-between">
                <strong>Item #{idx + 1}</strong>
                {items.length > 1 ? (
                  <button
                    type="button"
                    className="global-section-modal__link-btn"
                    onClick={() => removeItem(item.id)}
                  >
                    O'chirish
                  </button>
                ) : null}
              </div>

              <div className="global-section-modal__grid global-section-modal__grid--3">
                <label className="global-section-modal__field">
                  <span className="global-section-modal__label">id</span>
                  <input
                    className="global-section-modal__input"
                    type="number"
                    value={item.itemId}
                    onChange={(e) => handleItemChange(item.id, 'itemId', e.target.value)}
                  />
                </label>
                <label className="global-section-modal__field global-section-modal__field--full">
                  <span className="global-section-modal__label">category</span>
                  <select
                    className="global-section-modal__select"
                    value={item.category}
                    onChange={(e) => handleItemChange(item.id, 'category', e.target.value)}
                  >
                    <option value="">Category tanlang</option>
                    {NAVBAR_CATEGORY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="global-section-modal__field">
                  <span className="global-section-modal__label">name.uz</span>
                  <input
                    className="global-section-modal__input"
                    value={item.nameUz}
                    onChange={(e) => handleItemChange(item.id, 'nameUz', e.target.value)}
                    placeholder="Masalan: Elektronika"
                  />
                </label>
                <label className="global-section-modal__field">
                  <span className="global-section-modal__label">name.ru</span>
                  <input
                    className="global-section-modal__input"
                    value={item.nameRu}
                    onChange={(e) => handleItemChange(item.id, 'nameRu', e.target.value)}
                    placeholder="Например: Электроника"
                  />
                </label>
                <label className="global-section-modal__field global-section-modal__field--full">
                  <span className="global-section-modal__label">image</span>
                  <input
                    className="global-section-modal__input"
                    value={item.image}
                    onChange={(e) => handleItemChange(item.id, 'image', e.target.value)}
                    placeholder="/img/texnika.jpg"
                  />
                </label>
                <label className="global-section-modal__field">
                  <span className="global-section-modal__label">description.uz</span>
                  <textarea
                    className="global-section-modal__textarea"
                    value={item.descriptionUz}
                    onChange={(e) => handleItemChange(item.id, 'descriptionUz', e.target.value)}
                    rows={3}
                  />
                </label>
                <label className="global-section-modal__field">
                  <span className="global-section-modal__label">description.ru</span>
                  <textarea
                    className="global-section-modal__textarea"
                    value={item.descriptionRu}
                    onChange={(e) => handleItemChange(item.id, 'descriptionRu', e.target.value)}
                    rows={3}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SimpleSectionForm({ sectionLabel }) {
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
            <span className="global-section-modal__label">Image URL</span>
            <input className="global-section-modal__input" placeholder="/img/example.jpg" />
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

  const content = useMemo(() => {
    if (section?.key === 'navbar-category') return <NavbarCategoryForm />;
    return <SimpleSectionForm sectionLabel={title} />;
  }, [section?.key, title]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closeIcon={null}
      maskClosable
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
