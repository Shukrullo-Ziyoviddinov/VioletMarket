const { Wishlist } = require("../../models/wishlist");
const { Product } = require("../../models/product");
const { HttpError } = require("../../utils/httpError");
const { isProductActiveOnClient } = require("../../utils/productClientVisibility");

function parseProductId(raw) {
  const num = Number(raw);
  if (!Number.isFinite(num)) {
    throw new HttpError(400, "Mahsulot ID noto'g'ri", "INVALID_PRODUCT_ID");
  }
  return num;
}

async function findNewestProductById(productId) {
  const rows = await Product.find({ id: productId }).sort({ _id: -1 }).limit(1).lean();
  return rows[0] || null;
}

function orderProductsByIds(products, productIds) {
  const map = new Map(products.map((p) => [p.id, p]));
  return productIds.map((id) => map.get(id)).filter(Boolean);
}

function keepNewestProducts(products) {
  const seen = new Set();
  const unique = [];
  for (const product of Array.isArray(products) ? products : []) {
    const id = Number(product?.id);
    if (!Number.isFinite(id) || seen.has(id)) continue;
    seen.add(id);
    unique.push(product);
  }
  return unique;
}

async function getWishlistForUser(userId) {
  const items = await Wishlist.find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  const productIds = items.map((item) => item.productId);
  if (productIds.length === 0) {
    return { productIds: [], products: [] };
  }

  const rows = await Product.find({ id: { $in: productIds } })
    .sort({ _id: -1 })
    .lean();

  const activeProducts = keepNewestProducts(rows).filter(isProductActiveOnClient);
  const activeIdSet = new Set(activeProducts.map((product) => Number(product.id)));
  // Wishlist DB o'zgarmaydi; faqat GET da pause/pending ko'rinmaydi
  const visibleProductIds = productIds.filter((id) => activeIdSet.has(Number(id)));

  return {
    productIds: visibleProductIds,
    products: orderProductsByIds(activeProducts, visibleProductIds),
  };
}

async function toggleWishlistItem(userId, rawProductId) {
  const productId = parseProductId(rawProductId);

  const existing = await Wishlist.findOne({ userId, productId });
  if (existing) {
    await Wishlist.deleteOne({ _id: existing._id });
    return { added: false, productId };
  }

  const product = await findNewestProductById(productId);
  if (!product || !isProductActiveOnClient(product)) {
    throw new HttpError(404, "Mahsulot topilmadi", "PRODUCT_NOT_FOUND");
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
