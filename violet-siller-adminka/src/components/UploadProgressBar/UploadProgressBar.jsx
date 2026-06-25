import React from 'react';
import './UploadProgressBar.css';

export default function UploadProgressBar({
  progress = 0,
  label = 'Yuklanmoqda...',
  showPercent = true,
}) {
  const safeProgress = Math.max(0, Math.min(100, Number(progress) || 0));

  return (
    <div className="upload-progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={safeProgress}>
      <div className="upload-progress-bar__head">
        <span>{label}</span>
        {showPercent ? <span>{safeProgress}%</span> : null}
      </div>
      <div className="upload-progress-bar__track">
        <div className="upload-progress-bar__fill" style={{ width: `${safeProgress}%` }} />
      </div>
    </div>
  );
}
