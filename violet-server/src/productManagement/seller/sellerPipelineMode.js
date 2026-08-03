/**
 * Siller buyurtma pipeline rejimi.
 * Ro‘yxatdagi sellerCountry (uzb vs china/usa/korea/…) asosida.
 *
 * local  → UZB kuryer zanjiri (mavjud)
 * foreign → cargo / logistica zanjiri (yangi)
 */

const LOCAL_SELLER_COUNTRY = "uzb";

function normalizeSellerCountry(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isLocalSellerCountry(sellerCountry) {
  return normalizeSellerCountry(sellerCountry) === LOCAL_SELLER_COUNTRY;
}

function isForeignSellerCountry(sellerCountry) {
  const country = normalizeSellerCountry(sellerCountry);
  return Boolean(country) && country !== LOCAL_SELLER_COUNTRY;
}

/**
 * @returns {'local' | 'foreign'}
 * Noma’lum / bo‘sh → local (mavjud UZB oqimi saqlansin)
 */
function resolveSellerPipelineMode(sellerCountry) {
  return isForeignSellerCountry(sellerCountry) ? "foreign" : "local";
}

module.exports = {
  LOCAL_SELLER_COUNTRY,
  normalizeSellerCountry,
  isLocalSellerCountry,
  isForeignSellerCountry,
  resolveSellerPipelineMode,
};
