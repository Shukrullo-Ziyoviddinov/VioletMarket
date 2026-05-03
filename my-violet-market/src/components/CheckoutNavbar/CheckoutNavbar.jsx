import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../contexts/UserContext';
import { normalizeImagePath } from '../../utils/utils';
import './CheckoutNavbar.css';

const CheckoutNavbar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userData } = useUser();
  const fullName = [userData?.firstName, userData?.lastName].filter(Boolean).join(' ') || '';

  return (
    <header className="checkout-navbar">
      <div className="checkout-navbar__container">
        <button
          type="button"
          className="checkout-navbar__back"
          onClick={() => navigate(-1)}
          aria-label={t('search.back')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <Link to="/" className="checkout-navbar__logo">
          <img
            src={normalizeImagePath('/img/vio_preview_rev_1 (1).png')}
            alt="Violet"
            className="checkout-navbar__logo-img"
          />
        </Link>
        <h1 className="checkout-navbar__title">
          {t('checkout.navbarTitle')}
        </h1>
        <div className="checkout-navbar__spacer" aria-hidden="true" />
        <div className="checkout-navbar__user">
          {fullName}
        </div>
      </div>
    </header>
  );
};

export default CheckoutNavbar;
