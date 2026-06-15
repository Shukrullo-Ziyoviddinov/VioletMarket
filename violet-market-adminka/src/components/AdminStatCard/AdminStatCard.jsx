import React from 'react';
import './AdminStatCard.css';

function SalesSparkline() {
  return (
    <svg viewBox="0 0 92 42" fill="none" aria-hidden="true">
      <polyline
        points="2,30 18,24 30,28 42,18 54,22 66,12 78,16 90,8"
        stroke="#3b82f6"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AdminStatCard({
  icon,
  iconTone = 'purple',
  title,
  value,
  footerText,
  badgeText,
  showChart = false,
}) {
  return (
    <article className="admin-stat-card">
      <div className="admin-stat-card__top">
        <div className="admin-stat-card__title-row">
          <span className={`admin-stat-card__icon-wrap admin-stat-card__icon-wrap--${iconTone}`}>
            {icon}
          </span>
          <h3 className="admin-stat-card__title">{title}</h3>
        </div>
        {badgeText ? (
          <span className="admin-stat-card__badge">
            {badgeText}
            <span className="admin-stat-card__badge-arrow">↗</span>
          </span>
        ) : null}
      </div>

      <div className="admin-stat-card__body">
        <p className="admin-stat-card__value">{value}</p>
        {showChart ? (
          <div className="admin-stat-card__chart">
            <SalesSparkline />
          </div>
        ) : null}
      </div>

      {footerText ? <p className="admin-stat-card__footer">{footerText}</p> : null}
    </article>
  );
}
