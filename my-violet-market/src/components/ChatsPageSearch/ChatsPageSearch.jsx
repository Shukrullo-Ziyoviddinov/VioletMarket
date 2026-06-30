import React from 'react';
import { useTranslation } from 'react-i18next';
import './ChatsPageSearch.css';

export default function ChatsPageSearch({ onOpen }) {
  const { t } = useTranslation();

  return (
    <div className="chats-page__search">
      <button type="button" className="chats-page-search" onClick={onOpen}>
        <i className="bx bx-search chats-page-search__icon" aria-hidden="true" />
        <span className="chats-page-search__placeholder">{t('chats.search.placeholder')}</span>
      </button>
    </div>
  );
}
