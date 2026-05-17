import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchFlashSaleCountdown } from '../../api/flashSaleCountdownApi';
import './FlashSaleCountdown.css';

/**
 * Flash sale — vaqt va progress server + MongoDB dan (localStorage yo'q).
 * Tsikl tugasa server yangi cycleEndsAt yozadi (brauzer yopilsa ham davom etadi).
 */
const FlashSaleCountdown = ({ flashDurationHours, productId }) => {
  const durationHours = Number(flashDurationHours);
  const pid = productId != null ? Number(productId) : null;
  const totalDurationMs = durationHours > 0 ? durationHours * 60 * 60 * 1000 : 0;

  const [timeLeftMs, setTimeLeftMs] = useState(0);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const endTimeRef = useRef(0);
  const clockSkewRef = useRef(0);
  const intervalRef = useRef(null);
  const syncingRef = useRef(false);
  const cycleRenewRef = useRef(false);

  const applyServerState = useCallback((data) => {
    if (!data?.cycleEndsAt || totalDurationMs <= 0) return;
    const serverNow = data.serverNow ? new Date(data.serverNow).getTime() : Date.now();
    const endTime = new Date(data.cycleEndsAt).getTime();
    endTimeRef.current = endTime;
    clockSkewRef.current = Date.now() - serverNow;
    const left = Math.max(0, endTime - (Date.now() - clockSkewRef.current));
    setTimeLeftMs(left);
    setProgress(
      typeof data.progressPercent === 'number'
        ? data.progressPercent
        : Math.min(100, Math.max(0, 100 - (left / totalDurationMs) * 100)),
    );
    setReady(true);
  }, [totalDurationMs]);

  const syncFromServer = useCallback(async () => {
    if (pid == null || durationHours <= 0 || syncingRef.current) return;
    syncingRef.current = true;
    try {
      const data = await fetchFlashSaleCountdown(pid, durationHours);
      applyServerState(data);
    } catch {
      setReady(false);
    } finally {
      syncingRef.current = false;
    }
  }, [pid, durationHours, applyServerState]);

  useEffect(() => {
    if (pid == null || durationHours <= 0) return undefined;

    syncFromServer();

    const tick = () => {
      const now = Date.now() - clockSkewRef.current;
      const end = endTimeRef.current;
      let left = Math.max(0, end - now);

      if (left <= 0) {
        if (!cycleRenewRef.current && !syncingRef.current) {
          cycleRenewRef.current = true;
          syncFromServer().finally(() => {
            cycleRenewRef.current = false;
          });
        }
        return;
      }

      setTimeLeftMs(left);
      setProgress(Math.min(100, Math.max(0, 100 - (left / totalDurationMs) * 100)));
    };

    const id = setInterval(tick, 1000);
    intervalRef.current = id;
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pid, durationHours, totalDurationMs, syncFromServer]);

  if (pid == null || durationHours <= 0 || !ready) return null;

  const hours = Math.floor(timeLeftMs / (60 * 60 * 1000));
  const minutes = Math.floor((timeLeftMs % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((timeLeftMs % (60 * 1000)) / 1000);
  const displayText = `${hours}h : ${minutes}m : ${seconds}s`;

  return (
    <div
      className="flash-sale-countdown"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="flash-sale-countdown__time">{displayText}</span>
      <div className="flash-sale-countdown__track">
        <div
          className="flash-sale-countdown__bar"
          style={{ width: `${progress}%` }}
        >
          <span className="flash-sale-countdown__bar-icon" aria-hidden>
            🔥
          </span>
        </div>
      </div>
    </div>
  );
};

export default FlashSaleCountdown;
