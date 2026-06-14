const {
  BrandCategory,
  BrandCountryFilterValue,
  CountryCategory,
  HomeBannerSlide,
  MasterCategory,
  NavbarSection,
} = require("../models");
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

function normalizeFilterType(value) {
  const type = clean(value).toLowerCase();
  if (type !== "brand" && type !== "country") {
    throw new HttpError(400, "type faqat brand yoki country bo'lishi mumkin", "VALIDATION_ERROR");
  }
  return type;
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

function normalizeFilterValuePayload(raw) {
  if (!raw || typeof raw !== "object") {
    throw new HttpError(400, "Filter payload noto'g'ri", "VALIDATION_ERROR");
  }
  const type = normalizeFilterType(raw?.type);
  const filterValue = clean(raw?.filterValue);
  if (!filterValue) {
    throw new HttpError(400, "filterValue to'ldirilishi shart", "VALIDATION_ERROR");
  }
  return { type, filterValue };
}

function normalizeMasterCategoryPayload(raw) {
  if (!raw || typeof raw !== "object") {
    throw new HttpError(400, "Master category payload noto'g'ri", "VALIDATION_ERROR");
  }
  const uz = clean(raw?.name?.uz);
  const ru = clean(raw?.name?.ru);
  if (!uz || !ru) {
    throw new HttpError(400, "name.uz va name.ru to'ldirilishi shart", "VALIDATION_ERROR");
  }
  return { name: { uz, ru } };
}

function stripMongoMeta(doc) {
  if (!doc || typeof doc !== "object") return doc;
  const plain = typeof doc.toObject === "function" ? doc.toObject() : doc;
  const { _id, __v, createdAt, updatedAt, ...rest } = plain;
  return rest;
}

async function listCategories() {
  const [masterCategories, categoriyCountries, categoriesBrend, filterValues] = await Promise.all([
    MasterCategory.find().sort({ id: 1 }).lean(),
    CountryCategory.find().sort({ id: 1 }).lean(),
    BrandCategory.find().sort({ id: 1 }).lean(),
    BrandCountryFilterValue.find().sort({ type: 1, id: 1 }).lean(),
  ]);
  return {
    masterCategories: masterCategories.map(stripMongoMeta),
    categoriyCountries: categoriyCountries.map(stripMongoMeta),
    categoriesBrend: categoriesBrend.map(stripMongoMeta),
    filterValues: filterValues.map(stripMongoMeta),
  };
}

async function ensureFilterValueExists(type, filterValue) {
  const normalizedType = normalizeFilterType(type);
  const normalizedFilterValue = clean(filterValue);
  if (!normalizedFilterValue) {
    throw new HttpError(400, "filterValue to'ldirilishi shart", "VALIDATION_ERROR");
  }
  const row = await BrandCountryFilterValue.findOne({
    type: normalizedType,
    filterValue: normalizedFilterValue,
  }).lean();
  if (!row) {
    throw new HttpError(
      400,
      `Tanlangan filterValue (${normalizedFilterValue}) ${normalizedType} turida topilmadi`,
      "VALIDATION_ERROR"
    );
  }
}

async function getMasterCategoryByIdOrThrow(masterCategoryId) {
  const id = toInt(masterCategoryId, "masterCategoryId");
  const doc = await MasterCategory.findOne({ id });
  if (!doc) {
    throw new HttpError(404, "Master category topilmadi", "NOT_FOUND");
  }
  return doc;
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
  await ensureFilterValueExists("country", normalized.filterValue);
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
  await ensureFilterValueExists("country", normalized.filterValue);
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
  await ensureFilterValueExists("brand", normalized.filterValue);
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
  await ensureFilterValueExists("brand", normalized.filterValue);
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

async function getFilterValueByIdOrThrow(filterId) {
  const id = toInt(filterId, "filterId");
  const row = await BrandCountryFilterValue.findOne({ id });
  if (!row) {
    throw new HttpError(404, "Filter value topilmadi", "NOT_FOUND");
  }
  return row;
}

async function createMasterCategory(payload) {
  const normalized = normalizeMasterCategoryPayload(payload);
  const duplicate = await MasterCategory.findOne({
    "name.uz": normalized.name.uz,
    "name.ru": normalized.name.ru,
  }).lean();
  if (duplicate) {
    throw new HttpError(409, "Bunday master category allaqachon bor", "CONFLICT");
  }
  const row = new MasterCategory(normalized);
  await row.save();
  return stripMongoMeta(row);
}

async function updateMasterCategory(masterCategoryId, payload) {
  const row = await getMasterCategoryByIdOrThrow(masterCategoryId);
  const merged = {
    name: {
      uz: payload?.name?.uz ?? row?.name?.uz,
      ru: payload?.name?.ru ?? row?.name?.ru,
    },
  };
  const normalized = normalizeMasterCategoryPayload(merged);
  row.name = normalized.name;
  await row.save();
  return stripMongoMeta(row);
}

async function deleteMasterCategory(masterCategoryId) {
  const row = await getMasterCategoryByIdOrThrow(masterCategoryId);
  const navbarInUse = await NavbarSection.countDocuments({
    "items.masterCategoryId": row.id,
  });
  const bannerInUse = await HomeBannerSlide.countDocuments({
    masterCategoryId: row.id,
  });
  if (navbarInUse > 0 || bannerInUse > 0) {
    throw new HttpError(
      409,
      "Bu master category banner yoki navbar itemlarda ishlatilgan. O'chirib bo'lmaydi.",
      "CONFLICT"
    );
  }
  await MasterCategory.deleteOne({ id: row.id });
}

async function createFilterValue(payload) {
  const normalized = normalizeFilterValuePayload(payload);
  const duplicate = await BrandCountryFilterValue.findOne(normalized).lean();
  if (duplicate) {
    throw new HttpError(409, "Bunday filterValue allaqachon bor", "CONFLICT");
  }
  const row = new BrandCountryFilterValue(normalized);
  await row.save();
  return stripMongoMeta(row);
}

async function updateFilterValue(filterId, payload) {
  const row = await getFilterValueByIdOrThrow(filterId);
  const merged = {
    type: payload?.type ?? row.type,
    filterValue: payload?.filterValue ?? row.filterValue,
  };
  const normalized = normalizeFilterValuePayload(merged);
  if (normalized.type !== row.type || normalized.filterValue !== row.filterValue) {
    const duplicate = await BrandCountryFilterValue.findOne(normalized).lean();
    if (duplicate) {
      throw new HttpError(409, "Bunday filterValue allaqachon bor", "CONFLICT");
    }
  }

  const sourceModel = row.type === "country" ? CountryCategory : BrandCategory;
  const inUseCount = await sourceModel.countDocuments({ filterValue: row.filterValue });
  const changingKey = normalized.type !== row.type || normalized.filterValue !== row.filterValue;
  if (changingKey && inUseCount > 0) {
    throw new HttpError(
      409,
      "Bu filterValue kategoriyalarda ishlatilgan. Avval kategoriyalarni yangilang.",
      "CONFLICT"
    );
  }

  row.type = normalized.type;
  row.filterValue = normalized.filterValue;
  await row.save();
  return stripMongoMeta(row);
}

async function deleteFilterValue(filterId) {
  const row = await getFilterValueByIdOrThrow(filterId);
  const sourceModel = row.type === "country" ? CountryCategory : BrandCategory;
  const inUseCount = await sourceModel.countDocuments({ filterValue: row.filterValue });
  if (inUseCount > 0) {
    throw new HttpError(
      409,
      "Bu filterValue kategoriyalarda ishlatilgan. O'chirib bo'lmaydi.",
      "CONFLICT"
    );
  }
  await BrandCountryFilterValue.deleteOne({ id: row.id });
}

module.exports = {
  listCategories,
  createMasterCategory,
  updateMasterCategory,
  deleteMasterCategory,
  createCountryCategory,
  updateCountryCategory,
  deleteCountryCategory,
  createBrandCategory,
  updateBrandCategory,
  deleteBrandCategory,
  createFilterValue,
  updateFilterValue,
  deleteFilterValue,
};
