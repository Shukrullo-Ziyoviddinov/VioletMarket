import React, { useEffect, useState } from 'react';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  createFooterAboutSection,
  createFooterAppStore,
  createFooterContact,
  createFooterSocialMedia,
  deleteFooterAboutSection,
  deleteFooterAppStore,
  deleteFooterContact,
  deleteFooterSocialMedia,
  fetchFooterAdminData,
  updateFooterAboutSection,
  updateFooterAppStore,
  updateFooterContact,
  updateFooterSocialMedia,
} from '../../api/footerAdminApi';
import { toAbsoluteImageUrl } from '../../api/navbarAdminApi';
import ImageUploadField from '../ImageUploadField/ImageUploadField';

function buildAboutItem() {
  return { textUz: '', textRu: '' };
}

function buildAboutDraft() {
  return {
    titleUz: '',
    titleRu: '',
    items: [buildAboutItem()],
  };
}

function buildSocialDraft() {
  return { name: '', icon: '', link: '' };
}

function buildAppStoreDraft() {
  return { name: '', image: '', link: '' };
}

function buildContactDraft() {
  return { name: '', icon: '', link: '' };
}

function normalizeAboutPayload(draft) {
  const titleUz = String(draft?.titleUz || '').trim();
  const titleRu = String(draft?.titleRu || '').trim();
  const items = Array.isArray(draft?.items)
    ? draft.items
        .map((item) => ({
          text: {
            uz: String(item?.textUz || '').trim(),
            ru: String(item?.textRu || '').trim(),
          },
        }))
        .filter((item) => item.text.uz && item.text.ru)
    : [];

  if (!titleUz || !titleRu) {
    throw new Error("About section title.uz va title.ru to'ldirilishi shart");
  }
  if (!items.length) {
    throw new Error("About section uchun kamida bitta item bo'lishi shart");
  }
  return {
    title: { uz: titleUz, ru: titleRu },
    items,
  };
}

function normalizeSocialPayload(draft) {
  const payload = {
    name: String(draft?.name || '').trim(),
    icon: String(draft?.icon || '').trim(),
    link: String(draft?.link || '').trim(),
  };
  if (!payload.name || !payload.icon || !payload.link) {
    throw new Error("Social media uchun name, icon, link to'ldirilishi shart");
  }
  return payload;
}

function normalizeAppStorePayload(draft) {
  const payload = {
    name: String(draft?.name || '').trim(),
    image: String(draft?.image || '').trim(),
    link: String(draft?.link || '').trim(),
  };
  if (!payload.name || !payload.image || !payload.link) {
    throw new Error("App store uchun name, image, link to'ldirilishi shart");
  }
  return payload;
}

function mapAboutToDraft(section) {
  const items = Array.isArray(section?.items) ? section.items : [];
  return {
    titleUz: section?.title?.uz || '',
    titleRu: section?.title?.ru || '',
    items: items.length
      ? items.map((item) => ({
          textUz: item?.text?.uz || '',
          textRu: item?.text?.ru || '',
        }))
      : [buildAboutItem()],
  };
}

function handleUploadCounter(setter, isUploading) {
  setter((prev) => {
    const next = prev + (isUploading ? 1 : -1);
    return next < 0 ? 0 : next;
  });
}

export default function FooterForm({ visible }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [activeUploads, setActiveUploads] = useState(0);
  const [error, setError] = useState('');
  const [footerData, setFooterData] = useState({
    aboutSections: [],
    socialMedia: [],
    appStores: [],
    contacts: [],
  });

  const [aboutDraft, setAboutDraft] = useState(buildAboutDraft());
  const [editingAboutId, setEditingAboutId] = useState(null);
  const [editingAboutDraft, setEditingAboutDraft] = useState(null);

  const [socialDraft, setSocialDraft] = useState(buildSocialDraft());
  const [editingSocialId, setEditingSocialId] = useState(null);
  const [editingSocialDraft, setEditingSocialDraft] = useState(null);

  const [appDraft, setAppDraft] = useState(buildAppStoreDraft());
  const [editingAppId, setEditingAppId] = useState(null);
  const [editingAppDraft, setEditingAppDraft] = useState(null);
  const [contactDraft, setContactDraft] = useState(buildContactDraft());
  const [editingContactId, setEditingContactId] = useState(null);
  const [editingContactDraft, setEditingContactDraft] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchFooterAdminData();
      setFooterData({
        aboutSections: Array.isArray(data?.aboutSections) ? data.aboutSections : [],
        socialMedia: Array.isArray(data?.socialMedia) ? data.socialMedia : [],
        appStores: Array.isArray(data?.appStores) ? data.appStores : [],
        contacts: Array.isArray(data?.contacts) ? data.contacts : [],
      });
    } catch (err) {
      setError(err.message || "Footer ma'lumotlarini yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const addAboutItem = (editing = false) => {
    if (editing) {
      setEditingAboutDraft((prev) => ({
        ...prev,
        items: [...(prev?.items || []), buildAboutItem()],
      }));
      return;
    }
    setAboutDraft((prev) => ({
      ...prev,
      items: [...prev.items, buildAboutItem()],
    }));
  };

  const removeAboutItem = (index, editing = false) => {
    const updater = (prev) => {
      const items = [...(prev?.items || [])];
      if (items.length <= 1) return prev;
      items.splice(index, 1);
      return { ...prev, items };
    };
    if (editing) {
      setEditingAboutDraft(updater);
      return;
    }
    setAboutDraft(updater);
  };

  const handleAboutItemChange = (index, field, value, editing = false) => {
    const updater = (prev) => {
      const items = [...(prev?.items || [])];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    };
    if (editing) {
      setEditingAboutDraft(updater);
      return;
    }
    setAboutDraft(updater);
  };

  const saveNewAboutSection = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = normalizeAboutPayload(aboutDraft);
      await createFooterAboutSection(payload);
      setAboutDraft(buildAboutDraft());
      await loadData();
    } catch (err) {
      setError(err.message || "About sectionni saqlab bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  const saveEditingAboutSection = async () => {
    if (!editingAboutId || !editingAboutDraft) return;
    setUpdating(true);
    setError('');
    try {
      const payload = normalizeAboutPayload(editingAboutDraft);
      await updateFooterAboutSection(editingAboutId, payload);
      setEditingAboutId(null);
      setEditingAboutDraft(null);
      await loadData();
    } catch (err) {
      setError(err.message || "About sectionni yangilab bo'lmadi");
    } finally {
      setUpdating(false);
    }
  };

  const removeAboutSection = async (id) => {
    const ok = window.confirm("Bu about section o'chirilsinmi?");
    if (!ok) return;
    setUpdating(true);
    setError('');
    try {
      await deleteFooterAboutSection(id);
      if (Number(editingAboutId) === Number(id)) {
        setEditingAboutId(null);
        setEditingAboutDraft(null);
      }
      await loadData();
    } catch (err) {
      setError(err.message || "About sectionni o'chirib bo'lmadi");
    } finally {
      setUpdating(false);
    }
  };

  const saveNewSocial = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = normalizeSocialPayload(socialDraft);
      await createFooterSocialMedia(payload);
      setSocialDraft(buildSocialDraft());
      await loadData();
    } catch (err) {
      setError(err.message || "Social media linkni saqlab bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  const saveEditingSocial = async () => {
    if (!editingSocialId || !editingSocialDraft) return;
    setUpdating(true);
    setError('');
    try {
      const payload = normalizeSocialPayload(editingSocialDraft);
      await updateFooterSocialMedia(editingSocialId, payload);
      setEditingSocialId(null);
      setEditingSocialDraft(null);
      await loadData();
    } catch (err) {
      setError(err.message || "Social media linkni yangilab bo'lmadi");
    } finally {
      setUpdating(false);
    }
  };

  const removeSocial = async (id) => {
    const ok = window.confirm("Bu social media link o'chirilsinmi?");
    if (!ok) return;
    setUpdating(true);
    setError('');
    try {
      await deleteFooterSocialMedia(id);
      if (Number(editingSocialId) === Number(id)) {
        setEditingSocialId(null);
        setEditingSocialDraft(null);
      }
      await loadData();
    } catch (err) {
      setError(err.message || "Social media linkni o'chirib bo'lmadi");
    } finally {
      setUpdating(false);
    }
  };

  const saveNewApp = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = normalizeAppStorePayload(appDraft);
      await createFooterAppStore(payload);
      setAppDraft(buildAppStoreDraft());
      await loadData();
    } catch (err) {
      setError(err.message || "App store linkni saqlab bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  const saveEditingApp = async () => {
    if (!editingAppId || !editingAppDraft) return;
    setUpdating(true);
    setError('');
    try {
      const payload = normalizeAppStorePayload(editingAppDraft);
      await updateFooterAppStore(editingAppId, payload);
      setEditingAppId(null);
      setEditingAppDraft(null);
      await loadData();
    } catch (err) {
      setError(err.message || "App store linkni yangilab bo'lmadi");
    } finally {
      setUpdating(false);
    }
  };

  const removeApp = async (id) => {
    const ok = window.confirm("Bu app store link o'chirilsinmi?");
    if (!ok) return;
    setUpdating(true);
    setError('');
    try {
      await deleteFooterAppStore(id);
      if (Number(editingAppId) === Number(id)) {
        setEditingAppId(null);
        setEditingAppDraft(null);
      }
      await loadData();
    } catch (err) {
      setError(err.message || "App store linkni o'chirib bo'lmadi");
    } finally {
      setUpdating(false);
    }
  };

  const saveNewContact = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = normalizeSocialPayload(contactDraft);
      await createFooterContact(payload);
      setContactDraft(buildContactDraft());
      await loadData();
    } catch (err) {
      setError(err.message || "Contact linkni saqlab bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  const saveEditingContact = async () => {
    if (!editingContactId || !editingContactDraft) return;
    setUpdating(true);
    setError('');
    try {
      const payload = normalizeSocialPayload(editingContactDraft);
      await updateFooterContact(editingContactId, payload);
      setEditingContactId(null);
      setEditingContactDraft(null);
      await loadData();
    } catch (err) {
      setError(err.message || "Contact linkni yangilab bo'lmadi");
    } finally {
      setUpdating(false);
    }
  };

  const removeContact = async (id) => {
    const ok = window.confirm("Bu contact link o'chirilsinmi?");
    if (!ok) return;
    setUpdating(true);
    setError('');
    try {
      await deleteFooterContact(id);
      if (Number(editingContactId) === Number(id)) {
        setEditingContactId(null);
        setEditingContactDraft(null);
      }
      await loadData();
    } catch (err) {
      setError(err.message || "Contact linkni o'chirib bo'lmadi");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="global-section-modal__form-stack">
      <div className="global-section-modal__card">
        <div className="global-section-modal__row-between">
          <h3 className="global-section-modal__block-title">Footer ma'lumotlari</h3>
          <button type="button" className="global-section-modal__ghost-btn" onClick={loadData}>
            <ReloadOutlined />
            <span>Yangilash</span>
          </button>
        </div>
        {loading ? <p className="global-section-modal__state">Yuklanmoqda...</p> : null}
      </div>

      <div className="global-section-modal__card">
        <h3 className="global-section-modal__block-title">About sections</h3>
        <div className="global-section-modal__list">
          {(footerData.aboutSections || []).map((section) => (
            <div key={section.id} className="global-section-modal__saved-card">
              <div className="global-section-modal__row-between">
                <div>
                  <strong>#{section.id}</strong>
                  <div className="global-section-modal__meta">
                    {section?.title?.uz} / {section?.title?.ru}
                  </div>
                </div>
                <div className="global-section-modal__saved-actions">
                  <button
                    type="button"
                    className="global-section-modal__ghost-btn"
                    onClick={() => {
                      setEditingAboutId(section.id);
                      setEditingAboutDraft(mapAboutToDraft(section));
                      setError('');
                    }}
                  >
                    Tahrirlash
                  </button>
                  <button
                    type="button"
                    className="global-section-modal__danger-link"
                    onClick={() => removeAboutSection(section.id)}
                    disabled={updating}
                  >
                    O'chirish
                  </button>
                </div>
              </div>
              <div className="global-section-modal__saved-items">
                {(section?.items || []).map((item, idx) => (
                  <div key={`${section.id}-${idx}`} className="global-section-modal__saved-item">
                    <div className="global-section-modal__saved-name">
                      {item?.text?.uz || '-'} / {item?.text?.ru || '-'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {editingAboutId ? (
          <div className="global-section-modal__sub-card">
            <h3 className="global-section-modal__block-title">About section tahrirlash</h3>
            <div className="global-section-modal__grid global-section-modal__grid--2">
              <label className="global-section-modal__field">
                <span className="global-section-modal__label">title.uz</span>
                <input
                  className="global-section-modal__input"
                  value={editingAboutDraft?.titleUz || ''}
                  onChange={(e) =>
                    setEditingAboutDraft((prev) => ({ ...prev, titleUz: e.target.value }))
                  }
                />
              </label>
              <label className="global-section-modal__field">
                <span className="global-section-modal__label">title.ru</span>
                <input
                  className="global-section-modal__input"
                  value={editingAboutDraft?.titleRu || ''}
                  onChange={(e) =>
                    setEditingAboutDraft((prev) => ({ ...prev, titleRu: e.target.value }))
                  }
                />
              </label>
            </div>
            <div className="global-section-modal__saved-items">
              {(editingAboutDraft?.items || []).map((item, idx) => (
                <div key={`edit-about-item-${idx}`} className="global-section-modal__saved-item">
                  <div className="global-section-modal__grid global-section-modal__grid--2 global-section-modal__saved-item-edit">
                    <label className="global-section-modal__field">
                      <span className="global-section-modal__label">item text.uz</span>
                      <input
                        className="global-section-modal__input"
                        value={item.textUz}
                        onChange={(e) =>
                          handleAboutItemChange(idx, 'textUz', e.target.value, true)
                        }
                      />
                    </label>
                    <label className="global-section-modal__field">
                      <span className="global-section-modal__label">item text.ru</span>
                      <input
                        className="global-section-modal__input"
                        value={item.textRu}
                        onChange={(e) =>
                          handleAboutItemChange(idx, 'textRu', e.target.value, true)
                        }
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    className="global-section-modal__danger-link"
                    onClick={() => removeAboutItem(idx, true)}
                  >
                    Item o'chirish
                  </button>
                </div>
              ))}
            </div>
            <div className="global-section-modal__saved-actions global-section-modal__saved-actions--end">
              <button type="button" className="global-section-modal__ghost-btn" onClick={() => addAboutItem(true)}>
                <PlusOutlined />
                <span>Item qo'shish</span>
              </button>
              <button
                type="button"
                className="global-section-modal__ghost-btn"
                onClick={saveEditingAboutSection}
                disabled={updating}
              >
                {updating ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
              <button
                type="button"
                className="global-section-modal__link-btn"
                onClick={() => {
                  setEditingAboutId(null);
                  setEditingAboutDraft(null);
                }}
              >
                Bekor
              </button>
            </div>
          </div>
        ) : null}

        <div className="global-section-modal__sub-card">
          <h3 className="global-section-modal__block-title">Yangi about section</h3>
          <div className="global-section-modal__grid global-section-modal__grid--2">
            <label className="global-section-modal__field">
              <span className="global-section-modal__label">title.uz</span>
              <input
                className="global-section-modal__input"
                value={aboutDraft.titleUz}
                onChange={(e) => setAboutDraft((prev) => ({ ...prev, titleUz: e.target.value }))}
              />
            </label>
            <label className="global-section-modal__field">
              <span className="global-section-modal__label">title.ru</span>
              <input
                className="global-section-modal__input"
                value={aboutDraft.titleRu}
                onChange={(e) => setAboutDraft((prev) => ({ ...prev, titleRu: e.target.value }))}
              />
            </label>
          </div>
          <div className="global-section-modal__saved-items">
            {aboutDraft.items.map((item, idx) => (
              <div key={`new-about-item-${idx}`} className="global-section-modal__saved-item">
                <div className="global-section-modal__grid global-section-modal__grid--2 global-section-modal__saved-item-edit">
                  <label className="global-section-modal__field">
                    <span className="global-section-modal__label">item text.uz</span>
                    <input
                      className="global-section-modal__input"
                      value={item.textUz}
                      onChange={(e) => handleAboutItemChange(idx, 'textUz', e.target.value)}
                    />
                  </label>
                  <label className="global-section-modal__field">
                    <span className="global-section-modal__label">item text.ru</span>
                    <input
                      className="global-section-modal__input"
                      value={item.textRu}
                      onChange={(e) => handleAboutItemChange(idx, 'textRu', e.target.value)}
                    />
                  </label>
                </div>
                <button
                  type="button"
                  className="global-section-modal__danger-link"
                  onClick={() => removeAboutItem(idx)}
                >
                  Item o'chirish
                </button>
              </div>
            ))}
          </div>
          <div className="global-section-modal__saved-actions global-section-modal__saved-actions--end">
            <button type="button" className="global-section-modal__ghost-btn" onClick={() => addAboutItem(false)}>
              <PlusOutlined />
              <span>Item qo'shish</span>
            </button>
            <button
              type="button"
              className="global-section-modal__ghost-btn"
              onClick={saveNewAboutSection}
              disabled={saving}
            >
              {saving ? 'Saqlanmoqda...' : 'Qo\'shish'}
            </button>
          </div>
        </div>
      </div>

      <div className="global-section-modal__card">
        <h3 className="global-section-modal__block-title">Social media</h3>
        <div className="global-section-modal__list">
          {(footerData.socialMedia || []).map((social) => (
            <div key={social.id} className="global-section-modal__saved-card">
              <div className="global-section-modal__row-between">
                <div>
                  <strong>#{social.id} {social.name}</strong>
                  <div className="global-section-modal__meta">{social.link}</div>
                </div>
                <div className="global-section-modal__saved-actions">
                  <button
                    type="button"
                    className="global-section-modal__ghost-btn"
                    onClick={() => {
                      setEditingSocialId(social.id);
                      setEditingSocialDraft({
                        name: social.name || '',
                        icon: social.icon || '',
                        link: social.link || '',
                      });
                      setError('');
                    }}
                  >
                    Tahrirlash
                  </button>
                  <button
                    type="button"
                    className="global-section-modal__danger-link"
                    onClick={() => removeSocial(social.id)}
                    disabled={updating}
                  >
                    O'chirish
                  </button>
                </div>
              </div>
              {social.icon ? (
                <div className="global-section-modal__saved-thumb-wrap">
                  <img
                    src={toAbsoluteImageUrl(social.icon)}
                    alt={social.name || 'social'}
                    className="global-section-modal__saved-thumb"
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="global-section-modal__sub-card">
          <h3 className="global-section-modal__block-title">
            {editingSocialId ? 'Social media tahrirlash' : 'Yangi social media'}
          </h3>
          <div className="global-section-modal__grid global-section-modal__grid--2">
            <label className="global-section-modal__field">
              <span className="global-section-modal__label">name</span>
              <input
                className="global-section-modal__input"
                value={(editingSocialId ? editingSocialDraft?.name : socialDraft.name) || ''}
                onChange={(e) =>
                  editingSocialId
                    ? setEditingSocialDraft((prev) => ({ ...prev, name: e.target.value }))
                    : setSocialDraft((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </label>
            <label className="global-section-modal__field">
              <span className="global-section-modal__label">link</span>
              <input
                className="global-section-modal__input"
                value={(editingSocialId ? editingSocialDraft?.link : socialDraft.link) || ''}
                onChange={(e) =>
                  editingSocialId
                    ? setEditingSocialDraft((prev) => ({ ...prev, link: e.target.value }))
                    : setSocialDraft((prev) => ({ ...prev, link: e.target.value }))
                }
              />
            </label>
            <label className="global-section-modal__field global-section-modal__field--full">
              <ImageUploadField
                label="icon (image)"
                value={(editingSocialId ? editingSocialDraft?.icon : socialDraft.icon) || ''}
                onChange={(uploadedPath) =>
                  editingSocialId
                    ? setEditingSocialDraft((prev) => ({ ...prev, icon: uploadedPath }))
                    : setSocialDraft((prev) => ({ ...prev, icon: uploadedPath }))
                }
                onUploadStateChange={(isUploading) => handleUploadCounter(setActiveUploads, isUploading)}
              />
            </label>
          </div>
          <div className="global-section-modal__saved-actions global-section-modal__saved-actions--end">
            {editingSocialId ? (
              <button
                type="button"
                className="global-section-modal__ghost-btn"
                onClick={saveEditingSocial}
                disabled={updating || activeUploads > 0}
              >
                {updating ? 'Saqlanmoqda...' : activeUploads > 0 ? 'Fayl yuklanmoqda...' : 'Saqlash'}
              </button>
            ) : (
              <button
                type="button"
                className="global-section-modal__ghost-btn"
                onClick={saveNewSocial}
                disabled={saving || activeUploads > 0}
              >
                {saving ? 'Saqlanmoqda...' : activeUploads > 0 ? 'Fayl yuklanmoqda...' : "Qo'shish"}
              </button>
            )}
            {editingSocialId ? (
              <button
                type="button"
                className="global-section-modal__link-btn"
                onClick={() => {
                  setEditingSocialId(null);
                  setEditingSocialDraft(null);
                }}
              >
                Bekor
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="global-section-modal__card">
        <h3 className="global-section-modal__block-title">App stores</h3>
        <div className="global-section-modal__list">
          {(footerData.appStores || []).map((app) => (
            <div key={app.id} className="global-section-modal__saved-card">
              <div className="global-section-modal__row-between">
                <div>
                  <strong>#{app.id} {app.name}</strong>
                  <div className="global-section-modal__meta">{app.link}</div>
                </div>
                <div className="global-section-modal__saved-actions">
                  <button
                    type="button"
                    className="global-section-modal__ghost-btn"
                    onClick={() => {
                      setEditingAppId(app.id);
                      setEditingAppDraft({
                        name: app.name || '',
                        image: app.image || '',
                        link: app.link || '',
                      });
                      setError('');
                    }}
                  >
                    Tahrirlash
                  </button>
                  <button
                    type="button"
                    className="global-section-modal__danger-link"
                    onClick={() => removeApp(app.id)}
                    disabled={updating}
                  >
                    O'chirish
                  </button>
                </div>
              </div>
              {app.image ? (
                <div className="global-section-modal__saved-thumb-wrap">
                  <img
                    src={toAbsoluteImageUrl(app.image)}
                    alt={app.name || 'app-store'}
                    className="global-section-modal__saved-thumb"
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="global-section-modal__sub-card">
          <h3 className="global-section-modal__block-title">
            {editingAppId ? 'App store tahrirlash' : 'Yangi app store'}
          </h3>
          <div className="global-section-modal__grid global-section-modal__grid--2">
            <label className="global-section-modal__field">
              <span className="global-section-modal__label">name</span>
              <input
                className="global-section-modal__input"
                value={(editingAppId ? editingAppDraft?.name : appDraft.name) || ''}
                onChange={(e) =>
                  editingAppId
                    ? setEditingAppDraft((prev) => ({ ...prev, name: e.target.value }))
                    : setAppDraft((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </label>
            <label className="global-section-modal__field">
              <span className="global-section-modal__label">link</span>
              <input
                className="global-section-modal__input"
                value={(editingAppId ? editingAppDraft?.link : appDraft.link) || ''}
                onChange={(e) =>
                  editingAppId
                    ? setEditingAppDraft((prev) => ({ ...prev, link: e.target.value }))
                    : setAppDraft((prev) => ({ ...prev, link: e.target.value }))
                }
              />
            </label>
            <label className="global-section-modal__field global-section-modal__field--full">
              <ImageUploadField
                label="image"
                value={(editingAppId ? editingAppDraft?.image : appDraft.image) || ''}
                onChange={(uploadedPath) =>
                  editingAppId
                    ? setEditingAppDraft((prev) => ({ ...prev, image: uploadedPath }))
                    : setAppDraft((prev) => ({ ...prev, image: uploadedPath }))
                }
                onUploadStateChange={(isUploading) => handleUploadCounter(setActiveUploads, isUploading)}
              />
            </label>
          </div>
          <div className="global-section-modal__saved-actions global-section-modal__saved-actions--end">
            {editingAppId ? (
              <button
                type="button"
                className="global-section-modal__ghost-btn"
                onClick={saveEditingApp}
                disabled={updating || activeUploads > 0}
              >
                {updating ? 'Saqlanmoqda...' : activeUploads > 0 ? 'Fayl yuklanmoqda...' : 'Saqlash'}
              </button>
            ) : (
              <button
                type="button"
                className="global-section-modal__ghost-btn"
                onClick={saveNewApp}
                disabled={saving || activeUploads > 0}
              >
                {saving ? 'Saqlanmoqda...' : activeUploads > 0 ? 'Fayl yuklanmoqda...' : "Qo'shish"}
              </button>
            )}
            {editingAppId ? (
              <button
                type="button"
                className="global-section-modal__link-btn"
                onClick={() => {
                  setEditingAppId(null);
                  setEditingAppDraft(null);
                }}
              >
                Bekor
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="global-section-modal__card">
        <h3 className="global-section-modal__block-title">Biz bilan bog'lanish (contacts)</h3>
        <div className="global-section-modal__list">
          {(footerData.contacts || []).map((contact) => (
            <div key={contact.id} className="global-section-modal__saved-card">
              <div className="global-section-modal__row-between">
                <div>
                  <strong>#{contact.id} {contact.name}</strong>
                  <div className="global-section-modal__meta">{contact.link}</div>
                </div>
                <div className="global-section-modal__saved-actions">
                  <button
                    type="button"
                    className="global-section-modal__ghost-btn"
                    onClick={() => {
                      setEditingContactId(contact.id);
                      setEditingContactDraft({
                        name: contact.name || '',
                        icon: contact.icon || '',
                        link: contact.link || '',
                      });
                      setError('');
                    }}
                  >
                    Tahrirlash
                  </button>
                  <button
                    type="button"
                    className="global-section-modal__danger-link"
                    onClick={() => removeContact(contact.id)}
                    disabled={updating}
                  >
                    O'chirish
                  </button>
                </div>
              </div>
              {contact.icon ? (
                <div className="global-section-modal__saved-thumb-wrap">
                  <img
                    src={toAbsoluteImageUrl(contact.icon)}
                    alt={contact.name || 'contact'}
                    className="global-section-modal__saved-thumb"
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="global-section-modal__sub-card">
          <h3 className="global-section-modal__block-title">
            {editingContactId ? "Contact linkni tahrirlash" : 'Yangi contact link'}
          </h3>
          <div className="global-section-modal__grid global-section-modal__grid--2">
            <label className="global-section-modal__field">
              <span className="global-section-modal__label">name</span>
              <input
                className="global-section-modal__input"
                value={(editingContactId ? editingContactDraft?.name : contactDraft.name) || ''}
                onChange={(e) =>
                  editingContactId
                    ? setEditingContactDraft((prev) => ({ ...prev, name: e.target.value }))
                    : setContactDraft((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </label>
            <label className="global-section-modal__field">
              <span className="global-section-modal__label">link</span>
              <input
                className="global-section-modal__input"
                value={(editingContactId ? editingContactDraft?.link : contactDraft.link) || ''}
                onChange={(e) =>
                  editingContactId
                    ? setEditingContactDraft((prev) => ({ ...prev, link: e.target.value }))
                    : setContactDraft((prev) => ({ ...prev, link: e.target.value }))
                }
              />
            </label>
            <label className="global-section-modal__field global-section-modal__field--full">
              <ImageUploadField
                label="icon (image)"
                value={(editingContactId ? editingContactDraft?.icon : contactDraft.icon) || ''}
                onChange={(uploadedPath) =>
                  editingContactId
                    ? setEditingContactDraft((prev) => ({ ...prev, icon: uploadedPath }))
                    : setContactDraft((prev) => ({ ...prev, icon: uploadedPath }))
                }
                onUploadStateChange={(isUploading) => handleUploadCounter(setActiveUploads, isUploading)}
              />
            </label>
          </div>
          <div className="global-section-modal__saved-actions global-section-modal__saved-actions--end">
            {editingContactId ? (
              <button
                type="button"
                className="global-section-modal__ghost-btn"
                onClick={saveEditingContact}
                disabled={updating || activeUploads > 0}
              >
                {updating ? 'Saqlanmoqda...' : activeUploads > 0 ? 'Fayl yuklanmoqda...' : 'Saqlash'}
              </button>
            ) : (
              <button
                type="button"
                className="global-section-modal__ghost-btn"
                onClick={saveNewContact}
                disabled={saving || activeUploads > 0}
              >
                {saving ? 'Saqlanmoqda...' : activeUploads > 0 ? 'Fayl yuklanmoqda...' : "Qo'shish"}
              </button>
            )}
            {editingContactId ? (
              <button
                type="button"
                className="global-section-modal__link-btn"
                onClick={() => {
                  setEditingContactId(null);
                  setEditingContactDraft(null);
                }}
              >
                Bekor
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {error ? <p className="global-section-modal__error">{error}</p> : null}
    </div>
  );
}
