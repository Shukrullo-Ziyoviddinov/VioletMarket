const { HttpError } = require("./httpError");

function normalizeShopId(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function assertValidShopId(shopId) {
  const normalized = normalizeShopId(shopId);
  if (!normalized || normalized.length < 2) {
    throw new HttpError(400, "Do'kon ID kamida 2 ta belgidan iborat bo'lishi kerak", "INVALID_SHOP_ID");
  }
  if (normalized.length > 48) {
    throw new HttpError(400, "Do'kon ID juda uzun", "INVALID_SHOP_ID");
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    throw new HttpError(
      400,
      "Do'kon ID faqat lotin harflari, raqamlar va tire bo'lishi kerak",
      "INVALID_SHOP_ID"
    );
  }
  return normalized;
}

module.exports = { normalizeShopId, assertValidShopId };
