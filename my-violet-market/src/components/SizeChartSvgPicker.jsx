import React from 'react';
import { getLocalizedText } from '../utils/utils';
import Scrollable from './Scrollable';

function cellText(cell, lang) {
  if (cell == null) return '';
  return getLocalizedText(cell, lang) || String(cell);
}

export default function SizeChartSvgPicker({ rows, lang, selectedIdx, onSelect, ariaLabel }) {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return (
    <Scrollable
      type="product"
      className="size-chart-svg-diagram__picker-scroll"
      skipInteractiveTouchHandling
    >
      <div
        className="size-chart-svg-diagram__picker"
        role="tablist"
        aria-label={ariaLabel}
        style={{ display: 'contents' }}
      >
        {rows.map((r, i) => {
          const label = Array.isArray(r) ? cellText(r[0], lang) : '';
          return (
            <button
              key={`size-chart-pill-${i}`}
              type="button"
              role="tab"
              aria-selected={selectedIdx === i}
              className={`size-chart-svg-diagram__pill ${selectedIdx === i ? 'is-active' : ''}`}
              onClick={() => onSelect(i)}
            >
              {label}
            </button>
          );
        })}
      </div>
    </Scrollable>
  );
}

export { cellText };
