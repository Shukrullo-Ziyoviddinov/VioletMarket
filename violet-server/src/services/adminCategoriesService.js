const { BrandCategory, CountryCategory } = require("../models");
const { HttpError } = require("../utils/httpError");

function toInt(value, label) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw new HttpError(400, `${label} noto'g'ri`, "VALIDATION_ERROR");
  }
  return Math.floor(n);
}

function clean(value) {
  return String(value || "").trim();
}

function normalizeCountryPayload(raw) {
  if (!raw || typeof raw !== "object") {
    throw new HttpError(400, "Country payload noto'g'ri", "VALIDATION_ERROR");
  }
  const uz = clean(raw?.name?.uz);
  const ru = clean(raw?.name?.ru);
  const image = clean(raw?.image);
  const flag = clean(raw?.flag);
  const link = clean(raw?.link);
  const filterValue = clean(raw?.filterValue);

  if (!uz || !ru) {
    throw new HttpError(400, "name.uz va name.ru to'ldirilishi shart", "VALIDATION_ERROR");
  }
  if (!image) {
    throw new HttpError(400, "image to'ldirilishi shart", "VALIDATION_ERROR");
  }
  if (!link) {
    throw new HttpError(400, "link to'ldirilishi shart", "VALIDATION_ERROR");
  }
  if (!filterValue) {
    throw new HttpError(400, "filterValue to'ldirilishi shart", "VALIDATION_ERROR");
  }

  return {
    name: { uz, ru },
    image,
    flag,
    link,
    filterValue,
  };
}

function normalizeBrandPayload(raw) {
  if (!raw || typeof raw !== "object") {
    throw new HttpError(400, "Brand payload noto'g'ri", "VALIDATION_ERROR");
  }
  const name = clean(raw?.name);
  const image = clean(raw?.image);
  const link = clean(raw?.link);
  const filterValue = clean(raw?.filterValue);

  if (!name) {
    throw new HttpError(400, "name to'ldirilishi shart", "VALIDATION_ERROR");
  }
  if (!image) {
    throw new HttpError(400, "image to'ldirilishi shart", "VALIDATION_ERROR");
  }
  if (!link) {
    throw new HttpError(400, "link to'ldirilishi shart", "VALIDATION_ERROR");
  }
  if (!filterValue) {
    throw new HttpError(400, "filterValue to'ldirilishi shart", "VALIDATION_ERROR");
  }

  return {
    name,
    image,
    link,
    filterValue,
  };
}

function stripMongoMeta(doc) {
  if (!doc || typeof doc !== "object") return doc;
  const plain = typeof doc.toObject === "function" ? doc.toObject() : doc;
  const { _id, __v, createdAt, updatedAt, ...rest } = plain;
  return rest;
}

async function listCategories() {
  const [categoriyCountries, categoriesBrend] = await Promise.all([
    CountryCategory.find().sort({ id: 1 }).lean(),
    BrandCategory.find().sort({ id: 1 }).lean(),
  ]);
  return {
    categoriyCountries: categoriyCountries.map(stripMongoMeta),
    categoriesBrend: categoriesBrend.map(stripMongoMeta),
  };
}

async function getCountryByIdOrThrow(countryId) {
  const id = toInt(countryId, "countryId");
  const doc = await CountryCategory.findOne({ id });
  if (!doc) {
    throw new HttpError(404, "Country category topilmadi", "NOT_FOUND");
  }
  return doc;
}

async function getBrandByIdOrThrow(brandId) {
  const id = toInt(brandId, "brandId");
  const doc = await BrandCategory.findOne({ id });
  if (!doc) {
    throw new HttpError(404, "Brand category topilmadi", "NOT_FOUND");
  }
  return doc;
}

async function createCountryCategory(payload) {
  const normalized = normalizeCountryPayload(payload);
  const doc = new CountryCategory(normalized);
  await doc.save();
  return stripMongoMeta(doc);
}

async function updateCountryCategory(countryId, payload) {
  const doc = await getCountryByIdOrThrow(countryId);
  const merged = {
    name: payload?.name ?? doc.name,
    image: payload?.image ?? doc.image,
    flag: payload?.flag ?? doc.flag,
    link: payload?.link ?? doc.link,
    filterValue: payload?.filterValue ?? doc.filterValue,
  };
  const normalized = normalizeCountryPayload(merged);
  doc.name = normalized.name;
  doc.image = normalized.image;
  doc.flag = normalized.flag;
  doc.link = normalized.link;
  doc.filterValue = normalized.filterValue;
  await doc.save();
  return stripMongoMeta(doc);
}

async function deleteCountryCategory(countryId) {
  const id = toInt(countryId, "countryId");
  const result = await CountryCategory.findOneAndDelete({ id });
  if (!result) {
    throw new HttpError(404, "Country category topilmadi", "NOT_FOUND");
  }
}

async function createBrandCategory(payload) {
  const normalized = normalizeBrandPayload(payload);
  const doc = new BrandCategory(normalized);
  await doc.save();
  return stripMongoMeta(doc);
}

async function updateBrandCategory(brandId, payload) {
  const doc = await getBrandByIdOrThrow(brandId);
  const merged = {
    name: payload?.name ?? doc.name,
    image: payload?.image ?? doc.image,
    link: payload?.link ?? doc.link,
    filterValue: payload?.filterValue ?? doc.filterValue,
  };
  const normalized = normalizeBrandPayload(merged);
  doc.name = normalized.name;
  doc.image = normalized.image;
  doc.link = normalized.link;
  doc.filterValue = normalized.filterValue;
  await doc.save();
  return stripMongoMeta(doc);
}

async function deleteBrandCategory(brandId) {
  const id = toInt(brandId, "brandId");
  const result = await BrandCategory.findOneAndDelete({ id });
  if (!result) {
    throw new HttpError(404, "Brand category topilmadi", "NOT_FOUND");
  }
}

module.exports = {
  listCategories,
  createCountryCategory,
  updateCountryCategory,
  deleteCountryCategory,
  createBrandCategory,
  updateBrandCategory,
  deleteBrandCategory,
};
