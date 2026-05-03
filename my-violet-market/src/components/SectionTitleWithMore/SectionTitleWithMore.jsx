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
 */
const SectionTitleWithMore = ({
  title,
  moreLink,
  showMore = true,
  moreLabel,
  className = '',
  titleExtra,
}) => {
  const { t } = useTranslation();
  const label = moreLabel != null ? (moreLabel.includes('.') ? t(moreLabel) : moreLabel) : t('common.more');

  return (
    <div className={`section-title-with-more ${className}`.trim()}>
      <div className="section-title-with-more__title-wrap">
        <h2 className="section-title-with-more__title">{title}</h2>
        {titleExtra && <span className="section-title-with-more__title-extra">{titleExtra}</span>}
      </div>
      {showMore && moreLink && (
        <Link to={moreLink} className="section-title-with-more__btn">
          {label}
        </Link>
      )}
    </div>
  );
};

export default SectionTitleWithMore;
