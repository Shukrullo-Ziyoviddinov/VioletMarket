import React from 'react';
import { useTranslation } from 'react-i18next';
import ChatsThreadListSkeleton from './ChatsThreadListSkeleton';
import ChatsThreadItem from '../ChatsThreadItem';
import './ChatsThreadList.css';

export default function ChatsThreadList({
  threads = [],
  loading = false,
  preferences = {},
  presenceMap = {},
  typingMap = {},
  onOpenThread,
  onTogglePin,
  onArchiveThread,
  onUnarchiveThread,
  onDeleteThread,
}) {
  const { t } = useTranslation();

  if (loading) {
    return <ChatsThreadListSkeleton count={5} />;
  }

  if (!threads.length) {
    return (
      <div className="chats-thread-list chats-thread-list--empty">
        <p>{t('chats.empty')}</p>
      </div>
    );
  }

  return (
    <div className="chats-thread-list">
      {threads.map((thread) => (
        <ChatsThreadItem
          key={thread.sellerId}
          thread={thread}
          preferences={preferences}
          presence={presenceMap[String(thread.sellerId)]}
          isTyping={Boolean(typingMap[String(thread.sellerId)])}
          onOpen={onOpenThread}
          onTogglePin={onTogglePin}
          onArchive={onArchiveThread}
          onUnarchive={onUnarchiveThread}
          onDelete={onDeleteThread}
        />
      ))}
    </div>
  );
}
