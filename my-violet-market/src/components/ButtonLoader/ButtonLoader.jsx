import React from 'react';
import { useTranslation } from 'react-i18next';
import './ButtonLoader.css';

const ButtonLoader = ({ isLoading, children }) => {
  const { t } = useTranslation();

  // Doimiy wrapper ishlatamiz - DOM struktura o'zgarishi removeChild xatoligiga olib keladi
  return (
    <span className="button-loader-content">
      {isLoading ? (
        <>
          <span className="button-loader-spinner"></span>
          <span className="button-loader-text">{t('loadMore.loading')}</span>
        </>
      ) : (
        children
      )}
    </span>
  );
};

export default ButtonLoader;
