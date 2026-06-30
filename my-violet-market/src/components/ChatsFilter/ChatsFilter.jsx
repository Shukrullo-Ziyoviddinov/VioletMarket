import React from 'react';
import { useTranslation } from 'react-i18next';
import './ChatsFilter.css';

const FILTERS = [
  { id: 'all', labelKey: 'chats.filters.all' },
  { id: 'unread', labelKey: 'chats.filters.unread', badgeKey: 'unreadCount' },
  { id: 'pinned', labelKey: 'chats.filters.pinned' },
  { id: 'archived', labelKey: 'chats.filters.archived' },
];

export default function ChatsFilter({ value = 'all', onChange, unreadCount = 0 }) {
  const { t } = useTranslation();

  return (
    <div className="chats-filter" role="tablist" aria-label={t('chats.filters.label')}>
      {FILTERS.map((filter) => {
        const isActive = value === filter.id;
        const badgeValue = filter.badgeKey === 'unreadCount' ? unreadCount : 0;

        return (
          <button
            key={filter.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`chats-filter__tab${isActive ? ' chats-filter__tab--active' : ''}`}
            onClick={() => onChange?.(filter.id)}
          >
            <span>{t(filter.labelKey)}</span>
            {badgeValue > 0 ? (
              <span className="chats-filter__badge">{badgeValue > 99 ? '99+' : badgeValue}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
