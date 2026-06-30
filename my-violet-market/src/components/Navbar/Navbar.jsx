import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../contexts/CartContext';
import { useNavbar } from '../../contexts/NavbarContext';
import { useAppData } from '../../contexts/AppDataContext';
import { useUser } from '../../contexts/UserContext';
import { useMessageChatThreads } from '../../hooks/useMessageChatThreads';
import { normalizeImagePath } from '../../utils/utils';
import SearchBar from '../SearchBar';
import { SkeletonPulse } from '../SkeletonLoader';
import './Navbar.css';

const LANGUAGES = [
  { code: 'uz', flag: '/img/uzb-by.jpg', labelKey: 'language.uz' },
  { code: 'ru', flag: '/img/ru%20b.png', labelKey: 'language.ru' },
];

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 991px)').matches : false
  );
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 991px)');
    const handler = () => setIsMobile(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  return isMobile;
};

const Navbar = () => {
  const { i18n } = useTranslation();
  const { navbarItems, loading, error } = useAppData();
  const appLoading = loading && !error;
  const { isDropdownOpen, toggleDropdown } = useNavbar();
  const { getTotalItems } = useCart();
  const cartCount = getTotalItems();
  const { userData, authToken } = useUser();
  const isAuthenticated = Boolean(userData?.isAuthenticated && authToken);
  const { totalUnread: chatUnread } = useMessageChatThreads(authToken, isAuthenticated);
  const isMobile = useIsMobile();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef(null);

  const langCode = (i18n.language || 'uz').split('-')[0];
  const currentLang = LANGUAGES.find((l) => l.code === langCode) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLanguageChange = (code) => {
    i18n.changeLanguage(code);
    setLangDropdownOpen(false);
  };

  return (
    <>
      <header className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            <img src={normalizeImagePath('/img/vio_preview_rev_1 (1).png')} alt="Violet Market" className="navbar-logo-img" />
          </Link>

          <button 
            className="catalog-btn" 
            id="catalogBtn"
            onClick={toggleDropdown}
          >
            {i18n.t('nav.catalog')}
          </button>

          <div className="search-form">
            <SearchBar isMobile={isMobile} />
          </div>

          <div className="navbar-icons">
            <Link to="/profile" className="navbar-icon">
              <i className="bx bxs-user"></i>
              <span className="navbar-icon-text">{i18n.t('nav.profile')}</span>
            </Link>
            <Link to="/wishlist" className="navbar-icon wishlist-icon">
              <i className="far fa-heart"></i>
              <span className="navbar-icon-text">{i18n.t('nav.wishlist')}</span>
            </Link>
            <Link to="/chats" className="navbar-icon chats-icon">
              <i className="bx bx-message-dots"></i>
              {chatUnread > 0 && (
                <span className="cart-badge">{chatUnread > 99 ? '99+' : chatUnread}</span>
              )}
              <span className="navbar-icon-text">{i18n.t('nav.chat')}</span>
            </Link>
            <Link to="/cart" className="navbar-icon cart-icon">
              <i className="fas fa-shopping-cart"></i>
              {cartCount > 0 && (
                <span className="cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
              )}
              <span className="navbar-icon-text">{i18n.t('nav.cart')}</span>
            </Link>
            <div className="navbar-icon language-flag-wrapper" ref={langDropdownRef}>
              <button
                type="button"
                className="language-flag-btn"
                onClick={() => setLangDropdownOpen((v) => !v)}
                aria-label="Tilni o'zgartirish"
                aria-expanded={langDropdownOpen}
              >
                <img src={currentLang.flag} alt={currentLang.code} className="language-flag" />
              </button>
              {langDropdownOpen && (
                <div className="language-dropdown">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      className={`language-dropdown-item ${langCode === lang.code ? 'active' : ''}`}
                      onClick={() => handleLanguageChange(lang.code)}
                    >
                      <img src={lang.flag} alt={lang.code} className="language-flag" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {isDropdownOpen && (
        <div className="dropdown-overlay" onClick={toggleDropdown}>
          <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
            <button className="close-dropdown" onClick={toggleDropdown}>
              <i className="bx bx-x"></i>
            </button>
            <div className="dropdown-content">
              {appLoading && (!navbarItems || navbarItems.length === 0) ? (
                <div className="dropdown-section" aria-busy="true">
                  <SkeletonPulse className="navbar-dropdown-heading-skeleton" aria-hidden />
                  <div className="dropdown-items-grid">
                    {Array.from({ length: 6 }, (_, i) => (
                      <SkeletonPulse
                        key={`navbar-dd-item-sk-${i}`}
                        className="dropdown-item dropdown-item--skeleton"
                        aria-hidden
                      />
                    ))}
                  </div>
                </div>
              ) : (
                (navbarItems || []).map((section) => (
                  <div key={section.id} className="dropdown-section">
                    <h3 className="dropdown-section-title">
                      {typeof section?.title === 'object'
                        ? section.title?.[langCode] || section.title?.uz || section.title?.ru || ''
                        : section?.title || ''}
                    </h3>
                    <div className="dropdown-items-grid">
                      {section.items &&
                        section.items.map((item) => (
                          <Link
                            key={item.id}
                            to={`/category/${item.id}`}
                            className="dropdown-item"
                            onClick={toggleDropdown}
                          >
                            <div className="dropdown-item-image">
                              <img
                                src={normalizeImagePath(item.image)}
                                alt={
                                  typeof item?.name === 'object'
                                    ? item.name?.[langCode] || item.name?.uz || ''
                                    : item?.name || ''
                                }
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = normalizeImagePath('/img/no-image.png');
                                }}
                              />
                            </div>
                            <div className="dropdown-item-info">
                              <h4 className="dropdown-item-name">
                                {typeof item?.name === 'object'
                                  ? item.name?.[langCode] || item.name?.uz || item.name?.ru || ''
                                  : item?.name || ''}
                              </h4>
                              <p className="dropdown-item-description">
                                {typeof item?.description === 'object'
                                  ? item.description?.[langCode] ||
                                    item.description?.uz ||
                                    item.description?.ru ||
                                    ''
                                  : item?.description || ''}
                              </p>
                            </div>
                          </Link>
                        ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;

