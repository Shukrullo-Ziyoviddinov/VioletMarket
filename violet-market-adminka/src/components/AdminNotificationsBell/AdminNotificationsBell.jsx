import React, { useState } from 'react';
import { BellOutlined } from '@ant-design/icons';
import GlobalModal from '../GlobalModal/GlobalModal';
import './AdminNotificationsBell.css';

export default function AdminNotificationsBell() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="admin-notifications-bell"
        aria-label="Bildirishnomalar"
        onClick={() => setOpen(true)}
      >
        <BellOutlined />
      </button>

      <GlobalModal
        open={open}
        title="Bildirishnomalar"
        onClose={() => setOpen(false)}
      >
        <div className="admin-notifications-bell__empty">
          Hozircha bildirishnoma yo&apos;q
        </div>
      </GlobalModal>
    </>
  );
}
