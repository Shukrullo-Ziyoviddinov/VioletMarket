import React from 'react';
import { Avatar, Empty, Typography } from 'antd';
import { TruckOutlined } from '@ant-design/icons';
import './LogisticaChatThreadsGrid.css';

const { Title } = Typography;

function formatPreview(message) {
  if (!message) return 'Yozishma boshlangan';
  if (message.type === 'image') return '📷 Rasm';
  return String(message.content || '').trim() || 'Yozishma';
}

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('uz-UZ');
}

export default function LogisticaChatThreadsGrid({
  threads = [],
  loading = false,
  onOpenThread,
}) {
  return (
    <section className="logistica-chat-threads">
      <div className="logistica-chat-threads__head">
        <Title level={3} className="logistica-chat-threads__title">
          Logistica bilan chat
        </Title>
      </div>

      {!loading && !threads.length ? (
        <Empty description="Hali logistica bilan yozishma yo‘q" />
      ) : (
        <div className="logistica-chat-threads__grid">
          {threads.map((thread) => {
            const title =
              thread.companyName || thread.email || 'Logistica';

            return (
              <button
                key={thread.logisticaId}
                type="button"
                className="logistica-chat-threads__card"
                onClick={() => onOpenThread?.(thread)}
              >
                <Avatar size={52} icon={<TruckOutlined />} />
                <div className="logistica-chat-threads__meta">
                  <div className="logistica-chat-threads__name-row">
                    <p className="logistica-chat-threads__name">{title}</p>
                    {thread.unreadCount > 0 ? (
                      <span className="logistica-chat-threads__badge">
                        {thread.unreadCount}
                      </span>
                    ) : null}
                  </div>
                  <p className="logistica-chat-threads__preview">
                    {formatPreview(thread.lastMessage)}
                  </p>
                  <p className="logistica-chat-threads__time">
                    {formatTime(thread.lastMessage?.createdAt)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
