import React from 'react';

const FlashSaleProgressBar = ({ percent = 0, tone = 'normal' }) => {
  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
  const toneClass =
    tone === 'danger'
      ? 'flash-sale-card__progress-fill--danger'
      : tone === 'warning'
        ? 'flash-sale-card__progress-fill--warning'
        : tone === 'info'
          ? 'flash-sale-card__progress-fill--info'
        : 'flash-sale-card__progress-fill--normal';
  return (
    <div className="flash-sale-card__progress-track" aria-hidden="true">
      <div
        className={`flash-sale-card__progress-fill ${toneClass}`}
        style={{ width: `${safePercent}%` }}
      />
    </div>
  );
};

export default FlashSaleProgressBar;
