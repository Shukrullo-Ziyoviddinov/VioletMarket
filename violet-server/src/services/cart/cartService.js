const { CartItem } = require("../../models/cart");
const { Product } = require("../../models/product");
const { HttpError } = require("../../utils/httpError");

function parseProductId(raw) {
  const num = Number(raw);
  if (!Number.isFinite(num)) {
    throw new HttpError(400, "Mahsulot ID noto'g'ri", "INVALID_PRODUCT_ID");
  }
  return num;
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
  };
}

async function getCartForUser(userId) {
  const items = await CartItem.find({ userId }).sort({ createdAt: -1 });
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
    await existing.save();
    return getCartForUser(userId);
  }

  await CartItem.create({
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
  });

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

module.exports = {
  getCartForUser,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCartForUser,
};
