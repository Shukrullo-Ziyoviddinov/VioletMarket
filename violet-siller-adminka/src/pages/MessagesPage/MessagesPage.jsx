import React, { useCallback, useEffect, useState } from 'react';
import { Empty, Spin, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { useSellerAuth } from '../../context/SellerAuthContext';
import { fetchSellerMessageThreads } from '../../api/messageChatApi';
import { useUserMessageChat } from '../../hooks/useUserMessageChat';
import { useMessageChatTyping } from '../../hooks/useMessageChatTyping';
import { useMessageChatSending } from '../../hooks/useMessageChatSending';
import { useMessageChatPresence } from '../../hooks/useMessageChatPresence';
import SellerUserChatModal from '../../components/SellerUserChatModal';
import { DEFAULT_USER_AVATAR, resolveUserProfileImage } from '../../utils/mediaUrl';
import { useMessageChatSocketThreadsUpdated } from '../../socket/useMessageChatSocket';
import { SELLER_MESSAGE_CHAT_INCOMING_EVENT } from '../../socket/useSellerMessageChatSocketHub';
import './MessagesPage.css';

const { Title } = Typography;

export default function MessagesPage() {
  const { t } = useTranslation();
  const { token } = useSellerAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeUser, setActiveUser] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  const loadThreads = useCallback(async () => {
    if (!token) {
      setThreads([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchSellerMessageThreads(token);
      setThreads(Array.isArray(data.items) ? data.items : []);
    } catch {
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    const onUpdate = () => loadThreads();
    window.addEventListener('sellerMessageChatUpdated', onUpdate);
    return () => window.removeEventListener('sellerMessageChatUpdated', onUpdate);
  }, [loadThreads]);

  useMessageChatSocketThreadsUpdated(loadThreads);

  useEffect(() => {
    const handleIncoming = () => {
      loadThreads();
    };

    window.addEventListener(SELLER_MESSAGE_CHAT_INCOMING_EVENT, handleIncoming);
    return () => window.removeEventListener(SELLER_MESSAGE_CHAT_INCOMING_EVENT, handleIncoming);
  }, [loadThreads]);

  const {
    messages,
    loading: chatLoading,
    isSending,
    sendText,
    sendImage,
    deleteMessage,
    editMessage,
    deleteThread,
  } = useUserMessageChat({
    token,
    userId: activeUser?.userId,
    enabled: chatOpen && Boolean(token),
  });

  const {
    isPartnerTyping: isUserTyping,
    handleComposerActivity: handleUserChatComposerActivity,
    stopTyping: stopUserChatTyping,
  } = useMessageChatTyping({
    userId: activeUser?.userId,
    enabled: chatOpen && Boolean(token),
    watchSender: 'user',
  });

  const { isPartnerSending: isUserPartnerSending } = useMessageChatSending({
    userId: activeUser?.userId,
    enabled: chatOpen && Boolean(token),
    watchSender: 'user',
  });

  const { isPartnerOnline: isUserOnline, partnerLastActiveAt: userLastActiveAt } = useMessageChatPresence({
    userId: activeUser?.userId,
    enabled: chatOpen && Boolean(token),
    watchKind: 'user',
  });

  const handleOpenThread = (thread) => {
    setActiveUser({
      userId: thread.userId,
      firstName: thread.firstName,
      lastName: thread.lastName,
      profileImage: thread.profileImage,
    });
    setChatOpen(true);
  };

  const handleCloseChat = () => {
    setChatOpen(false);
    setActiveUser(null);
    loadThreads();
  };

  useEffect(() => {
    const handleThreadDeleted = (event) => {
      const deletedUserId = event?.detail?.userId;
      if (!deletedUserId || !activeUser?.userId) return;
      if (String(activeUser.userId) === String(deletedUserId)) {
        setChatOpen(false);
        setActiveUser(null);
        loadThreads();
      }
    };

    window.addEventListener('sellerMessageChatThreadDeleted', handleThreadDeleted);
    return () => window.removeEventListener('sellerMessageChatThreadDeleted', handleThreadDeleted);
  }, [activeUser?.userId, loadThreads]);

  return (
    <section className="messages-page">
      <Title level={3} className="messages-page__title">
        {t('messages.title')}
      </Title>

      {loading ? (
        <div className="messages-page__loading">
          <Spin />
        </div>
      ) : threads.length === 0 ? (
        <Empty description="Hozircha xabarlar yo'q" />
      ) : (
        <ul className="messages-page__list">
          {threads.map((thread) => {
            const displayName = [thread.firstName, thread.lastName].filter(Boolean).join(' ') || 'Foydalanuvchi';
            return (
              <li key={thread.userId}>
                <button type="button" className="messages-page__item" onClick={() => handleOpenThread(thread)}>
                  <img
                    src={resolveUserProfileImage(thread.profileImage)}
                    alt=""
                    className="messages-page__avatar"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = DEFAULT_USER_AVATAR;
                    }}
                  />
                  <span className="messages-page__name">{displayName}</span>
                  {thread.unreadCount > 0 ? (
                    <span className="messages-page__badge">
                      {thread.unreadCount > 99 ? '99+' : thread.unreadCount}
                    </span>
                  ) : null}
                  <span className="messages-page__chevron">›</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <SellerUserChatModal
        open={chatOpen}
        user={activeUser}
        messages={messages}
        loading={chatLoading}
        onClose={handleCloseChat}
        onSendText={sendText}
        onSendImage={sendImage}
        onDeleteMessage={deleteMessage}
        onEditMessage={editMessage}
        onDeleteThread={async () => {
          const ok = await deleteThread();
          if (ok) {
            handleCloseChat();
          }
          return ok;
        }}
        isPartnerTyping={isUserTyping}
        isPartnerSending={isUserPartnerSending}
        isPartnerOnline={isUserOnline}
        partnerLastActiveAt={userLastActiveAt}
        isSending={isSending}
        onComposerActivity={handleUserChatComposerActivity}
        onStopTyping={stopUserChatTyping}
      />
    </section>
  );
}
