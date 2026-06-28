import React, { useCallback, useEffect, useState } from 'react';
import { Empty, Spin, Typography } from 'antd';
import { useSellerAuth } from '../../context/SellerAuthContext';
import { fetchSellerMessageThreads } from '../../api/messageChatApi';
import { useUserMessageChat } from '../../hooks/useUserMessageChat';
import SellerUserChatModal from '../../components/SellerUserChatModal';
import { DEFAULT_USER_AVATAR, resolveUserProfileImage } from '../../utils/mediaUrl';
import './MessagesPage.css';

const { Title } = Typography;

export default function MessagesPage() {
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

  const {
    messages,
    sendText,
    sendImage,
  } = useUserMessageChat({
    token,
    userId: activeUser?.userId,
    enabled: chatOpen && Boolean(token),
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

  return (
    <section className="messages-page">
      <Title level={3} className="messages-page__title">
        Xabarlar
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
        onClose={handleCloseChat}
        onSendText={sendText}
        onSendImage={sendImage}
      />
    </section>
  );
}
