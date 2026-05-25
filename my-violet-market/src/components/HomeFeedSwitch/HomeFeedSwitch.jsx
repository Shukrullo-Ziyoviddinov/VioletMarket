import React from 'react';
import { useTranslation } from 'react-i18next';
import './HomeFeedSwitch.css';

const HomeFeedSwitch = ({ activeTab, onChange }) => {
  const { i18n } = useTranslation();

  return (
    <div className="home-feed-switch" role="tablist" aria-label={i18n.t('home.feedSwitchAria')}>
      <button
        type="button"
        className={`home-feed-switch__btn ${activeTab === 'recommended' ? 'is-active' : ''}`}
        onClick={() => onChange('recommended')}
        role="tab"
        aria-selected={activeTab === 'recommended'}
      >
        {i18n.t('home.feedRecommended')}
      </button>
      <button
        type="button"
        className={`home-feed-switch__btn ${activeTab === 'discount' ? 'is-active' : ''}`}
        onClick={() => onChange('discount')}
        role="tab"
        aria-selected={activeTab === 'discount'}
      >
        {i18n.t('home.feedDiscount')}
      </button>
    </div>
  );
};

export default HomeFeedSwitch;
