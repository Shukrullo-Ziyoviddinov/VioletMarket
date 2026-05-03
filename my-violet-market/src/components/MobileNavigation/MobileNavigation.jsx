import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../contexts/CartContext';
import { useNavbar } from '../../contexts/NavbarContext';
import './MobileNavigation.css';

const MobileNavigation = () => {
  const location = useLocation();
  const { i18n } = useTranslation();
  const { getTotalItems } = useCart();
  const { toggleDropdown } = useNavbar();
  const cartCount = getTotalItems();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="mobile-navigation">
      <nav className="mobile-bottom-nav">
        <Link
          to="/"
          className={`mb-nav__link ${isActive('/') ? 'active' : ''}`}
        >
          <i className="bx bxs-home"></i>
          <span className="mb-nav__link__text">{i18n.t('mobileNav.home')}</span>
        </Link>
        <button
          className="mb-nav__link"
          onClick={(e) => {
            e.preventDefault();
            toggleDropdown();
          }}
        >
          <i className="bx bxs-grid-alt"></i>
          <span>{i18n.t('mobileNav.catalog')}</span>
        </button>
        <Link
          to="/cart"
          className={`mb-nav__link ${isActive('/cart') ? 'active' : ''}`}
        >
          <i className="fas fa-shopping-cart"></i>
          <span className="mb-nav__link__text">{i18n.t('mobileNav.cart')}</span>
          {cartCount > 0 && (
            <span className="cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
          )}
        </Link>
        <Link
          to="/profile"
          className={`mb-nav__link ${isActive('/profile') ? 'active' : ''}`}
        >
          <i className="bx bxs-user"></i>
          <span className="mb-nav__link__text">{i18n.t('mobileNav.account')}</span>
        </Link>
      </nav>
    </div>
  );
};

export default MobileNavigation;

