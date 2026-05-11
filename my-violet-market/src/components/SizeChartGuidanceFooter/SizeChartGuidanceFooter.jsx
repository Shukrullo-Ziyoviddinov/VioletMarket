import React from 'react';
import { useTranslation } from 'react-i18next';
import Scrollable from '../Scrollable';
import './SizeChartGuidanceFooter.css';

/**
 * Barcha o'lcham jadvallari uchun umumiy kursatma: chap — qanday o'lchanadi, o'ng — eslatma.
 * Scrollable: tor ekranda gorizontal surish.
 */
export default function SizeChartGuidanceFooter() {
  const { t } = useTranslation();

  return (
    <div className="size-chart-section size-chart-section--guidance">
      <Scrollable
        type="product"
        className="size-chart-guidance-scroll"
        skipInteractiveTouchHandling
      >
        <article className="size-chart-guidance-card">
          <div className="size-chart-guidance-card__icon" aria-hidden>
            <i className="bx bx-ruler" />
          </div>
          <div className="size-chart-guidance-card__body">
            <h4 className="size-chart-guidance-card__title">
              {t('productDetail.sizeChartGuidance.measureTitle')}
            </h4>
            <p className="size-chart-guidance-card__text">
              {t('productDetail.sizeChartGuidance.measureText')}
            </p>
          </div>
        </article>
        <article className="size-chart-guidance-card">
          <div className="size-chart-guidance-card__icon" aria-hidden>
            <i className="bx bx-info-circle" />
          </div>
          <div className="size-chart-guidance-card__body">
            <h4 className="size-chart-guidance-card__title">
              {t('productDetail.sizeChartGuidance.noteTitle')}
            </h4>
            <p className="size-chart-guidance-card__text">
              {t('productDetail.sizeChartGuidance.noteText')}
            </p>
          </div>
        </article>
      </Scrollable>
    </div>
  );
}
