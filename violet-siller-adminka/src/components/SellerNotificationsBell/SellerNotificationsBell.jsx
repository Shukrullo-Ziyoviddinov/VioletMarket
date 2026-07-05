import React, { useState } from 'react';
import { BellOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import GlobalModal from '../GlobalModal/GlobalModal';
import './SellerNotificationsBell.css';

export default function SellerNotificationsBell() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="seller-notifications-bell"
        aria-label={t('notifications.open')}
        onClick={() => setOpen(true)}
      >
        <BellOutlined />
      </button>

      <GlobalModal
        open={open}
        title={t('notifications.title')}
        onClose={() => setOpen(false)}
      >
        <div className="seller-notifications-bell__empty">
          {t('notifications.empty')}
        </div>
      </GlobalModal>
    </>
  );
}
