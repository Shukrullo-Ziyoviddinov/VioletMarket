import React, { useId } from 'react';
import { RiseOutlined } from '@ant-design/icons';
import './AdminStatCard.css';

function SalesSparkline({ gradientId }) {
  return (
    <svg viewBox="0 0 120 48" fill="none" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 34 C12 33 18 26 30 28 C42 30 52 20 64 22 C76 24 88 14 98 16 C108 18 114 10 120 8 L120 48 L0 48 Z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M0 34 C12 33 18 26 30 28 C42 30 52 20 64 22 C76 24 88 14 98 16 C108 18 114 10 120 8"
        stroke="#3b82f6"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="120" cy="8" r="3.5" fill="#3b82f6" />
    </svg>
  );
}

export default function AdminStatCard({
  icon,
  iconTone = 'purple',
  title,
  value,
  footerLabel,
  footerHighlight,
  badgeText,
  showChart = false,
  onClick,
  clickable = false,
}) {
  const gradientId = useId().replace(/:/g, '');
  const isInteractive = clickable || typeof onClick === 'function';

  const handleKeyDown = (event) => {
    if (!isInteractive || typeof onClick !== 'function') return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(event);
    }
  };

  return (
    <article
      className={`admin-stat-card${isInteractive ? ' admin-stat-card--clickable' : ''}`}
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
    >
      <div className="admin-stat-card__top">
        <div className="admin-stat-card__title-row">
          <span className={`admin-stat-card__icon-wrap admin-stat-card__icon-wrap--${iconTone}`}>
            {icon}
          </span>
          <h3 className="admin-stat-card__title">{title}</h3>
        </div>
        {badgeText ? (
          <span className="admin-stat-card__badge">
            <RiseOutlined className="admin-stat-card__badge-icon" />
            {badgeText}
          </span>
        ) : null}
      </div>

      <div className="admin-stat-card__body">
        <p className="admin-stat-card__value">{value}</p>
        {showChart ? (
          <div className="admin-stat-card__chart">
            <SalesSparkline gradientId={gradientId} />
          </div>
        ) : null}
      </div>

      {footerLabel || footerHighlight ? (
        <p className="admin-stat-card__footer">
          {footerLabel ? <span className="admin-stat-card__footer-label">{footerLabel}</span> : null}
          {footerHighlight ? (
            <span className="admin-stat-card__footer-highlight">{footerHighlight}</span>
          ) : null}
        </p>
      ) : null}
    </article>
  );
}
