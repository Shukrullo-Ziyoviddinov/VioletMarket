const { ShippingCountry } = require("../../models/shippingCountry");
const { BrandCountryFilterValue } = require("../../models/brandCountryFilterValue");
const { MasterCategory } = require("../../models/masterCategory");
const { Product } = require("../../models/product");
const { listProductTypes } = require("../adminProductTypeService");
const {
  FLASH_SECTION_CATEGORY_NAMES,
  FLASH_SECTION_CATEGORY_LABELS,
} = require("../adminFlashCategory/adminFlashCategoryConstants");

async function listActiveShippingCountriesForSeller() {
  const rows = await ShippingCountry.find({ active: { $ne: false } })
    .sort({ sortOrder: 1, id: 1 })
    .select({ id: 1, code: 1, name: 1, sortOrder: 1 })
    .lean();

  return rows.map((row) => ({
    id: row.id,
    code: String(row.code || "").trim(),
    name: row.name,
    sortOrder: row.sortOrder,
  }));
}

async function listBrandCountryFilterValuesForSeller() {
  const rows = await BrandCountryFilterValue.find()
    .sort({ type: 1, id: 1 })
    .select({ type: 1, filterValue: 1 })
    .lean();

  return rows.map((row) => ({
    type: String(row.type || "").trim(),
    filterValue: String(row.filterValue || "").trim(),
  }));
}

async function listMasterCategoriesForSeller() {
  const rows = await MasterCategory.find()
    .sort({ id: 1 })
    .select({ id: 1, name: 1 })
    .lean();

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
  }));
}

function listProductSectionOptions() {
  return FLASH_SECTION_CATEGORY_NAMES.map((value) => ({
    value,
    label: FLASH_SECTION_CATEGORY_LABELS[value] || value,
  }));
}

function keepNewestProductPerId(products) {
  const seen = new Set();
  const unique = [];

  for (const product of Array.isArray(products) ? products : []) {
    const key = String(product?.id ?? "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(product);
  }

  return unique;
}

async function listSellerRelatedProductPickerOptions(sellerShopId) {
  const sellerId = String(sellerShopId || "").trim();
  if (!sellerId) return [];

  const rows = await Product.find({ sellerId })
    .select({ id: 1, title: 1, sellerId: 1 })
    .sort({ _id: -1 })
    .lean();

  return keepNewestProductPerId(rows).map((product) => ({
    id: product.id,
    title: product.title || { uz: "", ru: "" },
  }));
}

async function getSellerProductFormOptions() {
  const [shippingCountries, sectionOptions, productTypeRows, filterValues, masterCategories] =
    await Promise.all([
      listActiveShippingCountriesForSeller(),
      Promise.resolve(listProductSectionOptions()),
      listProductTypes({ activeOnly: true }),
      listBrandCountryFilterValuesForSeller(),
      listMasterCategoriesForSeller(),
    ]);

  return {
    sectionOptions,
    shippingCountries,
    productTypes: productTypeRows.map((row) => ({
      code: String(row.code || "").trim(),
      title: String(row.title || "").trim(),
      group: String(row.group || "").trim(),
    })),
    filterValues,
    masterCategories,
  };
}

module.exports = {
  getSellerProductFormOptions,
  listSellerRelatedProductPickerOptions,
};
