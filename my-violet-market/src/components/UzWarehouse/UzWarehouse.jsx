import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppData } from '../../contexts/AppDataContext';
import { normalizeImagePath, getLocalizedText } from '../../utils/utils';
import { SkeletonUzWarehouseBanner } from '../SkeletonLoader';
import './UzWarehouse.css';

const UZ_WAREHOUSE_PAGE_PATH = '/uzWarehousePage';
const CHINA_WAREHOUSE_PAGE_PATH = '/chinaWarehousePage';

const BANNER_CONFIG = [
  {
    dataKey: 'uzWarehouseData',
    path: UZ_WAREHOUSE_PAGE_PATH,
    ariaKey: 'uzWarehouse.bannerAria',
    altKey: 'uzWarehouse.bannerAlt',
  },
  {
    dataKey: 'chinaWarehouseData',
    path: CHINA_WAREHOUSE_PAGE_PATH,
    ariaKey: 'chinaWarehouse.bannerAria',
    altKey: 'chinaWarehouse.bannerAlt',
  },
];

const UzWarehouse = () => {
  const { i18n, t } = useTranslation();
  const { uzWarehouseData, chinaWarehouseData, loading } = useAppData();
  const langKey = (i18n.language || 'uz').split('-')[0];
  const lang = langKey === 'ru' ? 'ru' : 'uz';

  const warehouseDataByKey = useMemo(
    () => ({
      uzWarehouseData,
      chinaWarehouseData,
    }),
    [uzWarehouseData, chinaWarehouseData]
  );

  const banners = useMemo(
    () =>
      BANNER_CONFIG.map((config) => {
        const data = warehouseDataByKey[config.dataKey];
        if (!data?.src) return null;
        const imageSrc = normalizeImagePath(
          getLocalizedText(data.src, lang) || data.src?.uz
        );
        return { ...config, imageSrc };
      }).filter(Boolean),
    [warehouseDataByKey, lang]
  );

  if (loading && !uzWarehouseData) {
    return <SkeletonUzWarehouseBanner />;
  }

  if (banners.length === 0) return null;

  return (
    <section
      className="uz-warehouse-banner container"
      aria-label={t('uzWarehouse.bannersSectionAria')}
    >
      <div className="uz-warehouse-banner__row">
        {banners.map((banner) => (
          <Link
            key={banner.dataKey}
            to={banner.path}
            className="uz-warehouse-banner__link"
            aria-label={t(banner.ariaKey)}
          >
            <img
              src={banner.imageSrc}
              alt={t(banner.altKey)}
              className="uz-warehouse-banner__img"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.target.src = normalizeImagePath('/img/no-image.png');
              }}
            />
          </Link>
        ))}
      </div>
    </section>
  );
};

export default UzWarehouse;
