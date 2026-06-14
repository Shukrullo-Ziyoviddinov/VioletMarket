const { VideoBannerItem } = require("../models");
const { HttpError } = require("../utils/httpError");

function toInt(value, label) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw new HttpError(400, `${label} noto'g'ri`, "VALIDATION_ERROR");
  }
  return Math.floor(n);
}

function normalizeBannerPayload(raw) {
  if (!raw || typeof raw !== "object") {
    throw new HttpError(400, "Payload noto'g'ri", "VALIDATION_ERROR");
  }
  const title = String(raw.title || "").trim();
  const subtitle = String(raw.subtitle || "").trim();
  const src = String(raw.src || "").trim();

  if (!title) {
    throw new HttpError(400, "title to'ldirilishi shart", "VALIDATION_ERROR");
  }
  if (!subtitle) {
    throw new HttpError(400, "subtitle to'ldirilishi shart", "VALIDATION_ERROR");
  }
  if (!src) {
    throw new HttpError(400, "src (video manzili) to'ldirilishi shart", "VALIDATION_ERROR");
  }
  return { title, subtitle, src };
}

function mapBanner(doc) {
  if (!doc) return null;
  const plain = typeof doc.toObject === "function" ? doc.toObject() : doc;
  const { _id, __v, createdAt, updatedAt, ...rest } = plain;
  return rest;
}

async function listBanners() {
  const docs = await VideoBannerItem.find().sort({ id: 1 }).lean();
  return docs.map(mapBanner);
}

async function createBanner(payload) {
  const normalized = normalizeBannerPayload(payload);
  const banner = new VideoBannerItem(normalized);
  await banner.save();
  return mapBanner(banner);
}

async function getBannerByIdOrThrow(bannerId) {
  const id = toInt(bannerId, "bannerId");
  const banner = await VideoBannerItem.findOne({ id });
  if (!banner) {
    throw new HttpError(404, "Video banner topilmadi", "NOT_FOUND");
  }
  return banner;
}

async function updateBanner(bannerId, payload) {
  const banner = await getBannerByIdOrThrow(bannerId);
  const merged = {
    title: payload?.title ?? banner.title,
    subtitle: payload?.subtitle ?? banner.subtitle,
    src: payload?.src ?? banner.src,
  };
  const normalized = normalizeBannerPayload(merged);
  banner.title = normalized.title;
  banner.subtitle = normalized.subtitle;
  banner.src = normalized.src;
  await banner.save();
  return mapBanner(banner);
}

async function deleteBanner(bannerId) {
  const id = toInt(bannerId, "bannerId");
  const result = await VideoBannerItem.findOneAndDelete({ id });
  if (!result) {
    throw new HttpError(404, "Video banner topilmadi", "NOT_FOUND");
  }
}

module.exports = {
  listBanners,
  createBanner,
  updateBanner,
  deleteBanner,
};
