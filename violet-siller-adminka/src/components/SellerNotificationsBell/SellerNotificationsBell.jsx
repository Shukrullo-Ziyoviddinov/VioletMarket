import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellOutlined, CheckCircleOutlined, CloseCircleOutlined, CustomerServiceOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import GlobalModal from '../GlobalModal/GlobalModal';
import { OPEN_SELLER_SUPPORT_CHAT_EVENT } from '../../constants/sellerSupportChatEvents';
import { useSellerNotifications } from '../../hooks/useSellerNotifications';
import {
  formatNotificationBadgeCount,
  formatNotificationDateTime,
} from '../../utils/notificationDisplay';
import './SellerNotificationsBell.css';

function isSupportChatNotification(notification) {
  return String(notification?.type || '') === 'support_chat_message_received';
}

function isCustomerChatNotification(notification) {
  if (isSupportChatNotification(notification)) return false;
  return (
    String(notification?.type || '') === 'chat_message_received'
    || Boolean(String(notification?.userId || '').trim())
  );
}

function NotificationStatusIcon({ status }) {
  if (status === 'approved') {
    return <CheckCircleOutlined className="seller-notifications-bell__icon seller-notifications-bell__icon--approved" />;
  }
  if (status === 'rejected') {
    return <CloseCircleOutlined className="seller-notifications-bell__icon seller-notifications-bell__icon--rejected" />;
  }
  return <BellOutlined className="seller-notifications-bell__icon" />;
}

function ChatNotificationItem({ notification }) {
  const userName = notification.userName || 'Mijoz';
  const title = notification.message || `${userName} sizga xabar yubordi`;
  const preview = notification.previewText || '';

  return (
    <>
      <div className="seller-notifications-bell__avatar">
        {notification.userAvatarUrl ? (
          <img src={notification.userAvatarUrl} alt={userName} />
        ) : (
          <span>{userName.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="seller-notifications-bell__content">
        <strong>{title}</strong>
        {preview ? (
          <p className="seller-notifications-bell__preview" title={preview}>
            {preview}
          </p>
        ) : null}
        <span>{formatNotificationDateTime(notification.createdAt)}</span>
      </div>
    </>
  );
}

function SupportChatNotificationItem({ notification }) {
  const preview = notification.previewText || '';

  return (
    <>
      <div className="seller-notifications-bell__avatar">
        <CustomerServiceOutlined />
      </div>
      <div className="seller-notifications-bell__content">
        <strong>{notification.message || 'Sizga yordam xizmati javob yozdi'}</strong>
        {preview ? (
          <p className="seller-notifications-bell__preview" title={preview}>
            {preview}
          </p>
        ) : null}
        <span>{formatNotificationDateTime(notification.createdAt)}</span>
      </div>
    </>
  );
}

function PaymentNotificationItem({ notification }) {
  return (
    <>
      <NotificationStatusIcon status={notification.status} />
      <div className="seller-notifications-bell__content">
        <strong>{notification.message}</strong>
        <span>{formatNotificationDateTime(notification.createdAt)}</span>
      </div>
    </>
  );
}

export default function SellerNotificationsBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const {
    unreadCount,
    notifications,
    loading,
    loadNotifications,
    markAllRead,
    markDisplayedAsRead,
    refreshUnreadCount,
  } = useSellerNotifications();

  const handleOpen = async () => {
    setOpen(true);
    await loadNotifications();
    await markAllRead({ preserveDisplay: true });
    await refreshUnreadCount();
  };

  const handleClose = () => {
    markDisplayedAsRead();
    setOpen(false);
  };

  const handleItemClick = (notification) => {
    setOpen(false);
    markDisplayedAsRead();
    if (isSupportChatNotification(notification)) {
      window.dispatchEvent(new CustomEvent(OPEN_SELLER_SUPPORT_CHAT_EVENT));
      return;
    }
    if (isCustomerChatNotification(notification)) {
      const nameParts = String(notification.userName || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      navigate('/messages', {
        state: {
          openChat: {
            userId: notification.userId,
            firstName: nameParts[0] || notification.userName || 'Mijoz',
            lastName: nameParts.slice(1).join(' '),
            profileImage: notification.userAvatarUrl || '',
          },
        },
      });
      return;
    }
    navigate('/sales/earnings');
  };

  return (
    <>
      <button
        type="button"
        className="seller-notifications-bell"
        aria-label={t('notifications.open')}
        onClick={handleOpen}
      >
        <BellOutlined />
        {unreadCount > 0 ? (
          <span className="seller-notifications-bell__badge">
            {formatNotificationBadgeCount(unreadCount)}
          </span>
        ) : null}
      </button>

      <GlobalModal
        open={open}
        title={t('notifications.title')}
        onClose={handleClose}
      >
        {loading ? (
          <div className="seller-notifications-bell__loading">
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <div className="seller-notifications-bell__empty">
            {t('notifications.empty')}
          </div>
        ) : (
          <div className="seller-notifications-bell__list">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                className={`seller-notifications-bell__item${
                  notification.readAt ? '' : ' seller-notifications-bell__item--unread'
                }`}
                onClick={() => handleItemClick(notification)}
              >
                {isSupportChatNotification(notification) ? (
                  <SupportChatNotificationItem notification={notification} />
                ) : isCustomerChatNotification(notification) ? (
                  <ChatNotificationItem notification={notification} />
                ) : (
                  <PaymentNotificationItem notification={notification} />
                )}
              </button>
            ))}
          </div>
        )}
      </GlobalModal>
    </>
  );
}
