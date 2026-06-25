const { ShippingCountry } = require("../models/shippingCountry");
const { HttpError } = require("./httpError");

function normalizeSellerCountry(value) {
  return String(value || "").trim().toLowerCase();
}

async function listSellerCountryOptions() {
  return ShippingCountry.find({ active: { $ne: false } })
    .sort({ sortOrder: 1, id: 1 })
    .select({ id: 1, code: 1, name: 1, sortOrder: 1 })
    .lean();
}

async function assertValidSellerCountry(codeRaw) {
  const code = normalizeSellerCountry(codeRaw);
  if (!code) {
    throw new HttpError(400, "Sotuvchi davlati tanlanishi shart", "SELLER_COUNTRY_REQUIRED");
  }

  const row = await ShippingCountry.findOne({
    code,
    active: { $ne: false },
  })
    .select({ code: 1 })
    .lean();

  if (!row) {
    throw new HttpError(400, "Sotuvchi davlati topilmadi", "SELLER_COUNTRY_INVALID");
  }

  return code;
}

module.exports = {
  normalizeSellerCountry,
  listSellerCountryOptions,
  assertValidSellerCountry,
};
