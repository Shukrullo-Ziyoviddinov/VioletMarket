const { HomeBannerSlide, MasterCategory } = require("../models");
const { HttpError } = require("../utils/httpError");

function toInt(value, label) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw new HttpError(400, `${label} noto'g'ri`, "VALIDATION_ERROR");
  }
  return Math.floor(n);
}

function normalizeType(value) {
  const normalized = String(value || "image").trim().toLowerCase();
  if (normalized !== "image" && normalized !== "video") {
    throw new HttpError(400, "type faqat image yoki video bo'lishi mumkin", "VALIDATION_ERROR");
  }
  return normalized;
}

function normalizeSrc(raw) {
  const uz = String(raw?.uz || "").trim();
  const ru = String(raw?.ru || "").trim();
  if (!uz || !ru) {
    throw new HttpError(400, "src.uz va src.ru to'ldirilishi shart", "VALIDATION_ERROR");
  }
  return { uz, ru };
}

function normalizeClickable(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value == null) return Boolean(fallback);
  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase();
    if (lowered === "true") return true;
    if (lowered === "false") return false;
  }
  return Boolean(value);
}

async function resolveMasterCategory(rawMasterCategoryId, rawCategoryText) {
  const normalizedId = Number(rawMasterCategoryId);
  if (Number.isFinite(normalizedId) && normalizedId > 0) {
    const byId = await MasterCategory.findOne({ id: Math.floor(normalizedId) });
    if (!byId) {
      throw new HttpError(400, "masterCategoryId noto'g'ri", "VALIDATION_ERROR");
    }
    return byId;
  }

  const categoryText = String(rawCategoryText || "").trim();
  if (!categoryText) return null;

  const byName = await MasterCategory.findOne({
    $or: [{ "name.uz": categoryText }, { "name.ru": categoryText }],
  });
  if (!byName) {
    throw new HttpError(
      400,
      `Master category topilmadi: ${categoryText}`,
      "VALIDATION_ERROR"
    );
  }
  return byName;
}

async function normalizeBannerPayload(raw, fallback = {}) {
  if (!raw || typeof raw !== "object") {
    throw new HttpError(400, "Payload noto'g'ri", "VALIDATION_ERROR");
  }

  const type = normalizeType(raw?.type ?? fallback.type);
  const src = normalizeSrc(raw?.src ?? fallback.src);
  const clickable = normalizeClickable(raw?.clickable, fallback.clickable);
  const masterCategory = await resolveMasterCategory(
    raw?.masterCategoryId ?? fallback.masterCategoryId,
    raw?.category ?? fallback.category
  );
  const rawCategory =
    raw?.category !== undefined ? raw.category : fallback?.category !== undefined ? fallback.category : "";
  const category = String(masterCategory?.name?.uz || rawCategory || "").trim();
  const countriesCategories = String(
    raw?.countriesCategories ?? fallback.countriesCategories ?? ""
  ).trim();
  const brandCategories = String(raw?.brandCategories ?? fallback.brandCategories ?? "").trim();

  return {
    type,
    src,
    clickable,
    masterCategoryId: masterCategory?.id,
    category: category || undefined,
    countriesCategories: countriesCategories || undefined,
    brandCategories: brandCategories || undefined,
  };
}

function mapBanner(doc) {
  if (!doc) return null;
  const plain = typeof doc.toObject === "function" ? doc.toObject() : doc;
  const { _id, __v, createdAt, updatedAt, ...rest } = plain;
  return rest;
}

async function listBanners() {
  const docs = await HomeBannerSlide.find().sort({ id: 1 }).lean();
  return docs.map(mapBanner);
}

async function createBanner(payload) {
  const normalized = await normalizeBannerPayload(payload);
  const banner = new HomeBannerSlide(normalized);
  await banner.save();
  return mapBanner(banner);
}

async function getBannerByIdOrThrow(bannerId) {
  const id = toInt(bannerId, "bannerId");
  const banner = await HomeBannerSlide.findOne({ id });
  if (!banner) {
    throw new HttpError(404, "Home banner topilmadi", "NOT_FOUND");
  }
  return banner;
}

async function updateBanner(bannerId, payload) {
  const banner = await getBannerByIdOrThrow(bannerId);
  const normalized = await normalizeBannerPayload(payload, banner);
  banner.type = normalized.type;
  banner.src = normalized.src;
  banner.clickable = normalized.clickable;
  banner.masterCategoryId = normalized.masterCategoryId;
  banner.category = normalized.category;
  banner.countriesCategories = normalized.countriesCategories;
  banner.brandCategories = normalized.brandCategories;
  await banner.save();
  return mapBanner(banner);
}

async function deleteBanner(bannerId) {
  const id = toInt(bannerId, "bannerId");
  const result = await HomeBannerSlide.findOneAndDelete({ id });
  if (!result) {
    throw new HttpError(404, "Home banner topilmadi", "NOT_FOUND");
  }
}

module.exports = {
  listBanners,
  createBanner,
  updateBanner,
  deleteBanner,
};
