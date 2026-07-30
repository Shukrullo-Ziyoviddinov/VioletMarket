import React from 'react';
import { Avatar, Empty, Typography } from 'antd';
import { ShopOutlined } from '@ant-design/icons';
import { resolveCourierImage } from '../../utils/courierImage';
import './SellerSupportChatThreadsGrid.css';

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

export default function SellerSupportChatThreadsGrid({
  threads = [],
  loading = false,
  onOpenThread,
}) {
  return (
    <section className="seller-support-chat-threads">
      <div className="seller-support-chat-threads__head">
        <Title level={3} className="seller-support-chat-threads__title">
          Sotuvchi bilan chat
        </Title>
      </div>

      {!loading && !threads.length ? (
        <Empty description="Hali sotuvchi bilan yozishma yo‘q" />
      ) : (
        <div className="seller-support-chat-threads__grid">
          {threads.map((thread) => {
            const title = thread.name || 'Sotuvchi';
            const logoUrl = resolveCourierImage(thread.logoUrl) || thread.logoUrl;

            return (
              <button
                key={thread.sellerId}
                type="button"
                className="seller-support-chat-threads__card"
                onClick={() => onOpenThread?.(thread)}
              >
                <Avatar
                  size={52}
                  src={logoUrl || undefined}
                  icon={!logoUrl ? <ShopOutlined /> : undefined}
                />
                <div className="seller-support-chat-threads__meta">
                  <div className="seller-support-chat-threads__name-row">
                    <p className="seller-support-chat-threads__name">{title}</p>
                    {thread.unreadCount > 0 ? (
                      <span className="seller-support-chat-threads__badge">
                        {thread.unreadCount}
                      </span>
                    ) : null}
                  </div>
                  <p className="seller-support-chat-threads__preview">
                    {formatPreview(thread.lastMessage)}
                  </p>
                  <p className="seller-support-chat-threads__time">
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
