import {
  normalizeCountryCode,
  normalizeProductCountries,
} from './warehouseProduct';
import {
  isStandardOnlyCargoItem,
  isUnrestrictedCargoItem,
  normalizeCargoServiceType,
} from './cargoExpressPolicy';

function isLocalCartSeller(item) {
  return normalizeCountryCode(item?.sellerCountry) === 'uzb';
}

/**
 * Savat ombor kaliti.
 * UZB siller → doim uzb (countries[] Made in / noto‘g‘ri USA bo‘lsa ham).
 * Xorij siller → countries[] (checkout resolveCartCargoCountryKey bilan bir xil).
 */
export function resolveCartWarehouseCountryKeys(item) {
  if (isLocalCartSeller(item)) return ['uzb'];

  const fromProduct = normalizeProductCountries(item);
  if (fromProduct.length) return fromProduct;

  const sellerCountry = normalizeCountryCode(item?.sellerCountry);
  if (sellerCountry) return [sellerCountry];
  return [];
}

export function isExclusiveWarehouseCartItem(item, countryKey) {
  const keys = resolveCartWarehouseCountryKeys(item);
  const key = normalizeCountryCode(countryKey);
  return keys.length > 0 && keys.every((code) => code === key);
}

/**
 * Server selectedCargoOptions + item.cargoServiceType dan UI xaritasi.
 * Server xarita ustun.
 */
export function hydrateSelectedCargoOptions(items, serverMap = {}) {
  const hydrated = {};
  for (const item of Array.isArray(items) ? items : []) {
    if (isLocalCartSeller(item)) continue;
    const type = normalizeCargoServiceType(item?.cargoServiceType);
    if (!type) continue;
    for (const key of resolveCartWarehouseCountryKeys(item)) {
      if (key && key !== 'uzb' && !hydrated[key]) hydrated[key] = type;
    }
  }
  const fromServer =
    serverMap && typeof serverMap === 'object' && !Array.isArray(serverMap)
      ? serverMap
      : {};
  for (const [key, value] of Object.entries(fromServer)) {
    const country = normalizeCountryCode(key);
    const type = normalizeCargoServiceType(value);
    if (!country || country === 'uzb' || !type) continue;
    hydrated[country] = type;
  }
  return hydrated;
}

/**
 * Savat elementlarini ombor davlati bo'yicha guruhlash.
 * selectedCargoOptions shu countryKey bilan yoziladi.
 */
export function groupCartItemsByCountry(items) {
  const groups = {};
  (items || []).forEach((item) => {
    resolveCartWarehouseCountryKeys(item).forEach((countryKey) => {
      if (!groups[countryKey]) groups[countryKey] = [];
      groups[countryKey].push(item);
    });
  });
  return groups;
}

/**
 * Bir mamlakat ichida: cheklovsiz vs faqat-standart.
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
    const selectedType =
      normalizeCargoServiceType(selectedCargoOptions[countryKey]) ||
      normalizeCargoServiceType(
        unrestricted.find((item) => normalizeCargoServiceType(item?.cargoServiceType))
          ?.cargoServiceType,
      ) ||
      'standard';
    const rate = cargoInfo[selectedType] ?? cargoInfo.standard;
    total += calcCargoFeeFromWeightGrams(weight, rate);
  }

  return total;
}
