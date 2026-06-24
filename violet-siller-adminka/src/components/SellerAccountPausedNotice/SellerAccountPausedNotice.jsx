import React from 'react';
import { PauseCircleOutlined } from '@ant-design/icons';
import './SellerAccountPausedNotice.css';

export default function SellerAccountPausedNotice() {
  return (
    <div className="seller-account-paused-notice">
      <div className="seller-account-paused-notice__icon" aria-hidden="true">
        <PauseCircleOutlined />
      </div>
      <p className="seller-account-paused-notice__title">
        Sizning hisobingiz vaqtincha to&apos;xtatilgan
      </p>
      <p className="seller-account-paused-notice__text">
        Admin tomonidan do&apos;koningiz vaqtincha to&apos;xtatilgan. Mahsulotlaringiz mijozlar
        uchun ko&apos;rinmaydi. Savollar bo&apos;lsa, platforma administratoriga murojaat qiling.
      </p>
    </div>
  );
}
