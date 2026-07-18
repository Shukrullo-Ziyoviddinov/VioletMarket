import React from 'react';
import { Avatar, Empty, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { resolveCourierImage } from '../../utils/courierImage';
import './CourierChatThreadsGrid.css';

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

export default function CourierChatThreadsGrid({
  threads = [],
  loading = false,
  onOpenThread,
}) {
  return (
    <section className="courier-chat-threads">
      <div className="courier-chat-threads__head">
        <Title level={3} className="courier-chat-threads__title">
          Kuryer bilan chat
        </Title>
      </div>

      {!loading && !threads.length ? (
        <Empty description="Hali kuryerlar bilan yozishma yo‘q" />
      ) : (
        <div className="courier-chat-threads__grid">
          {threads.map((thread) => {
            const fullName =
              `${thread.firstName || ''} ${thread.lastName || ''}`.trim() ||
              thread.email ||
              'Kuryer';

            return (
              <button
                key={thread.deliveryId}
                type="button"
                className="courier-chat-threads__card"
                onClick={() => onOpenThread?.(thread)}
              >
                <Avatar
                  size={52}
                  src={resolveCourierImage(thread.profileImage) || undefined}
                  icon={<UserOutlined />}
                />
                <div className="courier-chat-threads__meta">
                  <div className="courier-chat-threads__name-row">
                    <p className="courier-chat-threads__name">{fullName}</p>
                    {thread.unreadCount > 0 ? (
                      <span className="courier-chat-threads__badge">
                        {thread.unreadCount}
                      </span>
                    ) : null}
                  </div>
                  <p className="courier-chat-threads__preview">
                    {formatPreview(thread.lastMessage)}
                  </p>
                  <p className="courier-chat-threads__time">
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
