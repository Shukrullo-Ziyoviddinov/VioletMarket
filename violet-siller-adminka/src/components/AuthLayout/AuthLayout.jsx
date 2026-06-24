import React from 'react';
import { Outlet } from 'react-router-dom';
import './AuthLayout.css';

const LOGO_SRC = `${process.env.PUBLIC_URL}/img/${encodeURIComponent('vio_preview_rev_1 (1).png')}`;

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-layout__card">
        <div className="auth-layout__logo-wrap">
          <img src={LOGO_SRC} alt="Violet Market" className="auth-layout__logo" />
        </div>
        <Outlet />
      </div>
    </div>
  );
}
