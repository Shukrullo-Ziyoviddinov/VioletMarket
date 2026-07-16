import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import GlobalModal from '../GlobalModal/GlobalModal';
import { useSellerNotifications } from '../../hooks/useSellerNotifications';
import {
  formatNotificationBadgeCount,
  formatNotificationDateTime,
} from '../../utils/notificationDisplay';
import './SellerNotificationsBell.css';

function NotificationStatusIcon({ status }) {
  if (status === 'approved') {
    return <CheckCircleOutlined className="seller-notifications-bell__icon seller-notifications-bell__icon--approved" />;
  }
  if (status === 'rejected') {
    return <CloseCircleOutlined className="seller-notifications-bell__icon seller-notifications-bell__icon--rejected" />;
  }
  return <BellOutlined className="seller-notifications-bell__icon" />;
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
    refreshUnreadCount,
  } = useSellerNotifications();

  const handleOpen = async () => {
    setOpen(true);
    await loadNotifications();
    await markAllRead();
    await refreshUnreadCount();
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleItemClick = () => {
    setOpen(false);
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
                onClick={handleItemClick}
              >
                <NotificationStatusIcon status={notification.status} />
                <div className="seller-notifications-bell__content">
                  <strong>{notification.message}</strong>
                  <span>{formatNotificationDateTime(notification.createdAt)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </GlobalModal>
    </>
  );
}
