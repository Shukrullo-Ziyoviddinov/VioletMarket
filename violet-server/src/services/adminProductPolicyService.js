const { ProductPolicyBlock } = require("../models");
const { HttpError } = require("../utils/httpError");

const ALLOWED_ICONS = new Set(["package", "truck", "refresh", "chat", "credit-card"]);

function clean(value) {
  return String(value || "").trim();
}

function normalizeI18n(value, label) {
  if (!value || typeof value !== "object") {
    throw new HttpError(400, `${label}.uz va ${label}.ru to'ldirilishi shart`, "VALIDATION_ERROR");
  }
  const uz = clean(value.uz);
  const ru = clean(value.ru);
  if (!uz || !ru) {
    throw new HttpError(400, `${label}.uz va ${label}.ru to'ldirilishi shart`, "VALIDATION_ERROR");
  }
  return { uz, ru };
}

function normalizeIcon(value) {
  const icon = clean(value).toLowerCase();
  if (!icon) {
    throw new HttpError(400, "icon to'ldirilishi shart", "VALIDATION_ERROR");
  }
  if (!ALLOWED_ICONS.has(icon)) {
    throw new HttpError(
      400,
      "icon faqat package, truck, refresh, chat yoki credit-card bo'lishi mumkin",
      "VALIDATION_ERROR"
    );
  }
  return icon;
}

function normalizePaymentIcons(raw) {
  if (raw === undefined || raw === null) return undefined;
  if (!Array.isArray(raw)) {
    throw new HttpError(400, "paymentIcons array bo'lishi kerak", "VALIDATION_ERROR");
  }
  if (!raw.length) return [];

  return raw.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new HttpError(400, `paymentIcons[${index}] noto'g'ri`, "VALIDATION_ERROR");
    }
    const src = clean(item.src);
    if (!src) {
      throw new HttpError(400, `paymentIcons[${index}].src to'ldirilishi shart`, "VALIDATION_ERROR");
    }
    const alt = item.alt ? normalizeI18n(item.alt, `paymentIcons[${index}].alt`) : undefined;
    return alt ? { src, alt } : { src };
  });
}

function normalizeBlockPayload(raw) {
  if (!raw || typeof raw !== "object") {
    throw new HttpError(400, "block payload noto'g'ri", "VALIDATION_ERROR");
  }

  const block = {
    icon: normalizeIcon(raw.icon),
    divider: raw.divider !== false,
    title: normalizeI18n(raw.title, "title"),
    text: normalizeI18n(raw.text, "text"),
  };

  const paymentIcons = normalizePaymentIcons(raw.paymentIcons);
  if (paymentIcons !== undefined) {
    block.paymentIcons = paymentIcons;
  }

  return block;
}

function toSortOrder(value, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    throw new HttpError(400, "order noto'g'ri", "VALIDATION_ERROR");
  }
  return Math.floor(n);
}

function stripMongoMeta(doc) {
  if (!doc || typeof doc !== "object") return doc;
  const plain = typeof doc.toObject === "function" ? doc.toObject() : doc;
  const { _id, __v, createdAt, updatedAt, ...rest } = plain;
  return rest;
}

async function getNextOrder() {
  const last = await ProductPolicyBlock.findOne().sort({ order: -1 }).lean();
  return Number.isFinite(last?.order) ? Number(last.order) + 1 : 0;
}

async function listProductPolicyBlocks() {
  const rows = await ProductPolicyBlock.find().sort({ order: 1 }).lean();
  return rows.map((row) => ({
    order: row.order,
    block: row.block,
  }));
}

async function createProductPolicyBlock(payload) {
  const block = normalizeBlockPayload(payload?.block);
  const defaultOrder = await getNextOrder();
  const order = toSortOrder(payload?.order, defaultOrder);

  const duplicate = await ProductPolicyBlock.findOne({ order }).lean();
  if (duplicate) {
    throw new HttpError(409, "Bunday order allaqachon mavjud", "CONFLICT");
  }

  const row = new ProductPolicyBlock({ order, block });
  await row.save();
  return stripMongoMeta(row);
}

async function updateProductPolicyBlock(sourceOrder, payload) {
  const currentOrder = toSortOrder(sourceOrder, -1);
  if (currentOrder < 0) {
    throw new HttpError(400, "order noto'g'ri", "VALIDATION_ERROR");
  }

  const row = await ProductPolicyBlock.findOne({ order: currentOrder });
  if (!row) {
    throw new HttpError(404, "Product policy bloki topilmadi", "NOT_FOUND");
  }

  const nextOrder =
    payload?.order !== undefined ? toSortOrder(payload.order, row.order) : row.order;

  if (nextOrder !== row.order) {
    const duplicate = await ProductPolicyBlock.findOne({ order: nextOrder }).lean();
    if (duplicate) {
      throw new HttpError(409, "Yangi order band", "CONFLICT");
    }
  }

  row.order = nextOrder;
  if (payload?.block !== undefined) {
    row.block = normalizeBlockPayload(payload.block);
  }

  await row.save();
  return stripMongoMeta(row);
}

async function deleteProductPolicyBlock(sourceOrder) {
  const order = toSortOrder(sourceOrder, -1);
  if (order < 0) {
    throw new HttpError(400, "order noto'g'ri", "VALIDATION_ERROR");
  }

  const deleted = await ProductPolicyBlock.findOneAndDelete({ order });
  if (!deleted) {
    throw new HttpError(404, "Product policy bloki topilmadi", "NOT_FOUND");
  }
}

module.exports = {
  listProductPolicyBlocks,
  createProductPolicyBlock,
  updateProductPolicyBlock,
  deleteProductPolicyBlock,
};
