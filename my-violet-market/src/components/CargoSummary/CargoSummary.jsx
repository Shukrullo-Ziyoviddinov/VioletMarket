import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../contexts/CartContext';
import { useAppData } from '../../contexts/AppDataContext';
import { formatCargoPrice, getLocalizedText } from '../../utils/utils';
import { getCartItemKey } from '../../utils/cartItemProductId';
import {
  calcForeignCountryCargoPrice,
  groupCartItemsByCountry,
  isExclusiveWarehouseCartItem,
  partitionCountryItemsByExpressPolicy,
} from '../../utils/cargoGrouping';
import CargoCountryProductList from './CargoCountryProductList';
import CargoForeignCountryBlocks from './CargoForeignCountryBlocks';
import './CargoSummary.css';

function dedupeCartItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = getCartItemKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getExclusiveCountryItems(cart, countryKey, countryGroups) {
  const key = String(countryKey).toLowerCase();
  const fromCart = dedupeCartItems(
    cart.filter((item) => isExclusiveWarehouseCartItem(item, key)),
  );
  if (fromCart.length > 0) return fromCart;
  return dedupeCartItems(countryGroups[key] || []);
}

/** Thumbnail ro'yxatini weight-gruppa kalitlari bo'yicha moslashtirish. */
function alignProductsToWeightGroups(exclusiveItems, weightSourceItems) {
  const weightPartition = partitionCountryItemsByExpressPolicy(weightSourceItems);
  const unrestrictedIds = new Set(
    weightPartition.unrestricted.map((item) => getCartItemKey(item)),
  );
  const standardOnlyIds = new Set(
    weightPartition.standardOnly.map((item) => getCartItemKey(item)),
  );

  const unrestricted = exclusiveItems.filter((item) =>
    unrestrictedIds.has(getCartItemKey(item)),
  );
  const standardOnly = exclusiveItems.filter((item) =>
    standardOnlyIds.has(getCartItemKey(item)),
  );

  return {
    unrestricted: unrestricted.length ? unrestricted : weightPartition.unrestricted,
    standardOnly: standardOnly.length ? standardOnly : weightPartition.standardOnly,
  };
}

const CargoSummary = ({ onCargoProductClick }) => {
  const { t, i18n } = useTranslation();
  const { cargoRates: rawCargoRates } = useAppData();
  const cargoRates = rawCargoRates || {};
  const lang = i18n.language || 'uz';
  const { cart, selectedCargoOptions, updateCargoSelection } = useCart();
  const [showInfoModal, setShowInfoModal] = useState(null);

  const countryGroups = useMemo(() => groupCartItemsByCountry(cart), [cart]);

  const exclusiveItemsByCountry = useMemo(() => {
    const map = {};
    Object.keys(countryGroups).forEach((countryKey) => {
      map[countryKey] = getExclusiveCountryItems(cart, countryKey, countryGroups);
    });
    return map;
  }, [cart, countryGroups]);

  const totalCargoPrice = useMemo(() => {
    let total = 0;
    Object.keys(countryGroups).forEach((countryKey) => {
      const cargoInfo = cargoRates[countryKey];
      if (!cargoInfo || countryKey === 'uzb') return;
      const items = dedupeCartItems(countryGroups[countryKey]);
      total += calcForeignCountryCargoPrice(
        countryKey,
        items,
        selectedCargoOptions,
        cargoInfo,
      );
    });
    return total;
  }, [countryGroups, cargoRates, selectedCargoOptions]);

  if (Object.keys(countryGroups).length === 0) {
    return null;
  }

  return (
    <>
      <div className="cargo-summary">
        <h3>{t('cargo.title')}</h3>

        {Object.keys(countryGroups).map((countryKey) => {
          const cargoInfo = cargoRates[countryKey];
          if (!cargoInfo) return null;

          const items = dedupeCartItems(countryGroups[countryKey]);
          const countryProductItems = exclusiveItemsByCountry[countryKey] || [];

          if (countryKey === 'uzb') {
            return (
              <div key="uzb-section" className="cargo-country-section">
                <h4>{t('cargo.warehouseUzb')}</h4>
                <p>{getLocalizedText(cargoInfo.infoCargo, lang)}</p>
                <CargoCountryProductList
                  items={countryProductItems}
                  lang={lang}
                  onProductClick={onCargoProductClick}
                />
              </div>
            );
          }

          const { unrestricted, standardOnly } = alignProductsToWeightGroups(
            countryProductItems,
            items,
          );

          return (
            <CargoForeignCountryBlocks
              key={countryKey}
              countryKey={countryKey}
              cargoInfo={cargoInfo}
              unrestrictedItems={unrestricted}
              standardOnlyItems={standardOnly}
              selectedCargoOptions={selectedCargoOptions}
              onSelectCargo={updateCargoSelection}
              onOpenInfo={setShowInfoModal}
              onProductClick={onCargoProductClick}
              lang={lang}
              t={t}
            />
          );
        })}

        {totalCargoPrice > 0 && (
          <div className="total-cargo-price">
            <strong>
              {t('cargo.totalCargoPrice')} {formatCargoPrice(totalCargoPrice)}
            </strong>
            <p className="cargo-summary__fee-later">{t('cargo.feeLaterNote')}</p>
          </div>
        )}
      </div>

      {showInfoModal && (
        <div className="cargo-modal-overlay" onClick={() => setShowInfoModal(null)}>
          <div className="cargo-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="cargo-modal-close"
              onClick={() => setShowInfoModal(null)}
            >
              <i className="bx bx-x" />
            </button>
            {cargoRates[showInfoModal] && (
              <>
                <h3>
                  {getLocalizedText(cargoRates[showInfoModal].name, lang)}{' '}
                  {t('cargo.aboutInfo')}
                </h3>
                <p>{getLocalizedText(cargoRates[showInfoModal].infoCargo, lang)}</p>
                {showInfoModal !== 'uzb' && (
                  <div className="cargo-rates">
                    <div>
                      {t('cargo.standard')}: ${cargoRates[showInfoModal].standard}/kg
                    </div>
                    <div>
                      {t('cargo.express')}: ${cargoRates[showInfoModal].express}/kg
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CargoSummary;
