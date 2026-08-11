import { normalizeProductCountries } from './warehouseProduct';
import {
  isStandardOnlyCargoItem,
  isUnrestrictedCargoItem,
} from './cargoExpressPolicy';

/** Savat elementlarini countries[] bo'yicha guruhlash (china, usa, uzb, … alohida). */
export function groupCartItemsByCountry(items) {
  const groups = {};
  (items || []).forEach((item) => {
    normalizeProductCountries(item).forEach((countryKey) => {
      if (!groups[countryKey]) groups[countryKey] = [];
      groups[countryKey].push(item);
    });
  });
  return groups;
}

/**
 * Bir mamlakat ichida: cheklovsiz vs faqat-standart.
 * China va USA aralashmaydi — bu faqat bir countryKey ichida.
 */
export function partitionCountryItemsByExpressPolicy(items) {
  const list = Array.isArray(items) ? items : [];
  return {
    unrestricted: list.filter(isUnrestrictedCargoItem),
    standardOnly: list.filter(isStandardOnlyCargoItem),
  };
}

export function sumCartItemsWeightGrams(items) {
  return (items || []).reduce((sum, item) => {
    const weight = Number(item?.weight);
    const grams = Number.isFinite(weight) && weight > 0 ? weight : 300;
    const qty = Math.max(1, Number(item?.quantity) || 1);
    return sum + grams * qty;
  }, 0);
}

export function calcCargoFeeFromWeightGrams(weightGrams, ratePerKg) {
  const rate = Number(ratePerKg);
  if (!Number.isFinite(rate) || rate < 0) return 0;
  const weightInKg = (Number(weightGrams) || 0) / 1000;
  return Math.ceil(weightInKg * rate * 100) / 100;
}

/**
 * Xorij mamlakat bloki uchun narx:
 * - standard_only → har doim standard tarif
 * - unrestricted → selectedCargoOptions[countryKey] yoki standard
 */
export function calcForeignCountryCargoPrice(
  countryKey,
  items,
  selectedCargoOptions = {},
  cargoInfo,
) {
  if (!cargoInfo || countryKey === 'uzb' || !items?.length) return 0;

  const { unrestricted, standardOnly } = partitionCountryItemsByExpressPolicy(items);
  let total = 0;

  if (standardOnly.length > 0) {
    const weight = sumCartItemsWeightGrams(standardOnly);
    total += calcCargoFeeFromWeightGrams(weight, cargoInfo.standard);
  }

  if (unrestricted.length > 0) {
    const weight = sumCartItemsWeightGrams(unrestricted);
    const selectedType = selectedCargoOptions[countryKey] || 'standard';
    const rate = cargoInfo[selectedType] ?? cargoInfo.standard;
    total += calcCargoFeeFromWeightGrams(weight, rate);
  }

  return total;
}
