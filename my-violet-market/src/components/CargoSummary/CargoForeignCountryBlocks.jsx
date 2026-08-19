import React from 'react';
import { formatCargoPrice, getLocalizedText } from '../../utils/utils';
import {
  calcCargoFeeFromWeightGrams,
  sumCartItemsWeightGrams,
} from '../../utils/cargoGrouping';
import CargoCountryProductList from './CargoCountryProductList';

function CargoWeightLine({ t, totalWeightGrams }) {
  const weightInKg = totalWeightGrams / 1000;
  return (
    <p>
      {t('cargo.totalWeight')} {totalWeightGrams}g ({weightInKg.toFixed(2)}kg)
    </p>
  );
}

/** Cheklovsiz: Standard + Express tanlovi */
function CargoSelectableOptions({
  countryKey,
  cargoInfo,
  totalWeightGrams,
  selectedType,
  onSelect,
  t,
}) {
  const standardFee = calcCargoFeeFromWeightGrams(totalWeightGrams, cargoInfo.standard);
  const expressFee = calcCargoFeeFromWeightGrams(totalWeightGrams, cargoInfo.express);

  return (
    <div className="cargo-options">
      <label className={`cargo-option ${selectedType === 'standard' ? 'selected' : ''}`}>
        <input
          type="radio"
          name={`cargo-${countryKey}`}
          value="standard"
          checked={selectedType === 'standard'}
          onChange={() => onSelect(countryKey, 'standard')}
        />
        <span>
          {t('cargo.standard')} (${cargoInfo.standard}/kg) -{' '}
          {formatCargoPrice(standardFee)}
        </span>
      </label>
      <label className={`cargo-option ${selectedType === 'express' ? 'selected' : ''}`}>
        <input
          type="radio"
          name={`cargo-${countryKey}`}
          value="express"
          checked={selectedType === 'express'}
          onChange={() => onSelect(countryKey, 'express')}
        />
        <span>
          {t('cargo.express')} (${cargoInfo.express}/kg) -{' '}
          {formatCargoPrice(expressFee)}
        </span>
      </label>
    </div>
  );
}

/** Faqat Standard — tanlov yo'q */
function CargoStandardOnlyInfo({ cargoInfo, totalWeightGrams, t }) {
  const fee = calcCargoFeeFromWeightGrams(totalWeightGrams, cargoInfo.standard);
  return (
    <div className="cargo-standard-only">
      <p className="cargo-standard-only__note">{t('cargo.standardOnlyNote')}</p>
      <div className="cargo-standard-only__price">
        {t('cargo.standard')} (${cargoInfo.standard}/kg) — {formatCargoPrice(fee)}
      </div>
    </div>
  );
}

function ForeignCountryHeader({
  countryKey,
  cargoInfo,
  lang,
  titleSuffix,
  onOpenInfo,
}) {
  return (
    <div className="cargo-header">
      <h4>
        {getLocalizedText(cargoInfo.name, lang)}
        {titleSuffix ? (
          <span className="cargo-header__suffix"> {titleSuffix}</span>
        ) : null}
      </h4>
      <button
        type="button"
        className="cargo-info-btn"
        onClick={() => onOpenInfo(countryKey)}
      >
        <i className="bx bx-info-circle" />
      </button>
    </div>
  );
}

function UnrestrictedCountrySection({
  countryKey,
  cargoInfo,
  items,
  selectedType,
  onSelectCargo,
  onOpenInfo,
  onProductClick,
  lang,
  t,
}) {
  const totalWeight = sumCartItemsWeightGrams(items);
  return (
    <div className="cargo-country-section">
      <ForeignCountryHeader
        countryKey={countryKey}
        cargoInfo={cargoInfo}
        lang={lang}
        onOpenInfo={onOpenInfo}
      />
      <CargoWeightLine t={t} totalWeightGrams={totalWeight} />
      <CargoSelectableOptions
        countryKey={countryKey}
        cargoInfo={cargoInfo}
        totalWeightGrams={totalWeight}
        selectedType={selectedType}
        onSelect={onSelectCargo}
        t={t}
      />
      <CargoCountryProductList
        items={items}
        lang={lang}
        onProductClick={onProductClick}
      />
    </div>
  );
}

function StandardOnlyCountrySection({
  countryKey,
  cargoInfo,
  items,
  onOpenInfo,
  onProductClick,
  lang,
  t,
}) {
  const totalWeight = sumCartItemsWeightGrams(items);
  return (
    <div className="cargo-country-section cargo-country-section--standard-only">
      <ForeignCountryHeader
        countryKey={countryKey}
        cargoInfo={cargoInfo}
        lang={lang}
        titleSuffix={t('cargo.standardOnlySuffix')}
        onOpenInfo={onOpenInfo}
      />
      <CargoWeightLine t={t} totalWeightGrams={totalWeight} />
      <CargoStandardOnlyInfo
        cargoInfo={cargoInfo}
        totalWeightGrams={totalWeight}
        t={t}
      />
      <CargoCountryProductList
        items={items}
        lang={lang}
        onProductClick={onProductClick}
      />
    </div>
  );
}

/**
 * Bir xorij mamlakati uchun 0–2 ta alohida blok.
 * China va USA alohida chaqiriladi — aralashmaydi.
 */
export default function CargoForeignCountryBlocks({
  countryKey,
  cargoInfo,
  unrestrictedItems,
  standardOnlyItems,
  selectedCargoOptions,
  onSelectCargo,
  onOpenInfo,
  onProductClick,
  lang,
  t,
}) {
  const selectedType =
    selectedCargoOptions[countryKey] ||
    unrestrictedItems.find(
      (item) =>
        item?.cargoServiceType === 'express' ||
        item?.cargoServiceType === 'standard',
    )?.cargoServiceType ||
    'standard';

  return (
    <>
      {unrestrictedItems.length > 0 && (
        <UnrestrictedCountrySection
          countryKey={countryKey}
          cargoInfo={cargoInfo}
          items={unrestrictedItems}
          selectedType={selectedType}
          onSelectCargo={onSelectCargo}
          onOpenInfo={onOpenInfo}
          onProductClick={onProductClick}
          lang={lang}
          t={t}
        />
      )}
      {standardOnlyItems.length > 0 && (
        <StandardOnlyCountrySection
          countryKey={countryKey}
          cargoInfo={cargoInfo}
          items={standardOnlyItems}
          onOpenInfo={onOpenInfo}
          onProductClick={onProductClick}
          lang={lang}
          t={t}
        />
      )}
    </>
  );
}
