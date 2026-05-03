import React, { useState, useEffect, useRef } from 'react';
import './FlashSaleCountdown.css';

const STORAGE_PREFIX = 'flash-sale-end-';

const FlashSaleCountdown = ({ flashDurationHours, storageKey }) => {
  const totalDurationMs = (flashDurationHours || 3) * 60 * 60 * 1000;
  const key = storageKey != null ? `${STORAGE_PREFIX}${storageKey}` : null;

  const [timeLeftMs, setTimeLeftMs] = useState(0);
  const intervalRef = useRef(null);
  const endTimeRef = useRef(null);

  useEffect(() => {
    if (key == null || totalDurationMs <= 0) return;

    const now = Date.now();
    let endTime = null;
    try {
      const stored = localStorage.getItem(key);
      if (stored) endTime = parseInt(stored, 10);
    } catch (_) {}
    if (!endTime || endTime <= now) {
      endTime = now + totalDurationMs;
      try {
        localStorage.setItem(key, String(endTime));
      } catch (_) {}
    }
    endTimeRef.current = endTime;
    setTimeLeftMs(Math.max(0, endTime - now));

    const tick = () => {
      const now = Date.now();
      let end = endTimeRef.current;
      if (end <= now) {
        end = now + totalDurationMs;
        endTimeRef.current = end;
        try {
          localStorage.setItem(key, String(end));
        } catch (_) {}
      }
      setTimeLeftMs(Math.max(0, end - now));
    };

    const id = setInterval(tick, 1000);
    intervalRef.current = id;
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [key, totalDurationMs]);

  const progress = totalDurationMs > 0
    ? Math.min(100, Math.max(0, 100 - (timeLeftMs / totalDurationMs) * 100))
    : 0;

  const hours = Math.floor(timeLeftMs / (60 * 60 * 1000));
  const minutes = Math.floor((timeLeftMs % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((timeLeftMs % (60 * 1000)) / 1000);
  const displayText = `${hours}h : ${minutes}m : ${seconds}s`;

  if (key == null) return null;

  return (
    <div className="flash-sale-countdown" onClick={(e) => e.stopPropagation()}>
      <span className="flash-sale-countdown__time">{displayText}</span>
      <div className="flash-sale-countdown__track">
        <div
          className="flash-sale-countdown__bar"
          style={{ width: `${progress}%` }}
        >
          <span className="flash-sale-countdown__bar-icon" aria-hidden>🔥</span>
        </div>
      </div>
    </div>
  );
};

export default FlashSaleCountdown;
