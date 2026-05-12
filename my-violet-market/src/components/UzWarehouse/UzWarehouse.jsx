import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { uzWarehouseData } from '../../data/uzWarehouseData';
import { normalizeImagePath, getLocalizedText } from '../../utils/utils';
import './UzWarehouse.css';

const UZ_WAREHOUSE_PAGE_PATH = '/uzWarehousePage';

const UzWarehouse = () => {
  const { i18n, t } = useTranslation();
  const langKey = (i18n.language || 'uz').split('-')[0];
  const lang = langKey === 'ru' ? 'ru' : 'uz';

  const imageSrc = useMemo(
    () => normalizeImagePath(getLocalizedText(uzWarehouseData.src, lang) || uzWarehouseData.src?.uz),
    [lang]
  );

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
