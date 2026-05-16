import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './SectionTitleWithMore.css';

/**
 * Sarlavha va "Ko'proq" tugmasi bir qatorda (sarlavha chapda, tugma o'ngda).
 * Boshqa bo'limlar uchun ham ishlatish mumkin (global komponent).
 * @param {string} title - Bo'lim sarlavhasi
 * @param {string} moreLink - "Ko'proq" bosilganda ochiladigan sahifa yo'li
 * @param {boolean} showMore - true bo'lsa "Ko'proq" tugmasi ko'rinadi
 * @param {string} [moreLabel] - Tugma matni (i18n key yoki matn); bo'sh bo'lsa common.more ishlatiladi
 * @param {string} [className] - Qo'shimcha CSS class
 * @param {React.ReactNode} [titleExtra] - Sarlavha yonida ko'rsatiladigan qo'shimcha (masalan soat ikonkasi)
 * @param {string} [subtitle] - Sarlavha ostidagi qo'shimcha matn
 * @param {React.ReactNode} [leadingIcon] - Sarlavha oldidagi ikonka
 */
const SectionTitleWithMore = ({
  title,
  moreLink,
  showMore = true,
  moreLabel,
  className = '',
  titleExtra,
  subtitle,
  leadingIcon,
}) => {
  const { t } = useTranslation();
  const rawLabel =
    moreLabel != null ? (moreLabel.includes('.') ? t(moreLabel) : moreLabel) : t('common.more');
  const label =
    typeof rawLabel === 'string' ? rawLabel.replace(/\s*>\s*$/, '').trim() : rawLabel;

  return (
    <div className={`section-title-with-more ${className}`.trim()}>
      <div className="section-title-with-more__title-wrap">
        {leadingIcon != null && (
          <span className="section-title-with-more__leading-icon" aria-hidden>
            {leadingIcon}
          </span>
        )}
        <div className="section-title-with-more__title-block">
          <h2 className="section-title-with-more__title">{title}</h2>
          {subtitle != null && subtitle !== '' && (
            <p className="section-title-with-more__subtitle">{subtitle}</p>
          )}
        </div>
        {titleExtra && <span className="section-title-with-more__title-extra">{titleExtra}</span>}
      </div>
      {showMore && moreLink && (
        <Link to={moreLink} className="section-title-with-more__btn">
          <span className="section-title-with-more__btn-text">{label}</span>
          <i className="bx bx-chevron-right section-title-with-more__btn-icon" aria-hidden />
        </Link>
      )}
    </div>
  );
};

export default SectionTitleWithMore;
