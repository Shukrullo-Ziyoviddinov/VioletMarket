import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from '../contexts/UserContext';
import { updateProfile } from '../api/profileApi';
import { mapApiUserToClient } from '../api/mapApiUser';
import { useAppData } from '../contexts/AppDataContext';
import { getLocalizedText, normalizeImagePath } from '../utils/utils';
import { useSellerSubscriptions } from '../contexts/SellerSubscriptionContext';
import GlobalModal from '../components/GlobalModal';
import { ProfilePendingReviewsList } from '../components/ProfilePendingReviews';
import { ProfilePendingReviewsSkeleton } from '../components/SkeletonLoader';
import CommentFormModal from '../components/CommentFormModal';
import ProfileExit from '../components/ProfileExit';
import { fetchPendingReviews } from '../api/pendingReviewsApi';
import { fetchMessageChatThreads } from '../api/messageChatApi';
import { ProfileMessageThreadsList } from '../components/ProfileMessageThreads';
import ProductSellerChatModal from '../components/ProductSellerChatModal';
import { useSellerMessageChat } from '../hooks/useSellerMessageChat';
import { useMessageChatTyping } from '../hooks/useMessageChatTyping';
import { useMessageChatSocketThreadsUpdated } from '../socket/useMessageChatSocket';
import TavsiyaEtamiz from '../components/TavsiyaEtamiz';
import './Profile.css';
import '../components/ProfileMessageThreads/ProfileMessageThreadsList.css';

const MOBILE_BREAKPOINT = 768;

function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

function formatBirthDateDisplay(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

const LANGUAGES = [
  { code: 'uz', flag: '/img/uzb-by.jpg', labelKey: 'language.uz' },
  { code: 'ru', flag: '/img/ru%20b.png', labelKey: 'language.ru' },
];

const DEFAULT_AVATAR_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1zaXplPSI0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSI+8J+RpDwvdGV4dD48L3N2Zz4=';

const AVATAR_PRESETS = [
  {
    id: 'male',
    src: `${process.env.PUBLIC_URL || ''}/img/avatar.img.erkak_preview_rev_1.png`,
    ariaLabelKey: 'profile.genderMale',
  },
  {
    id: 'female',
    src: `${process.env.PUBLIC_URL || ''}/img/avatar.img.ayol_preview_rev_1.png`,
    ariaLabelKey: 'profile.genderFemale',
  },
];

const Profile = () => {
  const { i18n, t } = useTranslation();
  const { footerData, getSellerById } = useAppData();
  const { userData, authToken, updateUserData, logout } = useUser();
  const { subscribedSellerIds, loadMySubscriptions } = useSellerSubscriptions();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    birthDate: '',
    gender: '',
  });
  const [errors, setErrors] = useState({});
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [birthDatePickerOpen, setBirthDatePickerOpen] = useState(false);
  const [openBirthList, setOpenBirthList] = useState(null);
  const [pickYear, setPickYear] = useState(2000);
  const [pickMonth, setPickMonth] = useState(1);
  const [pickDay, setPickDay] = useState(1);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [subscriptionsModalOpen, setSubscriptionsModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [aboutModalClosing, setAboutModalClosing] = useState(false);
  const [pendingReviewsModalOpen, setPendingReviewsModalOpen] = useState(false);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [pendingReviewsLoading, setPendingReviewsLoading] = useState(false);
  const [pendingCommentFormOpen, setPendingCommentFormOpen] = useState(false);
  const [selectedPendingReview, setSelectedPendingReview] = useState(null);
  const [messageThreads, setMessageThreads] = useState([]);
  const [messageThreadsUnread, setMessageThreadsUnread] = useState(0);
  const [messageThreadsLoading, setMessageThreadsLoading] = useState(false);
  const [messagesModalOpen, setMessagesModalOpen] = useState(false);
  const [activeChatSellerId, setActiveChatSellerId] = useState(null);
  const [isProfileSellerChatOpen, setIsProfileSellerChatOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [openAboutSections, setOpenAboutSections] = useState({});
  const [subscribedSellers, setSubscribedSellers] = useState([]);
  const [tempLanguage, setTempLanguage] = useState(i18n.language || 'uz');
  const [dragY, setDragY] = useState(0);
  const [editDragY, setEditDragY] = useState(0);
  const [socialDragY, setSocialDragY] = useState(0);
  const [contactDragY, setContactDragY] = useState(0);
  const sheetRef = useRef(null);
  const handleRef = useRef(null);
  const editSheetRef = useRef(null);
  const editHandleRef = useRef(null);
  const socialSheetRef = useRef(null);
  const socialHandleRef = useRef(null);
  const contactSheetRef = useRef(null);
  const contactHandleRef = useRef(null);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const startYRef = useRef(0);
  const editStartYRef = useRef(0);
  const socialStartYRef = useRef(0);
  const contactStartYRef = useRef(0);
  const socialDragYRef = useRef(0);
  const contactDragYRef = useRef(0);
  const isMobile = () => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT;

  useEffect(() => {
    setFormData({
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      phone: userData.phone || '',
      email: userData.email || '',
      birthDate: userData.birthDate || '',
      gender: userData.gender || '',
    });
  }, [userData]);

  useEffect(() => {
    if (!languageModalOpen) {
      return;
    }
    setTempLanguage(i18n.language || 'uz');
  }, [languageModalOpen, i18n.language]);

  useEffect(() => {
    if (!editModalOpen) {
      setBirthDatePickerOpen(false);
    }
  }, [editModalOpen]);

  useEffect(() => {
    if (!birthDatePickerOpen) {
      setOpenBirthList(null);
    }
  }, [birthDatePickerOpen]);

  const handleLanguageSave = () => {
    i18n.changeLanguage(tempLanguage);
    setLanguageModalOpen(false);
  };

  const handleTouchStart = (e) => {
    if (!isMobile()) return;
    startYRef.current = e.touches[0].clientY;
    setDragY(0);
  };
  const handleTouchMove = (e) => {
    if (!isMobile()) return;
    const y = e.touches[0].clientY;
    const diff = y - startYRef.current;
    if (diff > 0) setDragY(diff);
  };
  const handleTouchEnd = () => {
    if (!isMobile()) return;
    const closeThreshold = window.innerHeight * 0.08;
    if (dragY >= closeThreshold) {
      setLanguageModalOpen(false);
      setDragY(0);
    } else {
      setDragY(0);
    }
  };

  useEffect(() => {
    if (!isMobile() || !languageModalOpen || !handleRef.current) return;
    const el = handleRef.current;
    const onMove = (e) => {
      const diff = e.touches[0].clientY - startYRef.current;
      if (diff > 0) e.preventDefault();
    };
    el.addEventListener('touchmove', onMove, { passive: false });
    return () => el.removeEventListener('touchmove', onMove);
  }, [languageModalOpen]);

  const handleEditTouchStart = (e) => {
    if (!isMobile()) return;
    editStartYRef.current = e.touches[0].clientY;
    setEditDragY(0);
  };
  const handleEditTouchMove = (e) => {
    if (!isMobile()) return;
    const y = e.touches[0].clientY;
    const diff = y - editStartYRef.current;
    if (diff > 0) setEditDragY(diff);
  };
  const handleEditTouchEnd = () => {
    if (!isMobile()) return;
    const closeThreshold = window.innerHeight * 0.08;
    if (editDragY >= closeThreshold) {
      setEditModalOpen(false);
      setEditDragY(0);
    } else {
      setEditDragY(0);
    }
  };

  useEffect(() => {
    if (!isMobile() || !editModalOpen || !editHandleRef.current) return;
    const el = editHandleRef.current;
    const onMove = (e) => {
      const diff = e.touches[0].clientY - editStartYRef.current;
      if (diff > 0) e.preventDefault();
    };
    el.addEventListener('touchmove', onMove, { passive: false });
    return () => el.removeEventListener('touchmove', onMove);
  }, [editModalOpen]);

  const handleSocialTouchStart = (e) => {
    if (!isMobile()) return;
    socialStartYRef.current = e.touches[0].clientY;
    socialDragYRef.current = 0;
    setSocialDragY(0);
  };
  const handleSocialTouchMove = (e) => {
    if (!isMobile()) return;
    const y = e.touches[0].clientY;
    const diff = y - socialStartYRef.current;
    if (diff > 0) {
      socialDragYRef.current = diff;
      setSocialDragY(diff);
    }
  };
  const handleSocialTouchEnd = () => {
    if (!isMobile()) return;
    const closeThreshold = window.innerHeight * 0.08;
    if (socialDragYRef.current >= closeThreshold) {
      setSocialModalOpen(false);
    }
    socialDragYRef.current = 0;
    setSocialDragY(0);
  };

  const handleContactTouchStart = (e) => {
    if (!isMobile()) return;
    contactStartYRef.current = e.touches[0].clientY;
    contactDragYRef.current = 0;
    setContactDragY(0);
  };
  const handleContactTouchMove = (e) => {
    if (!isMobile()) return;
    const y = e.touches[0].clientY;
    const diff = y - contactStartYRef.current;
    if (diff > 0) {
      contactDragYRef.current = diff;
      setContactDragY(diff);
    }
  };
  const handleContactTouchEnd = () => {
    if (!isMobile()) return;
    const closeThreshold = window.innerHeight * 0.08;
    if (contactDragYRef.current >= closeThreshold) {
      setContactModalOpen(false);
    }
    contactDragYRef.current = 0;
    setContactDragY(0);
  };

  useEffect(() => {
    if (!isMobile() || !socialModalOpen || !socialSheetRef.current) return;
    const el = socialSheetRef.current;
    const onMove = (e) => {
      const diff = e.touches[0].clientY - socialStartYRef.current;
      if (diff > 0) e.preventDefault();
    };
    el.addEventListener('touchmove', onMove, { passive: false });
    return () => el.removeEventListener('touchmove', onMove);
  }, [socialModalOpen]);

  useEffect(() => {
    if (!isMobile() || !contactModalOpen || !contactSheetRef.current) return;
    const el = contactSheetRef.current;
    const onMove = (e) => {
      const diff = e.touches[0].clientY - contactStartYRef.current;
      if (diff > 0) e.preventDefault();
    };
    el.addEventListener('touchmove', onMove, { passive: false });
    return () => el.removeEventListener('touchmove', onMove);
  }, [contactModalOpen]);

  useEffect(() => {
    const ids = [...subscribedSellerIds];
    setSubscribedSellers(ids.map((id) => getSellerById(id)).filter(Boolean));
  }, [subscribedSellerIds, getSellerById]);

  useEffect(() => {
    if (subscriptionsModalOpen) {
      loadMySubscriptions();
    }
  }, [subscriptionsModalOpen, loadMySubscriptions]);

  const loadPendingReviews = useCallback(async () => {
    if (!authToken) {
      setPendingReviews([]);
      return;
    }
    setPendingReviewsLoading(true);
    try {
      const data = await fetchPendingReviews(authToken);
      setPendingReviews(Array.isArray(data.items) ? data.items : []);
    } catch {
      setPendingReviews([]);
    } finally {
      setPendingReviewsLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (!userData.isAuthenticated || !authToken) {
      setPendingReviews([]);
      return;
    }
    loadPendingReviews();
  }, [userData.isAuthenticated, authToken, loadPendingReviews]);

  useEffect(() => {
    const onUpdate = () => {
      loadPendingReviews();
    };
    window.addEventListener('pendingReviewsUpdated', onUpdate);
    return () => window.removeEventListener('pendingReviewsUpdated', onUpdate);
  }, [loadPendingReviews]);

  const openPendingReviewsModal = () => {
    loadPendingReviews();
    setPendingReviewsModalOpen(true);
  };

  const handleLeaveFeedback = (item) => {
    setSelectedPendingReview(item);
    setPendingCommentFormOpen(true);
  };

  const loadMessageThreads = useCallback(async () => {
    if (!authToken) {
      setMessageThreads([]);
      setMessageThreadsUnread(0);
      return;
    }
    setMessageThreadsLoading(true);
    try {
      const data = await fetchMessageChatThreads(authToken);
      setMessageThreads(Array.isArray(data.items) ? data.items : []);
      setMessageThreadsUnread(Number(data.totalUnread) || 0);
    } catch {
      setMessageThreads([]);
      setMessageThreadsUnread(0);
    } finally {
      setMessageThreadsLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (!userData.isAuthenticated || !authToken) {
      setMessageThreads([]);
      setMessageThreadsUnread(0);
      return;
    }
    loadMessageThreads();
  }, [userData.isAuthenticated, authToken, loadMessageThreads]);

  useEffect(() => {
    const onUpdate = () => {
      loadMessageThreads();
    };
    window.addEventListener('messageChatUpdated', onUpdate);
    return () => window.removeEventListener('messageChatUpdated', onUpdate);
  }, [loadMessageThreads]);

  useMessageChatSocketThreadsUpdated(() => {
    loadMessageThreads();
  });

  const openMessagesModal = () => {
    loadMessageThreads();
    setMessagesModalOpen(true);
  };

  const handleOpenMessageThread = (thread) => {
    setMessagesModalOpen(false);
    setActiveChatSellerId(thread.sellerId);
    setIsProfileSellerChatOpen(true);
  };

  const activeChatSeller = useMemo(() => {
    if (!activeChatSellerId) return null;
    const fromCatalog = getSellerById(activeChatSellerId);
    if (fromCatalog) return fromCatalog;
    const thread = messageThreads.find((item) => item.sellerId === activeChatSellerId);
    if (!thread) return null;
    return {
      id: thread.sellerId,
      name: thread.sellerName,
      logo: thread.sellerLogo,
    };
  }, [activeChatSellerId, getSellerById, messageThreads]);

  const {
    messages: profileChatMessages,
    isSending: isProfileChatSending,
    sendText: sendProfileChatText,
    sendImage: sendProfileChatImage,
    sendProduct: sendProfileChatProduct,
  } = useSellerMessageChat({
    authToken,
    sellerId: activeChatSellerId,
    enabled: isProfileSellerChatOpen && Boolean(authToken),
  });

  const {
    isPartnerTyping: isProfileSellerTyping,
    handleComposerActivity: handleProfileChatComposerActivity,
    stopTyping: stopProfileChatTyping,
  } = useMessageChatTyping({
    sellerId: activeChatSellerId,
    enabled: isProfileSellerChatOpen && Boolean(authToken),
    watchSender: 'seller',
  });

  const currentLang = LANGUAGES.find((l) => l.code === (i18n.language || 'uz')) || LANGUAGES[0];
  const lang = i18n.language || 'uz';
  const langKey = String(lang).toLowerCase().startsWith('ru') ? 'ru' : 'uz';

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    const list = [];
    for (let y = current; y >= 1920; y -= 1) list.push(y);
    return list;
  }, []);

  const monthOptions = useMemo(() => {
    const locale = langKey === 'ru' ? 'ru-RU' : 'uz-UZ';
    return Array.from({ length: 12 }, (_, i) => {
      const label = new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2000, i, 1));
      return { value: i + 1, label };
    });
  }, [langKey]);

  const dayOptions = useMemo(() => {
    const dim = daysInMonth(pickMonth, pickYear);
    return Array.from({ length: dim }, (_, i) => i + 1);
  }, [pickMonth, pickYear]);

  const birthDateDisplay = useMemo(
    () => formatBirthDateDisplay(formData.birthDate),
    [formData.birthDate],
  );

  const openBirthDatePicker = () => {
    const iso = formData.birthDate;
    if (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      const [y, m, d] = iso.split('-').map(Number);
      const dim = daysInMonth(m, y);
      setPickYear(y);
      setPickMonth(m);
      setPickDay(Math.min(d, dim));
    } else {
      const currentY = new Date().getFullYear();
      setPickYear(Math.max(1920, currentY - 25));
      setPickMonth(1);
      setPickDay(1);
    }
    setBirthDatePickerOpen(true);
  };

  const cancelBirthDatePicker = () => setBirthDatePickerOpen(false);

  const saveBirthDatePicker = () => {
    const dim = daysInMonth(pickMonth, pickYear);
    const day = Math.min(pickDay, dim);
    const pad = (n) => String(n).padStart(2, '0');
    setFormData((prev) => ({
      ...prev,
      birthDate: `${pickYear}-${pad(pickMonth)}-${pad(day)}`,
    }));
    setBirthDatePickerOpen(false);
  };

  const applyPickMonth = (m) => {
    setPickMonth(m);
    const dim = daysInMonth(m, pickYear);
    setPickDay((d) => Math.min(d, dim));
    setOpenBirthList(null);
  };

  const applyPickYear = (y) => {
    setPickYear(y);
    const dim = daysInMonth(pickMonth, y);
    setPickDay((d) => Math.min(d, dim));
    setOpenBirthList(null);
  };

  const applyPickDay = (d) => {
    setPickDay(d);
    setOpenBirthList(null);
  };

  useEffect(() => {
    if (!birthDatePickerOpen) return;
    const dim = daysInMonth(pickMonth, pickYear);
    setPickDay((d) => (d > dim ? dim : d));
  }, [birthDatePickerOpen, pickMonth, pickYear]);

  const closeAboutModal = () => {
    setAboutModalClosing(true);
    setTimeout(() => {
      setAboutModalOpen(false);
      setAboutModalClosing(false);
    }, 300);
  };

  const toggleAboutSection = (id) => {
    setOpenAboutSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.startsWith('998')) {
      value = value.substring(3);
    }
    if (value.length > 0) {
      let formatted = '+998 ';
      if (value.length > 0) formatted += value.substring(0, 2);
      if (value.length > 2) formatted += ' ' + value.substring(2, 5);
      if (value.length > 5) formatted += ' ' + value.substring(5, 7);
      if (value.length > 7) formatted += ' ' + value.substring(7, 9);
      setFormData(prev => ({ ...prev, phone: formatted.trim() }));
    } else {
      setFormData(prev => ({ ...prev, phone: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = t('profile.errorFirstName');
    if (!formData.lastName.trim()) newErrors.lastName = t('profile.errorLastName');
    if (!formData.phone.trim()) newErrors.phone = t('profile.errorPhone');
    const emailTrimmed = formData.email.trim();
    if (!emailTrimmed) {
      newErrors.email = t('profile.errorEmail');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      newErrors.email = t('profile.errorEmailInvalid');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phone: formData.phone.trim(),
      email: emailTrimmed,
      birthDate: formData.birthDate,
      gender: formData.gender,
    };

    if (!authToken) {
      updateUserData({ ...payload, isAuthenticated: true });
      setEditModalOpen(false);
      return;
    }

    try {
      const res = await updateProfile(authToken, payload);
      const mapped = mapApiUserToClient(res.user);
      if (mapped) updateUserData(mapped);
      setEditModalOpen(false);
    } catch (err) {
      setErrors({ email: err.message || t('profile.errorSendCode') });
    }
  };

  const openAvatarModal = () => {
    setAvatarPreview(userData.profileImage || null);
    setAvatarModalOpen(true);
  };

  const closeAvatarModal = () => {
    setAvatarModalOpen(false);
    setAvatarPreview(null);
  };

  const selectPresetAvatar = (src) => {
    setAvatarPreview(src);
  };

  const saveAvatar = async () => {
    if (!avatarPreview) return;
    const patch = {
      profileImage: avatarPreview,
      hasUploadedImage: true,
    };
    if (!authToken) {
      updateUserData(patch);
      closeAvatarModal();
      return;
    }
    try {
      const res = await updateProfile(authToken, patch);
      const mapped = mapApiUserToClient(res.user);
      if (mapped) updateUserData(mapped);
      closeAvatarModal();
    } catch {
      updateUserData(patch);
      closeAvatarModal();
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-header__image">
                <div
                  className="profile-image-wrapper"
                  role="button"
                  tabIndex={0}
                  onClick={openAvatarModal}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openAvatarModal();
                    }
                  }}
                  aria-label={t('profile.avatarModalTitle')}
                >
                  <img
                    src={userData.profileImage}
                    alt=""
                    onError={(e) => {
                      e.target.src = DEFAULT_AVATAR_SRC;
                    }}
                  />
                  <div className="image-overlay" aria-hidden="true">
                    <i className="bx bx-camera" />
                  </div>
              </div>
            </div>
            <div className="profile-header__info">
              <div className="profile-header__title-row">
                <h1>{t('profile.title')}</h1>
                <button
                  type="button"
                  className="profile-edit-icon"
                  onClick={() => setEditModalOpen(true)}
                  aria-label={t('profile.editProfile')}
                >
                  <i className="bx bx-edit-alt"></i>
                </button>
              </div>
              <div className="profile-filled-data">
                <div className="profile-filled-names-row">
                  <div
                    className={`profile-filled-item profile-filled-item--name${userData.firstName?.trim() ? ' profile-filled-item--value-only' : ''}`}
                  >
                    {!userData.firstName?.trim() && (
                      <span className="profile-filled-label">{t('profile.firstName')}</span>
                    )}
                    <span
                      className="profile-filled-value"
                      {...(userData.firstName?.trim()
                        ? { 'aria-label': t('profile.firstName') }
                        : {})}
                    >
                      {userData.firstName?.trim() || '—'}
                    </span>
                  </div>
                  <div
                    className={`profile-filled-item profile-filled-item--name${userData.lastName?.trim() ? ' profile-filled-item--value-only' : ''}`}
                  >
                    {!userData.lastName?.trim() && (
                      <span className="profile-filled-label">{t('profile.lastName')}</span>
                    )}
                    <span
                      className="profile-filled-value"
                      {...(userData.lastName?.trim()
                        ? { 'aria-label': t('profile.lastName') }
                        : {})}
                    >
                      {userData.lastName?.trim() || '—'}
                    </span>
                  </div>
                </div>
                <div
                  className={`profile-filled-item profile-filled-item--phone${userData.phone?.trim() ? ' profile-filled-item--value-only' : ''}`}
                >
                  {!userData.phone?.trim() && (
                    <span className="profile-filled-label">{t('profile.phone')}</span>
                  )}
                  <span
                    className="profile-filled-value"
                    {...(userData.phone?.trim() ? { 'aria-label': t('profile.phone') } : {})}
                  >
                    {userData.phone?.trim() || '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-language-row" onClick={() => setLanguageModalOpen(true)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setLanguageModalOpen(true)} aria-label={t('profile.appLanguage')}>
            <img src={currentLang.flag} alt={currentLang.code} className="language-flag" />
            <span className="profile-language-label">{t('profile.appLanguage')}</span>
          </div>

          <Link to="/wishlist" className="profile-wishlist-row">
            <i className="far fa-heart profile-wishlist-icon"></i>
            <span className="profile-wishlist-label">{t('profile.wishlist')}</span>
          </Link>

          <Link to="/order-history" className="profile-orders-row">
            <i className="bx bx-receipt profile-orders-icon"></i>
            <span className="profile-orders-label">{t('profile.myOrders')}</span>
          </Link>

          {userData.sellerAccountId && getSellerById(userData.sellerAccountId) && (
            <Link to={`/seller/${userData.sellerAccountId}`} className="profile-seller-cabinet-row">
              <i className="bx bx-store-alt profile-seller-cabinet-icon"></i>
              <span className="profile-seller-cabinet-label">{t('profile.sellerMyCabinet')}</span>
            </Link>
          )}

          <div
            className="profile-violet-movie-row"
            onClick={() => setSocialModalOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setSocialModalOpen(true)}
            aria-label={getLocalizedText({ uz: "Violet Market ijtimoiy tarmoqlari", ru: "Социальные сети Violet Market" }, lang)}
          >
            <img src={footerData?.socialMedia?.[0]?.icon || '/img/telegram.png'} alt="" className="profile-violet-movie-icon-img" />
            <span className="profile-violet-movie-label">{getLocalizedText({ uz: "Violet Market ijtimoiy tarmoqlari", ru: "Социальные сети Violet Market" }, lang)}</span>
          </div>

          <div
            className="profile-contact-row"
            onClick={() => setContactModalOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setContactModalOpen(true)}
            aria-label={getLocalizedText({ uz: "Biz bilan bog'lanish", ru: "Связаться с нами" }, lang)}
          >
            <i className="bx bx-message-dots profile-contact-icon"></i>
            <span className="profile-contact-label">{getLocalizedText({ uz: "Biz bilan bog'lanish", ru: "Связаться с нами" }, lang)}</span>
          </div>

          <div
            className="profile-subscriptions-block"
            onClick={() => {
              loadMySubscriptions();
              setSubscriptionsModalOpen(true);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                loadMySubscriptions();
                setSubscriptionsModalOpen(true);
              }
            }}
            aria-label={t('profile.subscriptions')}
            aria-haspopup="dialog"
            aria-expanded={subscriptionsModalOpen}
          >
            <div className="profile-subscriptions-heading">
              <i className="bx bx-bell profile-subscriptions-heading__icon" aria-hidden="true" />
              <span className="profile-subscriptions-heading__label">{t('profile.subscriptions')}</span>
              <i className="bx bx-chevron-right profile-subscriptions-heading__chevron" aria-hidden="true" />
            </div>
          </div>

          <GlobalModal
            isOpen={avatarModalOpen}
            onClose={closeAvatarModal}
            title={t('profile.avatarModalTitle')}
          >
            <div className="profile-avatar-modal">
              <div className="profile-avatar-modal__choices">
                <div className="profile-avatar-modal__preview">
                  <img
                    src={avatarPreview || userData.profileImage || DEFAULT_AVATAR_SRC}
                    alt=""
                    onError={(e) => {
                      e.target.src = DEFAULT_AVATAR_SRC;
                    }}
                  />
                </div>
                <div className="profile-avatar-modal__presets" role="group" aria-label={t('profile.avatarModalTitle')}>
                  {AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className={`profile-avatar-modal__preset${avatarPreview === preset.src ? ' profile-avatar-modal__preset--active' : ''}`}
                      onClick={() => selectPresetAvatar(preset.src)}
                      aria-label={t(preset.ariaLabelKey)}
                      aria-pressed={avatarPreview === preset.src}
                    >
                      <img
                        src={preset.src}
                        alt=""
                        onError={(e) => {
                          e.target.src = DEFAULT_AVATAR_SRC;
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="profile-avatar-modal__save"
                onClick={saveAvatar}
                disabled={!avatarPreview}
              >
                {t('profile.save')}
              </button>
            </div>
          </GlobalModal>

          <GlobalModal
            isOpen={subscriptionsModalOpen}
            onClose={() => setSubscriptionsModalOpen(false)}
            title={t('profile.subscriptions')}
          >
            {subscribedSellers.length === 0 ? (
              <p className="profile-subscriptions-modal-empty">{t('profile.subscriptionsEmpty')}</p>
            ) : (
              <ul className="profile-subscriptions-modal-list">
                {subscribedSellers.map((seller) => (
                  <li key={seller.id}>
                    <Link
                      to={`/seller/${seller.id}`}
                      className="profile-subscriptions-modal-item"
                      onClick={() => setSubscriptionsModalOpen(false)}
                    >
                      <img
                        src={normalizeImagePath(seller.logo)}
                        alt=""
                        className="profile-subscriptions-modal-item__logo"
                        onError={(e) => {
                          e.target.src = normalizeImagePath('/img/no-image.png');
                        }}
                      />
                      <span className="profile-subscriptions-modal-item__name">
                        {getLocalizedText(seller.name, langKey)}
                      </span>
                      <i className="bx bx-chevron-right profile-subscriptions-modal-item__chevron" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </GlobalModal>

          <div
            className="profile-about-row"
            onClick={() => setAboutModalOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setAboutModalOpen(true)}
            aria-label={getLocalizedText({ uz: "Biz haqimizda", ru: "О нас" }, lang)}
          >
            <i className="bx bx-help-circle profile-about-icon"></i>
            <span className="profile-about-label">{getLocalizedText({ uz: "Biz haqimizda", ru: "О нас" }, lang)}</span>
          </div>

          {userData.isAuthenticated && (
            <div
              className="profile-reviews-row"
              onClick={openPendingReviewsModal}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openPendingReviewsModal();
                }
              }}
              aria-label={t('profile.myReviews')}
              aria-haspopup="dialog"
              aria-expanded={pendingReviewsModalOpen}
            >
              <i className="bx bx-star profile-reviews-icon" aria-hidden="true" />
              <span className="profile-reviews-label">{t('profile.myReviews')}</span>
              {pendingReviews.length > 0 && (
                <span className="profile-reviews-badge" aria-hidden="true">
                  {pendingReviews.length}
                </span>
              )}
              <i className="bx bx-chevron-right profile-reviews-chevron" aria-hidden="true" />
            </div>
          )}

          <GlobalModal
            isOpen={pendingReviewsModalOpen}
            onClose={() => setPendingReviewsModalOpen(false)}
            title={t('profile.myReviews')}
          >
            {pendingReviewsLoading ? (
              <ProfilePendingReviewsSkeleton count={3} />
            ) : (
              <ProfilePendingReviewsList
                items={pendingReviews}
                onLeaveFeedback={handleLeaveFeedback}
              />
            )}
          </GlobalModal>

          {selectedPendingReview && (
            <CommentFormModal
              isOpen={pendingCommentFormOpen}
              onClose={() => {
                setPendingCommentFormOpen(false);
                setSelectedPendingReview(null);
              }}
              onSubmit={() => {
                setPendingCommentFormOpen(false);
                setSelectedPendingReview(null);
                loadPendingReviews();
              }}
              productId={selectedPendingReview.productId}
              productName={selectedPendingReview.productTitle}
              productImage={selectedPendingReview.productImage}
              pendingReviewId={selectedPendingReview.id}
            />
          )}

          {userData.isAuthenticated && (
            <div
              className="profile-messages-row"
              onClick={openMessagesModal}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openMessagesModal();
                }
              }}
              aria-label={t('profile.messages')}
              aria-haspopup="dialog"
              aria-expanded={messagesModalOpen}
            >
              <i className="bx bx-message-dots profile-messages-icon" aria-hidden="true" />
              <span className="profile-messages-label">{t('profile.messages')}</span>
              {messageThreadsUnread > 0 && (
                <span className="profile-messages-badge" aria-hidden="true">
                  {messageThreadsUnread > 99 ? '99+' : messageThreadsUnread}
                </span>
              )}
              <i className="bx bx-chevron-right profile-messages-chevron" aria-hidden="true" />
            </div>
          )}

          <GlobalModal
            isOpen={messagesModalOpen}
            onClose={() => setMessagesModalOpen(false)}
            title={t('profile.messages')}
          >
            {messageThreadsLoading ? (
              <ProfilePendingReviewsSkeleton count={3} />
            ) : (
              <ProfileMessageThreadsList
                items={messageThreads}
                onOpenThread={handleOpenMessageThread}
              />
            )}
          </GlobalModal>

          <ProductSellerChatModal
            open={isProfileSellerChatOpen}
            seller={activeChatSeller}
            lang={lang}
            messages={profileChatMessages}
            onClose={() => {
              setIsProfileSellerChatOpen(false);
              setActiveChatSellerId(null);
              loadMessageThreads();
            }}
            onSendText={sendProfileChatText}
            onSendImage={sendProfileChatImage}
            onSendProduct={sendProfileChatProduct}
            isPartnerTyping={isProfileSellerTyping}
            isSending={isProfileChatSending}
            onComposerActivity={handleProfileChatComposerActivity}
            onStopTyping={stopProfileChatTyping}
          />

          <div className="profile-card-auth">
            {userData.isAuthenticated ? (
              <button
                type="button"
                className="profile-card-auth__btn profile-card-auth__btn--logout"
                onClick={() => setLogoutModalOpen(true)}
              >
                {t('profile.logout')}
              </button>
            ) : (
              <Link to="/login" className="profile-card-auth__btn profile-card-auth__btn--login">
                {t('profile.login')}
              </Link>
            )}
          </div>

          <ProfileExit
            isOpen={logoutModalOpen}
            onClose={() => setLogoutModalOpen(false)}
            onConfirm={logout}
          />

          {editModalOpen && (
            <>
              <div className="profile-edit-modal-backdrop" onClick={() => setEditModalOpen(false)} aria-hidden="true" />
              <div
                ref={editSheetRef}
                className={`profile-edit-modal ${isMobile() ? 'profile-edit-modal--bottom' : ''}`}
                style={isMobile() ? { transform: `translateY(${editDragY}px)` } : undefined}
              >
                {isMobile() && (
                  <div
                    ref={editHandleRef}
                    className="profile-edit-modal__drag-handle"
                    role="button"
                    tabIndex={0}
                    aria-label={t('profile.dragToClose')}
                    onTouchStart={handleEditTouchStart}
                    onTouchMove={handleEditTouchMove}
                    onTouchEnd={handleEditTouchEnd}
                    onTouchCancel={handleEditTouchEnd}
                  />
                )}
                <div className="profile-edit-modal__body">
                  <div className="profile-edit-modal__header">
                    <button
                      type="button"
                      className="profile-edit-modal__back"
                      onClick={() => setEditModalOpen(false)}
                      aria-label={t('profile.back')}
                    >
                      <i className="bx bx-arrow-back"></i>
                      <span>{t('profile.back')}</span>
                    </button>
                    <h3 className="profile-edit-modal__title">{t('profile.editModalTitle')}</h3>
                  </div>
                  <form className="profile-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                      <div className="form-group">
                        <label>{t('profile.firstName')}</label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className={errors.firstName ? 'error' : ''}
                        />
                        {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                      </div>

                      <div className="form-group">
                        <label>{t('profile.lastName')}</label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className={errors.lastName ? 'error' : ''}
                        />
                        {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>{t('profile.birthDate')}</label>
                      <div className="profile-birth-field">
                        <input
                          type="text"
                          readOnly
                          value={birthDateDisplay}
                          placeholder={t('profile.birthDatePlaceholder')}
                          className="profile-birth-field__input"
                          onClick={openBirthDatePicker}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              openBirthDatePicker();
                            }
                          }}
                          aria-label={t('profile.pickBirthDateAria')}
                        />
                        <button
                          type="button"
                          className="profile-birth-field__icon-btn"
                          onClick={openBirthDatePicker}
                          aria-label={t('profile.pickBirthDateAria')}
                        >
                          <i className="bx bx-calendar" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>{t('profile.phone')}</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        placeholder={t('profile.phonePlaceholder')}
                        className={errors.phone ? 'error' : ''}
                      />
                      {errors.phone && <span className="error-message">{errors.phone}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="profile-edit-email">{t('profile.email')}</label>
                      <input
                        id="profile-edit-email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder={t('profile.emailPlaceholder')}
                        className={errors.email ? 'error' : ''}
                        autoComplete="email"
                      />
                      {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>

                    <div className="form-group profile-form-group--gender">
                      <label>{t('profile.gender')}</label>
                      <div className="profile-gender-toggle" role="group" aria-label={t('profile.gender')}>
                        <button
                          type="button"
                          className={`profile-gender-btn${formData.gender === 'male' ? ' profile-gender-btn--active' : ''}`}
                          onClick={() => setFormData((p) => ({ ...p, gender: 'male' }))}
                        >
                          {t('profile.genderMale')}
                        </button>
                        <button
                          type="button"
                          className={`profile-gender-btn${formData.gender === 'female' ? ' profile-gender-btn--active' : ''}`}
                          onClick={() => setFormData((p) => ({ ...p, gender: 'female' }))}
                        >
                          {t('profile.genderFemale')}
                        </button>
                      </div>
                    </div>

                    <button type="submit" className="save-btn">
                      {t('profile.save')}
                    </button>
                  </form>

                  {birthDatePickerOpen
                    && createPortal(
                      <>
                        <div
                          className="profile-birth-picker-backdrop"
                          onClick={cancelBirthDatePicker}
                          role="presentation"
                          aria-hidden="true"
                        />
                        <div
                          className="profile-birth-picker"
                          role="dialog"
                          aria-modal="true"
                          aria-labelledby="profile-birth-picker-title"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <h4 id="profile-birth-picker-title" className="profile-birth-picker__title">
                            {t('profile.datePickerTitle')}
                          </h4>
                          <div className="profile-birth-picker__fields">
                            <div className="profile-birth-picker__select-wrap">
                              <span className="profile-birth-picker__select-label" id="birth-picker-month-lbl">
                                {t('profile.month')}
                              </span>
                              <div className="profile-birth-picker__dropdown">
                                <button
                                  type="button"
                                  className={`profile-birth-picker__trigger${openBirthList === 'month' ? ' profile-birth-picker__trigger--open' : ''}`}
                                  onClick={() => setOpenBirthList((p) => (p === 'month' ? null : 'month'))}
                                  aria-haspopup="listbox"
                                  aria-expanded={openBirthList === 'month'}
                                  aria-labelledby="birth-picker-month-lbl"
                                >
                                  <span className="profile-birth-picker__trigger-text">
                                    {monthOptions.find((mo) => mo.value === pickMonth)?.label ?? '—'}
                                  </span>
                                  <i className="bx bx-chevron-down profile-birth-picker__trigger-chevron" aria-hidden="true" />
                                </button>
                                {openBirthList === 'month' && (
                                  <ul className="profile-birth-picker__list" role="listbox" aria-labelledby="birth-picker-month-lbl">
                                    {monthOptions.map((mo) => (
                                      <li key={mo.value} role="none">
                                        <button
                                          type="button"
                                          role="option"
                                          aria-selected={pickMonth === mo.value}
                                          className={`profile-birth-picker__list-option${pickMonth === mo.value ? ' profile-birth-picker__list-option--selected' : ''}`}
                                          onClick={() => applyPickMonth(mo.value)}
                                        >
                                          {mo.label}
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                            <div className="profile-birth-picker__select-wrap">
                              <span className="profile-birth-picker__select-label" id="birth-picker-day-lbl">
                                {t('profile.day')}
                              </span>
                              <div className="profile-birth-picker__dropdown">
                                <button
                                  type="button"
                                  className={`profile-birth-picker__trigger${openBirthList === 'day' ? ' profile-birth-picker__trigger--open' : ''}`}
                                  onClick={() => setOpenBirthList((p) => (p === 'day' ? null : 'day'))}
                                  aria-haspopup="listbox"
                                  aria-expanded={openBirthList === 'day'}
                                  aria-labelledby="birth-picker-day-lbl"
                                >
                                  <span className="profile-birth-picker__trigger-text">{pickDay}</span>
                                  <i className="bx bx-chevron-down profile-birth-picker__trigger-chevron" aria-hidden="true" />
                                </button>
                                {openBirthList === 'day' && (
                                  <ul className="profile-birth-picker__list" role="listbox" aria-labelledby="birth-picker-day-lbl">
                                    {dayOptions.map((d) => (
                                      <li key={d} role="none">
                                        <button
                                          type="button"
                                          role="option"
                                          aria-selected={pickDay === d}
                                          className={`profile-birth-picker__list-option${pickDay === d ? ' profile-birth-picker__list-option--selected' : ''}`}
                                          onClick={() => applyPickDay(d)}
                                        >
                                          {d}
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                            <div className="profile-birth-picker__select-wrap">
                              <span className="profile-birth-picker__select-label" id="birth-picker-year-lbl">
                                {t('profile.year')}
                              </span>
                              <div className="profile-birth-picker__dropdown">
                                <button
                                  type="button"
                                  className={`profile-birth-picker__trigger${openBirthList === 'year' ? ' profile-birth-picker__trigger--open' : ''}`}
                                  onClick={() => setOpenBirthList((p) => (p === 'year' ? null : 'year'))}
                                  aria-haspopup="listbox"
                                  aria-expanded={openBirthList === 'year'}
                                  aria-labelledby="birth-picker-year-lbl"
                                >
                                  <span className="profile-birth-picker__trigger-text">{pickYear}</span>
                                  <i className="bx bx-chevron-down profile-birth-picker__trigger-chevron" aria-hidden="true" />
                                </button>
                                {openBirthList === 'year' && (
                                  <ul className="profile-birth-picker__list profile-birth-picker__list--year" role="listbox" aria-labelledby="birth-picker-year-lbl">
                                    {yearOptions.map((y) => (
                                      <li key={y} role="none">
                                        <button
                                          type="button"
                                          role="option"
                                          aria-selected={pickYear === y}
                                          className={`profile-birth-picker__list-option${pickYear === y ? ' profile-birth-picker__list-option--selected' : ''}`}
                                          onClick={() => applyPickYear(y)}
                                        >
                                          {y}
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="profile-birth-picker__actions">
                            <button type="button" className="profile-birth-picker__btn profile-birth-picker__btn--ghost" onClick={cancelBirthDatePicker}>
                              {t('profile.cancel')}
                            </button>
                            <button type="button" className="profile-birth-picker__btn profile-birth-picker__btn--primary" onClick={saveBirthDatePicker}>
                              {t('profile.save')}
                            </button>
                          </div>
                        </div>
                      </>,
                      document.body,
                    )}
                </div>
              </div>
            </>
          )}

          {languageModalOpen && (
            <>
              <div className="profile-language-modal-backdrop" onClick={() => setLanguageModalOpen(false)} aria-hidden="true" />
              <div
                ref={sheetRef}
                className={`profile-language-modal ${isMobile() ? 'profile-language-modal--bottom' : ''}`}
                style={isMobile() ? { transform: `translateY(${dragY}px)` } : undefined}
              >
                {isMobile() && (
                  <div
                    ref={handleRef}
                    className="profile-language-modal__drag-handle"
                    role="button"
                    tabIndex={0}
                    aria-label={t('profile.dragToClose')}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                  />
                )}
                <div className="profile-language-modal__body">
                  <h3 className="profile-language-modal__title">{t('profile.chooseLanguage')}</h3>
                  <ul className="profile-language-modal__list">
                    {LANGUAGES.map((l) => (
                      <li key={l.code}>
                        <button
                          type="button"
                          className={`profile-language-modal__item ${tempLanguage === l.code ? 'profile-language-modal__item--active' : ''}`}
                          onClick={() => setTempLanguage(l.code)}
                        >
                          <span className="profile-language-modal__name">{t(l.labelKey)}</span>
                          <img src={l.flag} alt={l.code} className="profile-language-modal__flag" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button type="button" className="profile-language-modal__save" onClick={handleLanguageSave}>
                    {t('profile.save')}
                  </button>
                </div>
              </div>
            </>
          )}

          {socialModalOpen && (
            <>
              <div className="profile-social-modal-backdrop" onClick={() => setSocialModalOpen(false)} aria-hidden="true" />
              <div
                ref={socialSheetRef}
                className={`profile-social-modal ${isMobile() ? 'profile-social-modal--bottom' : ''}`}
                style={isMobile() ? { transform: `translateY(${socialDragY}px)` } : undefined}
                {...(isMobile() && {
                  onTouchStart: handleSocialTouchStart,
                  onTouchMove: handleSocialTouchMove,
                  onTouchEnd: handleSocialTouchEnd,
                  onTouchCancel: handleSocialTouchEnd,
                })}
              >
                {isMobile() && (
                  <div ref={socialHandleRef} className="profile-social-modal__drag-handle" aria-hidden="true" />
                )}
                <div className="profile-social-modal__body">
                  <h3 className="profile-social-modal__title">{getLocalizedText({ uz: "Violet Market ijtimoiy tarmoqlari", ru: "Социальные сети Violet Market" }, lang)}</h3>
                  <div className="profile-social-modal__icons">
                    {(footerData?.socialMedia || []).map((social) => (
                      <a
                        key={social.id}
                        href={social.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="profile-social-modal__link"
                      >
                        <img src={normalizeImagePath(social.icon)} alt={social.name} />
                      </a>
                    ))}
                  </div>
                  <div className="profile-social-modal__app-stores">
                    {(footerData?.appStores || []).map((store) => (
                      <a
                        key={store.id}
                        href={store.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="profile-social-modal__app-link"
                      >
                        <img src={normalizeImagePath(store.image)} alt={store.name} loading="lazy" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {contactModalOpen && (
            <>
              <div className="profile-contact-modal-backdrop" onClick={() => setContactModalOpen(false)} aria-hidden="true" />
              <div
                ref={contactSheetRef}
                className={`profile-contact-modal ${isMobile() ? 'profile-contact-modal--bottom' : ''}`}
                style={isMobile() ? { transform: `translateY(${contactDragY}px)` } : undefined}
                {...(isMobile() && {
                  onTouchStart: handleContactTouchStart,
                  onTouchMove: handleContactTouchMove,
                  onTouchEnd: handleContactTouchEnd,
                  onTouchCancel: handleContactTouchEnd,
                })}
              >
                {isMobile() && (
                  <div ref={contactHandleRef} className="profile-contact-modal__drag-handle" aria-hidden="true" />
                )}
                <div className="profile-contact-modal__body">
                  <h3 className="profile-contact-modal__title profile-contact-modal__title--center">{getLocalizedText({ uz: "Biz bilan bog'lanish", ru: "Связаться с нами" }, lang)}</h3>
                  <div className="profile-contact-modal__icons">
                    {(footerData?.contacts?.length ? footerData.contacts : (footerData?.socialMedia || []).filter((s) => s.name === 'Telegram')).map((social) => (
                      <a
                        key={social.id}
                        href={social.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="profile-contact-modal__link"
                      >
                        <img src={normalizeImagePath(social.icon)} alt={social.name} />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {aboutModalOpen && (
            <>
              <div
                className={`profile-about-modal-backdrop ${aboutModalClosing ? 'profile-about-modal-backdrop--closing' : ''}`}
                onClick={closeAboutModal}
                aria-hidden="true"
              />
              <div
                className={`profile-about-modal ${isMobile() ? 'profile-about-modal--fullscreen' : ''} ${aboutModalClosing ? 'profile-about-modal--closing' : ''}`}
              >
                <div className="profile-about-modal__header">
                  <button
                    type="button"
                    className="profile-about-modal__back-btn"
                    onClick={closeAboutModal}
                    aria-label={t('profile.back')}
                  >
                    <i className="bx bx-arrow-back"></i>
                  </button>
                  <h3 className="profile-about-modal__title">
                    {getLocalizedText({ uz: "Biz haqimizda", ru: "О нас" }, lang)}
                  </h3>
                </div>
                <div className="profile-about-modal__body">
                  {(footerData?.aboutSections || []).map((section) => (
                    <div key={section.id} className="profile-about-modal__section">
                      <button
                        type="button"
                        className="profile-about-modal__section-title"
                        onClick={() => toggleAboutSection(section.id)}
                      >
                        {getLocalizedText(section.title, lang)}
                        <i className={`bx ${openAboutSections[section.id] ? 'bx-chevron-up' : 'bx-chevron-down'}`}></i>
                      </button>
                      <div className={`profile-about-modal__section-content ${openAboutSections[section.id] ? 'active' : ''}`}>
                        {section.items.map((item, idx) => (
                          <p key={idx} className="profile-about-modal__item">
                            {getLocalizedText(item.text, lang)}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="container">
        <TavsiyaEtamiz useScrollable={true} />
      </div>
    </div>
  );
};

export default Profile;

