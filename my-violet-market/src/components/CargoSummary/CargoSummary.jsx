import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../contexts/CartContext';
import { useAppData } from '../../contexts/AppDataContext';
import { formatCargoPrice, getLocalizedText } from '../../utils/utils';
import './CargoSummary.css';

const CargoSummary = () => {
  const { i18n } = useTranslation();
  const { cargoRates: rawCargoRates } = useAppData();
  const cargoRates = rawCargoRates || {};
  const lang = i18n.language || 'uz';
  const { cart, selectedCargoOptions, updateCargoSelection } = useCart();
  const [showInfoModal, setShowInfoModal] = useState(null);

  // Davlatlar bo'yicha guruhlash
  const countryGroups = {};
  cart.forEach(item => {
    if (item.countries && item.countries.length > 0) {
      item.countries.forEach(country => {
        const countryKey = country.toLowerCase();
        if (!countryGroups[countryKey]) {
          countryGroups[countryKey] = [];
        }
        countryGroups[countryKey].push(item);
      });
    }
  });

  if (Object.keys(countryGroups).length === 0) {
    return null;
  }

  let totalCargoPrice = 0;
  const cargoSections = [];

  Object.keys(countryGroups).forEach(countryKey => {
    const cargoInfo = cargoRates[countryKey];
    if (!cargoInfo) return;

    const items = countryGroups[countryKey];

    // UZB uchun maxsus
    if (countryKey === 'uzb') {
      cargoSections.push(
        <div key={countryKey} className="cargo-country-section">
          <h4>{i18n.t('cargo.warehouseUzb')}</h4>
          <p>{getLocalizedText(cargoInfo.infoCargo, lang)}</p>
        </div>
      );
    } else {
      // Vaznni hisoblash
      const totalWeight = items.reduce((sum, item) => {
        return sum + ((item.weight || 300) * (item.quantity || 1));
      }, 0);
      const weightInKg = totalWeight / 1000; // gram -> kg

      // Tanlangan kargo turi
      const selectedType = selectedCargoOptions[countryKey] || 'standard';
      const rate = cargoInfo[selectedType];

      // Kargo narxi
      const cargoPrice = Math.ceil(weightInKg * rate * 100) / 100;
      totalCargoPrice += cargoPrice;

      cargoSections.push(
        <div key={countryKey} className="cargo-country-section">
          <div className="cargo-header">
            <h4>{getLocalizedText(cargoInfo.name, lang)}</h4>
            <button 
              className="cargo-info-btn"
              onClick={() => setShowInfoModal(countryKey)}
            >
              <i className="bx bx-info-circle"></i>
            </button>
          </div>
          <p>{i18n.t('cargo.totalWeight')}: {totalWeight}g ({weightInKg.toFixed(2)}kg)</p>
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
                {i18n.t('cargo.standard')} (${cargoInfo.standard}/kg) - {formatCargoPrice(weightInKg * cargoInfo.standard)}
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
                {i18n.t('cargo.express')} (${cargoInfo.express}/kg) - {formatCargoPrice(weightInKg * cargoInfo.express)}
              </span>
            </label>
          </div>
        </div>
      );
    }
  });

  return (
    <>
      <div className="cargo-summary">
        <h3>{i18n.t('cargo.title')}</h3>
        {cargoSections}
        {totalCargoPrice > 0 && (
          <div className="total-cargo-price">
            <strong>{i18n.t('cargo.totalCargoPrice')} {formatCargoPrice(totalCargoPrice)}</strong>
          </div>
        )}
      </div>

      {showInfoModal && (
        <div className="cargo-modal-overlay" onClick={() => setShowInfoModal(null)}>
          <div className="cargo-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="cargo-modal-close" onClick={() => setShowInfoModal(null)}>
              <i className="bx bx-x"></i>
            </button>
            {cargoRates[showInfoModal] && (
              <>
                <h3>{getLocalizedText(cargoRates[showInfoModal].name, lang)} {i18n.t('cargo.aboutInfo')}</h3>
                <p>{getLocalizedText(cargoRates[showInfoModal].infoCargo, lang)}</p>
                {showInfoModal !== 'uzb' && (
                  <div className="cargo-rates">
                    <div>{i18n.t('cargo.standard')}: ${cargoRates[showInfoModal].standard}/kg</div>
                    <div>{i18n.t('cargo.express')}: ${cargoRates[showInfoModal].express}/kg</div>
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
