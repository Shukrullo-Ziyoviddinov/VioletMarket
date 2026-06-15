const { Product } = require("../models");
const { ProductType } = require("../models/productType");
const { HttpError } = require("../utils/httpError");

const PRODUCT_TYPE_LEGACY_ALIASES = {
  "yozgi-keyim": "yozgi_keyim",
  "qo'lqop": "qolqop",
  "oyoq kiyim": "oyoq_kiyim",
  "o'yin": "oyin",
};

function clean(value) {
  return String(value || "").trim();
}

function stripMongoMeta(doc) {
  if (!doc || typeof doc !== "object") return doc;
  const plain = typeof doc.toObject === "function" ? doc.toObject() : doc;
  const { _id, __v, createdAt, updatedAt, ...rest } = plain;
  return rest;
}

function normalizeCodeInput(value) {
  return clean(value)
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeCode(value) {
  const code = normalizeCodeInput(value);
  if (!code) {
    throw new HttpError(400, "code to'ldirilishi shart", "VALIDATION_ERROR");
  }
  if (!/^[a-z0-9_]+$/.test(code)) {
    throw new HttpError(
      400,
      "code faqat kichik lotin harflari, raqam va _ bo'lishi mumkin",
      "VALIDATION_ERROR",
    );
  }
  return code;
}

function normalizeTitle(value) {
  const title = clean(value);
  if (!title) {
    throw new HttpError(400, "title to'ldirilishi shart", "VALIDATION_ERROR");
  }
  return title;
}

function normalizeGroup(value) {
  return clean(value);
}

function toSortOrder(value, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    throw new HttpError(400, "sortOrder noto'g'ri", "VALIDATION_ERROR");
  }
  return Math.floor(n);
}

function normalizeActive(value, fallback = true) {
  if (value === undefined) return Boolean(fallback);
  return Boolean(value);
}

function normalizeProductTypeToken(value) {
  const raw = clean(value).toLowerCase();
  if (!raw) return "";
  if (PRODUCT_TYPE_LEGACY_ALIASES[raw]) return PRODUCT_TYPE_LEGACY_ALIASES[raw];
  return normalizeCodeInput(raw);
}

async function getNextSortOrder() {
  const last = await ProductType.findOne().sort({ sortOrder: -1, id: -1 }).lean();
  return Number.isFinite(last?.sortOrder) ? Number(last.sortOrder) + 1 : 0;
}

async function getByIdOrThrow(productTypeId) {
  const id = Number(productTypeId);
  if (!Number.isFinite(id) || id <= 0) {
    throw new HttpError(400, "productTypeId noto'g'ri", "VALIDATION_ERROR");
  }
  const row = await ProductType.findOne({ id: Math.floor(id) });
  if (!row) {
    throw new HttpError(404, "Mahsulot turi topilmadi", "NOT_FOUND");
  }
  return row;
}

async function listProductTypes({ activeOnly = false } = {}) {
  const filter = activeOnly ? { active: { $ne: false } } : {};
  const rows = await ProductType.find(filter).sort({ sortOrder: 1, id: 1 }).lean();
  return rows.map(stripMongoMeta);
}

function resolveProductTypeCode(rawValue, rows) {
  const token = normalizeProductTypeToken(rawValue);
  if (!token) return "";

  const list = Array.isArray(rows) ? rows : [];
  const row = list.find((item) => normalizeProductTypeToken(item?.code) === token);
  return row ? String(row.code).trim() : String(rawValue || "").trim();
}

async function normalizeProductTypeValue(rawValue) {
  const raw = clean(rawValue);
  if (!raw) return "";

  const rows = await listProductTypes({ activeOnly: true });
  const token = normalizeProductTypeToken(raw);
  const row = rows.find((item) => normalizeProductTypeToken(item?.code) === token);
  if (!row) {
    throw new HttpError(400, "Mahsulot turi topilmadi", "VALIDATION_ERROR");
  }
  return String(row.code).trim();
}

async function createProductType(payload) {
  const code = normalizeCode(payload?.code);
  const duplicate = await ProductType.findOne({ code }).lean();
  if (duplicate) {
    throw new HttpError(409, "Bunday code allaqachon mavjud", "CONFLICT");
  }

  const defaultSortOrder = await getNextSortOrder();
  const row = new ProductType({
    code,
    title: normalizeTitle(payload?.title),
    group: normalizeGroup(payload?.group),
    sortOrder: toSortOrder(payload?.sortOrder, defaultSortOrder),
    active: normalizeActive(payload?.active, true),
  });
  await row.save();
  return stripMongoMeta(row);
}

async function updateProductType(productTypeId, payload) {
  const row = await getByIdOrThrow(productTypeId);
  const nextCode = payload?.code !== undefined ? normalizeCode(payload.code) : row.code;

  if (nextCode !== row.code) {
    const duplicate = await ProductType.findOne({ code: nextCode }).lean();
    if (duplicate) {
      throw new HttpError(409, "Bunday code allaqachon mavjud", "CONFLICT");
    }
    const inUseCount = await Product.countDocuments({ productType: row.code });
    if (inUseCount > 0) {
      throw new HttpError(
        409,
        "Bu mahsulot turi mahsulotlarda ishlatilgan. Avval mahsulotlarni yangilang.",
        "CONFLICT",
      );
    }
  }

  row.code = nextCode;
  if (payload?.title !== undefined) row.title = normalizeTitle(payload.title);
  if (payload?.group !== undefined) row.group = normalizeGroup(payload.group);
  if (payload?.sortOrder !== undefined) row.sortOrder = toSortOrder(payload.sortOrder, row.sortOrder);
  if (payload?.active !== undefined) row.active = normalizeActive(payload.active, row.active);
  await row.save();
  return stripMongoMeta(row);
}

async function deleteProductType(productTypeId) {
  const row = await getByIdOrThrow(productTypeId);
  const inUseCount = await Product.countDocuments({ productType: row.code });
  if (inUseCount > 0) {
    throw new HttpError(
      409,
      "Bu mahsulot turi mahsulotlarda ishlatilgan. O'chirib bo'lmaydi.",
      "CONFLICT",
    );
  }
  await ProductType.deleteOne({ id: row.id });
}

module.exports = {
  listProductTypes,
  createProductType,
  updateProductType,
  deleteProductType,
  normalizeProductTypeValue,
  resolveProductTypeCode,
  normalizeProductTypeToken,
};
