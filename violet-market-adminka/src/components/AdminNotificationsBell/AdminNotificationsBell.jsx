import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import GlobalModal from '../GlobalModal/GlobalModal';
import { useAdminNotifications } from '../../hooks/useAdminNotifications';
import {
  formatNotificationBadgeCount,
  formatNotificationDateTime,
} from '../../utils/notificationDisplay';
import './AdminNotificationsBell.css';

export default function AdminNotificationsBell() {
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
  } = useAdminNotifications();

  const handleOpen = async () => {
    setOpen(true);
    await loadNotifications();
    await markAllRead({ preserveDisplay: true });
    await refreshUnreadCount();
  };

  const handleClose = () => {
    markDisplayedAsRead();
    void markAllRead();
    setOpen(false);
  };

  const handleItemClick = (notification) => {
    setOpen(false);
    markDisplayedAsRead();
    void markAllRead();
    if (notification?.type === 'return_request_submitted') {
      navigate('/return-requests');
      return;
    }
    if (notification?.type === 'seller_support_chat_message_received') {
      navigate('/siller-chats');
      return;
    }
    if (notification?.type === 'logistica_chat_message_received') {
      navigate('/logistica-chats');
      return;
    }
    if (notification?.type === 'courier_support_chat_message_received') {
      navigate('/courier-chats');
      return;
    }
    navigate('/payment-requests');
  };

  return (
    <>
      <button
        type="button"
        className="admin-notifications-bell"
        aria-label="Bildirishnomalar"
        onClick={handleOpen}
      >
        <BellOutlined />
        {unreadCount > 0 ? (
          <span className="admin-notifications-bell__badge">
            {formatNotificationBadgeCount(unreadCount)}
          </span>
        ) : null}
      </button>

      <GlobalModal open={open} title="Bildirishnomalar" onClose={handleClose}>
        {loading ? (
          <div className="admin-notifications-bell__loading">
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <div className="admin-notifications-bell__empty">
            Hozircha bildirishnoma yo&apos;q
          </div>
        ) : (
          <div className="admin-notifications-bell__list">
            {notifications.map((notification) => (
              (() => {
                const displayName =
                  notification.courierName ||
                  notification.logisticaName ||
                  notification.sellerName ||
                  'Bildirishnoma';
                const fallbackInitial =
                  notification.type === 'return_request_submitted'
                    ? 'A'
                    : displayName.charAt(0).toUpperCase() || 'B';

                return (
                  <button
                    key={notification.id}
                    type="button"
                    className={`admin-notifications-bell__item${
                      notification.readAt
                        ? ''
                        : ' admin-notifications-bell__item--unread'
                    }`}
                    onClick={() => handleItemClick(notification)}
                  >
                    <div className="admin-notifications-bell__avatar">
                      {notification.sellerLogoUrl ? (
                        <img
                          src={notification.sellerLogoUrl}
                          alt={displayName}
                        />
                      ) : (
                        <span>{fallbackInitial}</span>
                      )}
                    </div>
                    <div className="admin-notifications-bell__content">
                      <strong>{notification.message}</strong>
                      <span>
                        {formatNotificationDateTime(notification.createdAt)}
                      </span>
                    </div>
                  </button>
                );
              })()
            ))}
          </div>
        )}
      </GlobalModal>
    </>
  );
}
