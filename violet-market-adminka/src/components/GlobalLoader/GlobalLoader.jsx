import React from 'react';
import { Spin } from 'antd';
import './GlobalLoader.css';

export default function GlobalLoader({ active = false }) {
  if (!active) return null;

  return (
    <div className="global-loader" role="status" aria-live="polite" aria-label="Sahifa yuklanmoqda">
      <Spin size="large" />
    </div>
  );
}
