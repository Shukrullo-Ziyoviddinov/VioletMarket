import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { normalizeImagePath } from '../utils/utils';
import SizeChartSvgPicker, { cellText } from './SizeChartSvgPicker';
import './SizeChartSvgCommon.css';

/**
 * Tayyor sxema rasmi + o'lcham tanlovi; qiymatlar rasm ustiga (foizli joylashuv).
 * variant: upper_body | pants | footwear — CSS bilan pozitsiya.
 */
export default function SizeChartPhotoDiagram({
  imageSrc,
  columns,
  rows,
  lang,
  titleI18nKey,
  variant = 'upper_body',
}) {
  const { t } = useTranslation();
  const [rowIdx, setRowIdx] = useState(0);

  useEffect(() => {
    setRowIdx(0);
  }, [rows, columns]);

  if (!imageSrc || !Array.isArray(columns) || !Array.isArray(rows) || rows.length === 0) {
    return null;
  }
  if (columns.length < 2) return null;

  const safeIdx = Math.min(Math.max(0, rowIdx), rows.length - 1);
  const row = rows[safeIdx];
  if (!Array.isArray(row) || row.length < 2) return null;

  const src = normalizeImagePath(imageSrc);
  const alt = titleI18nKey ? t(titleI18nKey) : t('productDetail.sizeChartDiagramHint');

  const measureCols = columns.slice(1);
  const readoutLabel = t('productDetail.sizeChartDiagramHint');

  return (
    <div className="size-chart-svg-diagram size-chart-photo-diagram">
      <SizeChartSvgPicker
        rows={rows}
        lang={lang}
        selectedIdx={safeIdx}
        onSelect={setRowIdx}
        ariaLabel={t('productDetail.sizeChartPickSize')}
      />

      <div
        className={`size-chart-svg-diagram__wrap size-chart-photo-diagram__wrap size-chart-photo-diagram__wrap--${variant}`}
      >
        <img
          src={src}
          alt={alt}
          className="size-chart-photo-diagram__img"
          onError={(e) => {
            e.target.src = normalizeImagePath('/img/no-image.png');
          }}
        />
        <ul className="size-chart-photo-diagram__overlay" aria-label={readoutLabel}>
          {measureCols.map((col, j) => {
            const idx = j + 1;
            const posClass =
              j < 3
                ? `size-chart-photo-diagram__bubble--${variant}-${j}`
                : 'size-chart-photo-diagram__bubble--extra';
            return (
              <li key={idx} className={`size-chart-photo-diagram__bubble ${posClass}`}>
                <span className="size-chart-photo-diagram__bubble-label">
                  {cellText(col, lang)}
                </span>
                <span className="size-chart-photo-diagram__bubble-value">
                  {cellText(row[idx], lang)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
