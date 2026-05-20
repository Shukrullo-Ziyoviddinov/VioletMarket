const { CartItem } = require("../../models/cart");
const { Product } = require("../../models/product");
const { HttpError } = require("../../utils/httpError");
const {
  generateInitialUrgencyStock,
  buildNextShowAt,
  buildUrgencyDurationMs,
  buildUrgencyEndsAt,
  toClientUrgencyNextShowAt,
} = require("./cartUrgencyService");

function parseProductId(raw) {
  const num = Number(raw);
  if (!Number.isFinite(num)) {
    throw new HttpError(400, "Mahsulot ID noto'g'ri", "INVALID_PRODUCT_ID");
  }
  return num;
}

async function pickDistinctUrgencyStock(userId, excludeItemId = null) {
  const query = { userId };
  if (excludeItemId) {
    query._id = { $ne: excludeItemId };
  }

  const rows = await CartItem.find(query).select("urgencyStockLeft").lean();
  const used = new Set(
    rows
      .map((row) => Number(row.urgencyStockLeft))
      .filter((n) => Number.isFinite(n) && n >= 3 && n <= 6),
  );

  const candidates = [3, 4, 5, 6].filter((n) => !used.has(n));
  if (candidates.length === 0) {
    return generateInitialUrgencyStock();
  }
  const idx = Math.floor(Math.random() * candidates.length);
  return candidates[idx];
}

function mapItemToClient(doc) {
  const row = doc.toObject ? doc.toObject() : doc;
  return {
    cartItemId: String(row._id),
    id: row.productId,
    title: row.title,
    price: row.price,
    originalPrice: row.originalPrice,
    color: row.color || "",
    size: row.size || "",
    storage: row.storage || "",
    model: row.model || "",
    image: row.image,
    quantity: row.quantity,
    countries: row.countries || [],
    weight: row.weight ?? 300,
    urgencyStockLeft: Number.isFinite(row.urgencyStockLeft)
      ? row.urgencyStockLeft
      : 3,
    urgencyNextShowAt: toClientUrgencyNextShowAt(row.urgencyNextShowAt),
    urgencyEndsAt: toClientUrgencyNextShowAt(row.urgencyEndsAt),
    urgencyDurationMs: Number.isFinite(row.urgencyDurationMs)
      ? row.urgencyDurationMs
      : null,
  };
}

async function getCartForUser(userId) {
  const items = await CartItem.find({ userId }).sort({ createdAt: -1 });
  for (const item of items) {
    let changed = false;

    if (!Number.isFinite(item.urgencyDurationMs)) {
      item.urgencyDurationMs = buildUrgencyDurationMs(String(item._id));
      changed = true;
    }

    const endsAtMs = new Date(item.urgencyEndsAt || "").getTime();
    if (!Number.isFinite(endsAtMs)) {
      item.urgencyEndsAt = buildUrgencyEndsAt(item.urgencyDurationMs);
      changed = true;
    }

    if (changed) {
      await item.save();
    }
  }
  return { items: items.map(mapItemToClient) };
}

async function addCartItem(userId, payload) {
  const productId = parseProductId(payload.productId ?? payload.id);
  const product = await Product.findOne({ id: productId }).lean();
  if (!product) {
    throw new HttpError(404, "Mahsulot topilmadi", "PRODUCT_NOT_FOUND");
  }

  const color = String(payload.color || "");
  const size = String(payload.size || "");
  const storage = String(payload.storage || "");
  const model = String(payload.model || "");

  const existing = await CartItem.findOne({
    userId,
    productId,
    color,
    size,
    storage,
    model,
  });

  if (existing) {
    existing.quantity = (existing.quantity || 1) + (Number(payload.quantity) || 1);
    if (payload.title !== undefined) existing.title = payload.title;
    if (payload.price !== undefined) existing.price = Number(payload.price) || 0;
    if (payload.originalPrice !== undefined) {
      existing.originalPrice = Number(payload.originalPrice) || 0;
    }
    if (payload.image) existing.image = payload.image;
    if (!Number.isFinite(existing.urgencyStockLeft)) {
      existing.urgencyStockLeft = await pickDistinctUrgencyStock(userId, existing._id);
    }
    if (!Number.isFinite(existing.urgencyDurationMs)) {
      existing.urgencyDurationMs = buildUrgencyDurationMs(String(existing._id));
    }
    const endsAtMs = new Date(existing.urgencyEndsAt || "").getTime();
    if (!Number.isFinite(endsAtMs) || endsAtMs <= Date.now()) {
      existing.urgencyEndsAt = buildUrgencyEndsAt(existing.urgencyDurationMs);
    }
    existing.urgencyNextShowAt = buildNextShowAt();
    await existing.save();
    return getCartForUser(userId);
  }

  const doc = new CartItem({
    userId,
    productId,
    quantity: Math.max(1, Number(payload.quantity) || 1),
    color,
    size,
    storage,
    model,
    title: payload.title ?? product.title ?? "Mahsulot",
    price: Number(payload.price) || 0,
    originalPrice: Number(payload.originalPrice) || Number(payload.price) || 0,
    image: payload.image || "/img/no-image.png",
    countries: Array.isArray(payload.countries) ? payload.countries : product.countries || [],
    weight: Number(payload.weight) || product.weight || 300,
    urgencyStockLeft: await pickDistinctUrgencyStock(userId),
    urgencyNextShowAt: null,
    urgencyEndsAt: null,
    urgencyDurationMs: null,
  });
  doc.urgencyDurationMs = buildUrgencyDurationMs(String(doc._id));
  doc.urgencyEndsAt = buildUrgencyEndsAt(doc.urgencyDurationMs);
  doc.urgencyNextShowAt = buildNextShowAt();
  await doc.save();

  return getCartForUser(userId);
}

async function updateCartItemQuantity(userId, itemId, change) {
  const item = await CartItem.findOne({ _id: itemId, userId });
  if (!item) {
    throw new HttpError(404, "Savat elementi topilmadi", "CART_ITEM_NOT_FOUND");
  }

  const delta = Number(change);
  if (!Number.isFinite(delta)) {
    throw new HttpError(400, "Miqdor noto'g'ri", "INVALID_QUANTITY");
  }

  const nextQty = (item.quantity || 1) + delta;
  if (nextQty <= 0) {
    await CartItem.deleteOne({ _id: item._id });
  } else {
    item.quantity = nextQty;
    await item.save();
  }

  return getCartForUser(userId);
}

async function removeCartItem(userId, itemId) {
  const result = await CartItem.deleteOne({ _id: itemId, userId });
  if (result.deletedCount === 0) {
    throw new HttpError(404, "Savat elementi topilmadi", "CART_ITEM_NOT_FOUND");
  }
  return getCartForUser(userId);
}

async function clearCartForUser(userId) {
  await CartItem.deleteMany({ userId });
  return getCartForUser(userId);
}

async function dismissCartUrgency(userId, itemId) {
  const item = await CartItem.findOne({ _id: itemId, userId });
  if (!item) {
    throw new HttpError(404, "Savat elementi topilmadi", "CART_ITEM_NOT_FOUND");
  }
  const current = Number(item.urgencyStockLeft);
  if (Number.isFinite(current)) {
    item.urgencyStockLeft = Math.max(1, current - 1);
  } else {
    item.urgencyStockLeft = 1;
  }
  if (!Number.isFinite(item.urgencyDurationMs)) {
    item.urgencyDurationMs = buildUrgencyDurationMs(String(item._id));
  }
  const endsAtMs = new Date(item.urgencyEndsAt || "").getTime();
  if (!Number.isFinite(endsAtMs) || endsAtMs <= Date.now()) {
    item.urgencyEndsAt = buildUrgencyEndsAt(item.urgencyDurationMs);
  }
  item.urgencyNextShowAt = buildNextShowAt();
  await item.save();
  return getCartForUser(userId);
}

module.exports = {
  getCartForUser,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCartForUser,
  dismissCartUrgency,
};
