import React, { useMemo, useState } from 'react';
import { Typography } from 'antd';
import SellerChatModal from '../../components/SellerChatModal/SellerChatModal';
import SellerChatThreadItem from '../../components/SellerChatThreadItem/SellerChatThreadItem';
import './MessagesPage.css';

const { Title, Text } = Typography;

const MOCK_THREADS = [
  {
    id: 'thread-1',
    customerName: 'Aziza Karimova',
    customerAvatar: '',
    lastMessage: 'Assalomu alaykum, bu mahsulot bormi?',
    updatedAtLabel: '12:40',
  },
  {
    id: 'thread-2',
    customerName: 'Jasur Toshmatov',
    customerAvatar: '',
    lastMessage: 'Yetkazib berish qancha vaqt oladi?',
    updatedAtLabel: 'Kecha',
  },
];

const INITIAL_MESSAGES = {
  'thread-1': [
    {
      id: 'm1',
      sender: 'customer',
      type: 'text',
      content: 'Assalomu alaykum, bu mahsulot bormi?',
      createdAt: '2026-03-25T12:38:00.000Z',
    },
    {
      id: 'm2',
      sender: 'seller',
      type: 'text',
      content: 'Va alaykum assalom! Ha, hozir mavjud.',
      createdAt: '2026-03-25T12:39:00.000Z',
    },
  ],
  'thread-2': [
    {
      id: 'm3',
      sender: 'customer',
      type: 'text',
      content: 'Yetkazib berish qancha vaqt oladi?',
      createdAt: '2026-03-24T18:10:00.000Z',
    },
  ],
};

function getLastMessagePreview(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return '';
  const last = messages[messages.length - 1];
  if (last.type === 'image') return 'Rasm';
  return String(last.content || '').trim();
}

export default function MessagesPage() {
  const [threads, setThreads] = useState(MOCK_THREADS);
  const [messagesByThread, setMessagesByThread] = useState(INITIAL_MESSAGES);
  const [activeThread, setActiveThread] = useState(null);

  const activeMessages = useMemo(() => {
    if (!activeThread?.id) return [];
    return messagesByThread[activeThread.id] || [];
  }, [activeThread, messagesByThread]);

  const handleOpenThread = (thread) => {
    setActiveThread(thread);
  };

  const handleCloseModal = () => {
    setActiveThread(null);
  };

  const appendMessage = (message) => {
    if (!activeThread?.id) return;

    setMessagesByThread((current) => {
      const nextMessages = [...(current[activeThread.id] || []), message];

      setThreads((threadRows) =>
        threadRows.map((thread) =>
          thread.id === activeThread.id
            ? {
                ...thread,
                lastMessage: getLastMessagePreview(nextMessages),
                updatedAtLabel: 'Hozir',
              }
            : thread,
        ),
      );

      return {
        ...current,
        [activeThread.id]: nextMessages,
      };
    });
  };

  return (
    <section className="messages-page">
      <div className="messages-page__head">
        <Title level={3} className="messages-page__title">
          Xabarlar
        </Title>
        <Text type="secondary" className="messages-page__subtitle">
          Mijozlar bilan yozishmalar.
        </Text>
      </div>

      {threads.length === 0 ? (
        <div className="messages-page__empty">
          <Text type="secondary">Hozircha xabar yo&apos;q.</Text>
        </div>
      ) : (
        <div className="messages-page__list">
          {threads.map((thread) => (
            <SellerChatThreadItem key={thread.id} thread={thread} onOpen={handleOpenThread} />
          ))}
        </div>
      )}

      <SellerChatModal
        open={activeThread != null}
        thread={activeThread}
        messages={activeMessages}
        onClose={handleCloseModal}
        onSendText={appendMessage}
        onSendImage={appendMessage}
      />
    </section>
  );
}
