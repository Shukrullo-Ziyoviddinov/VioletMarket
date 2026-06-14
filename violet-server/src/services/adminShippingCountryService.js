const { CargoRegionRate, ShippingCountry } = require("../models");
const { HttpError } = require("../utils/httpError");

function clean(value) {
  return String(value || "").trim();
}

function toSortOrder(value, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    throw new HttpError(400, "sortOrder noto'g'ri", "VALIDATION_ERROR");
  }
  return Math.floor(n);
}

function normalizeCode(value) {
  const code = clean(value).toLowerCase();
  if (!code) {
    throw new HttpError(400, "code to'ldirilishi shart", "VALIDATION_ERROR");
  }
  if (!/^[a-z0-9_-]+$/.test(code)) {
    throw new HttpError(
      400,
      "code faqat kichik lotin harflari, raqam, _ yoki - bo'lishi mumkin",
      "VALIDATION_ERROR"
    );
  }
  return code;
}

function normalizeName(name) {
  const uz = clean(name?.uz);
  const ru = clean(name?.ru);
  if (!uz || !ru) {
    throw new HttpError(400, "name.uz va name.ru to'ldirilishi shart", "VALIDATION_ERROR");
  }
  return { uz, ru };
}

function normalizeActive(value, fallback = true) {
  if (value === undefined) return Boolean(fallback);
  return Boolean(value);
}

function stripMongoMeta(doc) {
  if (!doc || typeof doc !== "object") return doc;
  const plain = typeof doc.toObject === "function" ? doc.toObject() : doc;
  const { _id, __v, createdAt, updatedAt, ...rest } = plain;
  return rest;
}

async function getNextSortOrder() {
  const last = await ShippingCountry.findOne().sort({ sortOrder: -1, id: -1 }).lean();
  return Number.isFinite(last?.sortOrder) ? Number(last.sortOrder) + 1 : 0;
}

async function getByIdOrThrow(shippingCountryId) {
  const id = Number(shippingCountryId);
  if (!Number.isFinite(id) || id <= 0) {
    throw new HttpError(400, "shippingCountryId noto'g'ri", "VALIDATION_ERROR");
  }
  const row = await ShippingCountry.findOne({ id: Math.floor(id) });
  if (!row) {
    throw new HttpError(404, "Shipping country topilmadi", "NOT_FOUND");
  }
  return row;
}

async function listShippingCountries() {
  const rows = await ShippingCountry.find().sort({ sortOrder: 1, id: 1 }).lean();
  return rows.map(stripMongoMeta);
}

async function createShippingCountry(payload) {
  const code = normalizeCode(payload?.code);
  const duplicate = await ShippingCountry.findOne({ code }).lean();
  if (duplicate) {
    throw new HttpError(409, "Bunday code allaqachon mavjud", "CONFLICT");
  }

  const defaultSortOrder = await getNextSortOrder();
  const row = new ShippingCountry({
    code,
    name: normalizeName(payload?.name),
    sortOrder: toSortOrder(payload?.sortOrder, defaultSortOrder),
    active: normalizeActive(payload?.active, true),
  });
  await row.save();
  return stripMongoMeta(row);
}

async function updateShippingCountry(shippingCountryId, payload) {
  const row = await getByIdOrThrow(shippingCountryId);
  const nextCode = payload?.code !== undefined ? normalizeCode(payload.code) : row.code;

  if (nextCode !== row.code) {
    const duplicate = await ShippingCountry.findOne({ code: nextCode }).lean();
    if (duplicate) {
      throw new HttpError(409, "Bunday code allaqachon mavjud", "CONFLICT");
    }
  }

  row.code = nextCode;
  if (payload?.name !== undefined) {
    row.name = normalizeName(payload.name);
  }
  if (payload?.sortOrder !== undefined) {
    row.sortOrder = toSortOrder(payload.sortOrder, row.sortOrder);
  }
  if (payload?.active !== undefined) {
    row.active = normalizeActive(payload.active, row.active);
  }
  await row.save();
  return stripMongoMeta(row);
}

async function deleteShippingCountry(shippingCountryId) {
  const row = await getByIdOrThrow(shippingCountryId);
  const inCargoUse = await CargoRegionRate.countDocuments({ key: row.code });
  if (inCargoUse > 0) {
    throw new HttpError(
      409,
      "Bu hudud kodi logistika ma'lumotlarida ishlatilgan. Avval kargodan olib tashlang.",
      "CONFLICT"
    );
  }
  await ShippingCountry.deleteOne({ id: row.id });
}

module.exports = {
  listShippingCountries,
  createShippingCountry,
  updateShippingCountry,
  deleteShippingCountry,
};
