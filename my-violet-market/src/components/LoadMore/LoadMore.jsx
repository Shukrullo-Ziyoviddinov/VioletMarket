import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './LoadMore.css';

const LOADER_DURATION_MS = 2000;

const LoadMore = ({ onLoadMore }) => {
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    if (loading) return;
    setLoading(true);
    setTimeout(() => {
      onLoadMore?.();
      setLoading(false);
    }, LOADER_DURATION_MS);
  };

  return (
    <div className="load-more-container">
      <button
        type="button"
        className={`load-more-btn ${loading ? 'load-more-btn--loading' : ''}`}
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="load-more-btn__spinner" aria-hidden="true" />
            <span className="load-more-btn__text">{i18n.t('loadMore.loading')}</span>
          </>
        ) : (
          <span className="load-more-btn__text">{i18n.t('loadMore.button')}</span>
        )}
      </button>
    </div>
  );
};

export default LoadMore;

