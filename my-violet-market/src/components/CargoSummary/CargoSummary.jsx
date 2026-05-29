import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../contexts/CartContext';
import { useAppData } from '../../contexts/AppDataContext';
import { formatCargoPrice, getLocalizedText, normalizeImagePath } from '../../utils/utils';
import { getCartItemKey } from '../../utils/cartItemProductId';
import {
  isExclusiveCountryProduct,
  normalizeProductCountries,
} from '../../utils/warehouseProduct';
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
    cart.filter((item) => isExclusiveCountryProduct(item, key)),
  );
  if (fromCart.length > 0) return fromCart;

  return dedupeCartItems(countryGroups[key] || []).filter((item) =>
    normalizeProductCountries(item).includes(key),
  );
}

function getItemWeightGrams(item) {
  const raw = item?.weight;
  if (raw == null || raw === '') return null;
  const grams = Number(raw);
  if (!Number.isFinite(grams) || grams <= 0) return null;
  return Math.round(grams);
}

const CargoCountryProductList = ({ items, lang, onProductClick }) => {
  if (!items.length) return null;

  return (
    <div className="cargo-country-products">
      {items.map((item, index) => {
        const title = getLocalizedText(item.title, lang);
        const weightGrams = getItemWeightGrams(item);
        return (
          <button
            key={getCartItemKey(item) || index}
            type="button"
            className="cargo-country-product"
            onClick={() => onProductClick?.(item)}
          >
            <img
              src={normalizeImagePath(item.image || '/img/no-image.png')}
              alt={title}
              className="cargo-country-product__img"
            />
            <div className="cargo-country-product__info">
              <span className="cargo-country-product__title">{title}</span>
              {weightGrams != null && (
                <span className="cargo-country-product__weight">{weightGrams}g</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

const CargoSummary = ({ onCargoProductClick }) => {
  const { i18n } = useTranslation();
  const { cargoRates: rawCargoRates } = useAppData();
  const cargoRates = rawCargoRates || {};
  const lang = i18n.language || 'uz';
  const { cart, selectedCargoOptions, updateCargoSelection } = useCart();
  const [showInfoModal, setShowInfoModal] = useState(null);

  const countryGroups = useMemo(() => {
    const groups = {};
    cart.forEach((item) => {
      normalizeProductCountries(item).forEach((countryKey) => {
        if (!groups[countryKey]) groups[countryKey] = [];
        groups[countryKey].push(item);
      });
    });
    return groups;
  }, [cart]);

  const exclusiveItemsByCountry = useMemo(() => {
    const map = {};
    Object.keys(countryGroups).forEach((countryKey) => {
      map[countryKey] = getExclusiveCountryItems(cart, countryKey, countryGroups);
    });
    return map;
  }, [cart, countryGroups]);

  if (Object.keys(countryGroups).length === 0) {
    return null;
  }

  let totalCargoPrice = 0;
  const cargoSections = [];

  Object.keys(countryGroups).forEach((countryKey) => {
    const cargoInfo = cargoRates[countryKey];
    if (!cargoInfo) return;

    const items = dedupeCartItems(countryGroups[countryKey]);
    const countryProductItems = exclusiveItemsByCountry[countryKey] || [];

    if (countryKey === 'uzb') {
      cargoSections.push(
        <div key="uzb-section" className="cargo-country-section">
          <h4>{i18n.t('cargo.warehouseUzb')}</h4>
          <p>{getLocalizedText(cargoInfo.infoCargo, lang)}</p>
          <CargoCountryProductList
            items={countryProductItems}
            lang={lang}
            onProductClick={onCargoProductClick}
          />
        </div>,
      );

      return;
    }

    const totalWeight = items.reduce((sum, item) => {
      return sum + ((item.weight || 300) * (item.quantity || 1));
    }, 0);
    const weightInKg = totalWeight / 1000;

    const selectedType = selectedCargoOptions[countryKey] || 'standard';
    const rate = cargoInfo[selectedType];
    const cargoPrice = Math.ceil(weightInKg * rate * 100) / 100;
    totalCargoPrice += cargoPrice;

    cargoSections.push(
      <div key={countryKey} className="cargo-country-section">
        <div className="cargo-header">
          <h4>{getLocalizedText(cargoInfo.name, lang)}</h4>
          <button
            type="button"
            className="cargo-info-btn"
            onClick={() => setShowInfoModal(countryKey)}
          >
            <i className="bx bx-info-circle" />
          </button>
        </div>
        <p>
          {i18n.t('cargo.totalWeight')}: {totalWeight}g ({weightInKg.toFixed(2)}kg)
        </p>
        <div className="cargo-options">
          <label className={`cargo-option ${selectedType === 'standard' ? 'selected' : ''}`}>
            <input
              type="radio"
              name={`cargo-${countryKey}`}
              value="standard"
              checked={selectedType === 'standard'}
              onChange={() => updateCargoSelection(countryKey, 'standard')}
            />
            <span>
              {i18n.t('cargo.standard')} (${cargoInfo.standard}/kg) -{' '}
              {formatCargoPrice(weightInKg * cargoInfo.standard)}
            </span>
          </label>
          <label className={`cargo-option ${selectedType === 'express' ? 'selected' : ''}`}>
            <input
              type="radio"
              name={`cargo-${countryKey}`}
              value="express"
              checked={selectedType === 'express'}
              onChange={() => updateCargoSelection(countryKey, 'express')}
            />
            <span>
              {i18n.t('cargo.express')} (${cargoInfo.express}/kg) -{' '}
              {formatCargoPrice(weightInKg * cargoInfo.express)}
            </span>
          </label>
        </div>
        <CargoCountryProductList
          items={countryProductItems}
          lang={lang}
          onProductClick={onCargoProductClick}
        />
      </div>,
    );
  });

  return (
    <>
      <div className="cargo-summary">
        <h3>{i18n.t('cargo.title')}</h3>
        {cargoSections}
        {totalCargoPrice > 0 && (
          <div className="total-cargo-price">
            <strong>
              {i18n.t('cargo.totalCargoPrice')} {formatCargoPrice(totalCargoPrice)}
            </strong>
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
                  {i18n.t('cargo.aboutInfo')}
                </h3>
                <p>{getLocalizedText(cargoRates[showInfoModal].infoCargo, lang)}</p>
                {showInfoModal !== 'uzb' && (
                  <div className="cargo-rates">
                    <div>
                      {i18n.t('cargo.standard')}: ${cargoRates[showInfoModal].standard}/kg
                    </div>
                    <div>
                      {i18n.t('cargo.express')}: ${cargoRates[showInfoModal].express}/kg
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
