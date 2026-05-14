import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppData } from '../../contexts/AppDataContext';
import { normalizeImagePath, getLocalizedText } from '../../utils/utils';
import { SkeletonUzWarehouseBanner } from '../SkeletonLoader';
import './UzWarehouse.css';

const UZ_WAREHOUSE_PAGE_PATH = '/uzWarehousePage';

const UzWarehouse = () => {
  const { i18n, t } = useTranslation();
  const { uzWarehouseData, loading } = useAppData();
  const langKey = (i18n.language || 'uz').split('-')[0];
  const lang = langKey === 'ru' ? 'ru' : 'uz';

  const imageSrc = useMemo(
    () =>
      uzWarehouseData
        ? normalizeImagePath(getLocalizedText(uzWarehouseData.src, lang) || uzWarehouseData.src?.uz)
        : '',
    [lang, uzWarehouseData]
  );

  if (loading && !uzWarehouseData) {
    return <SkeletonUzWarehouseBanner />;
  }

  if (!uzWarehouseData?.src) return null;

  return (
    <section
      className="uz-warehouse-banner container"
      aria-label={t('uzWarehouse.bannerAria')}
    >
      <Link to={UZ_WAREHOUSE_PAGE_PATH} className="uz-warehouse-banner__link">
        <img
          src={imageSrc}
          alt={t('uzWarehouse.bannerAlt')}
          className="uz-warehouse-banner__img"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.target.src = normalizeImagePath('/img/no-image.png');
          }}
        />
      </Link>
    </section>
  );
};

export default UzWarehouse;
