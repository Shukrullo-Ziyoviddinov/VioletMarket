const { ShippingCountry } = require("../../models/shippingCountry");
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

function listProductSectionOptions() {
  return FLASH_SECTION_CATEGORY_NAMES.map((value) => ({
    value,
    label: FLASH_SECTION_CATEGORY_LABELS[value] || value,
  }));
}

async function getSellerProductFormOptions() {
  const [shippingCountries, sectionOptions] = await Promise.all([
    listActiveShippingCountriesForSeller(),
    Promise.resolve(listProductSectionOptions()),
  ]);

  return {
    sectionOptions,
    shippingCountries,
  };
}

module.exports = {
  getSellerProductFormOptions,
};
