const { Wishlist } = require("../../models/wishlist");
const { Product } = require("../../models/product");
const { HttpError } = require("../../utils/httpError");

function parseProductId(raw) {
  const num = Number(raw);
  if (!Number.isFinite(num)) {
    throw new HttpError(400, "Mahsulot ID noto'g'ri", "INVALID_PRODUCT_ID");
  }
  return num;
}

function orderProductsByIds(products, productIds) {
  const map = new Map(products.map((p) => [p.id, p]));
  return productIds.map((id) => map.get(id)).filter(Boolean);
}

async function getWishlistForUser(userId) {
  const items = await Wishlist.find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  const productIds = items.map((item) => item.productId);
  if (productIds.length === 0) {
    return { productIds: [], products: [] };
  }

  const products = await Product.find({ id: { $in: productIds } }).lean();
  return {
    productIds,
    products: orderProductsByIds(products, productIds),
  };
}

async function toggleWishlistItem(userId, rawProductId) {
  const productId = parseProductId(rawProductId);

  const product = await Product.findOne({ id: productId }).lean();
  if (!product) {
    throw new HttpError(404, "Mahsulot topilmadi", "PRODUCT_NOT_FOUND");
  }

  const existing = await Wishlist.findOne({ userId, productId });
  if (existing) {
    await Wishlist.deleteOne({ _id: existing._id });
    return { added: false, productId };
  }

  try {
    await Wishlist.create({ userId, productId });
  } catch (err) {
    if (err.code === 11000) {
      return { added: true, productId };
    }
    throw err;
  }

  return { added: true, productId };
}

async function removeWishlistItem(userId, rawProductId) {
  const productId = parseProductId(rawProductId);
  await Wishlist.deleteOne({ userId, productId });
  return { productId };
}

module.exports = {
  getWishlistForUser,
  toggleWishlistItem,
  removeWishlistItem,
};
