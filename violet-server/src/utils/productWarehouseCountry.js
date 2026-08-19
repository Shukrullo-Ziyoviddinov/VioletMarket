/**
 * Mahsulot ombori (countries[]) = siller sellerCountry.
 * Made in (productCountry / countriesCategories) alohida qoladi.
 */

const { ShippingCountry } = require("../models/shippingCountry");
const { SellerAccount } = require("../models/sellerAccount");
const { HttpError } = require("./httpError");
const { normalizeCargoCountry } = require("./cargoCountryNormalize");

async function listActiveShippingCountryRows() {
  return ShippingCountry.find({ active: { $ne: false } })
    .sort({ sortOrder: 1, id: 1 })
    .lean();
}

function matchShippingCountryRow(sellerCountry, shippingRows) {
  const canonical = normalizeCargoCountry(sellerCountry);
  if (!canonical) return null;
  const rows = Array.isArray(shippingRows) ? shippingRows : [];
  return (
    rows.find((row) => normalizeCargoCountry(row?.code) === canonical) || null
  );
}

async function resolveWarehouseCountriesFromSellerCountry(sellerCountry) {
  const canonical = normalizeCargoCountry(sellerCountry);
  if (!canonical) {
    throw new HttpError(
      400,
      "Sotuvchi davlati topilmadi — ombor belgilab bo'lmadi",
      "SELLER_COUNTRY_REQUIRED",
    );
  }

  const shippingRows = await listActiveShippingCountryRows();
  const row = matchShippingCountryRow(canonical, shippingRows);
  if (!row) {
    throw new HttpError(
      400,
      `Sotuvchi davlati uchun ombor topilmadi: ${canonical}`,
      "WAREHOUSE_COUNTRY_NOT_FOUND",
    );
  }

  return [String(row.code)];
}

async function resolveWarehouseCountriesFromSellerId(sellerIdRaw) {
  const sellerId = String(sellerIdRaw || "").trim();
  if (!sellerId) return null;

  const seller = await SellerAccount.findOne({ id: sellerId })
    .select({ id: 1, sellerCountry: 1 })
    .lean();
  if (!seller) return null;

  return resolveWarehouseCountriesFromSellerCountry(seller.sellerCountry);
}

module.exports = {
  resolveWarehouseCountriesFromSellerCountry,
  resolveWarehouseCountriesFromSellerId,
};
