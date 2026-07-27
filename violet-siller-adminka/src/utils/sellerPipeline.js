/** Siller buyurtma pipeline — sellerCountry asosida (server sellerPipelineMode bilan mos). */

const LOCAL_SELLER_COUNTRY = 'uzb';

export const LOCAL_ORDER_FILTERS = [
  'confirmation',
  'collection',
  'courier',
  'handed',
  'noAnswer',
];

export const FOREIGN_ORDER_FILTERS = [
  'confirmation',
  'collection',
  'cargo',
  'cargoHanded',
];

export function normalizeSellerCountry(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

export function isForeignSellerCountry(sellerCountry) {
  const country = normalizeSellerCountry(sellerCountry);
  return Boolean(country) && country !== LOCAL_SELLER_COUNTRY;
}

export function resolveSellerPipelineMode(sellerCountry) {
  return isForeignSellerCountry(sellerCountry) ? 'foreign' : 'local';
}

export function getSellerOrderFilters(sellerCountry) {
  return resolveSellerPipelineMode(sellerCountry) === 'foreign'
    ? FOREIGN_ORDER_FILTERS
    : LOCAL_ORDER_FILTERS;
}
