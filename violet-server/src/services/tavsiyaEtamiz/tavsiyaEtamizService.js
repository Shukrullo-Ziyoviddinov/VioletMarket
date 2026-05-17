const { Product } = require("../../models/product");
const { HttpError } = require("../../utils/httpError");
const viewedAtService = require("../viewedAt/viewedAtService");
const {
  getRecommendationsByViewingHistory,
  getRecommendationsForProductDetail,
  getDefaultProducts,
} = require("./tavsiyaEtamizAlgorithm");

async function loadAllProducts() {
  return Product.find().lean();
}

async function findProductById(rawId) {
  const productId = Number(rawId);
  if (!Number.isFinite(productId)) {
    throw new HttpError(400, "Mahsulot ID noto'g'ri", "INVALID_PRODUCT_ID");
  }
  const product = await Product.findOne({ id: productId }).lean();
  if (!product) {
    throw new HttpError(404, "Mahsulot topilmadi", "PRODUCT_NOT_FOUND");
  }
  return product;
}

function parseOptionalLimit(raw) {
  if (raw == null || raw === "") return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.floor(n);
}

async function getViewedProductIds(userId) {
  if (!userId) return [];
  return viewedAtService.getRecentProductIds(userId);
}

/** Product detail — Tavsiya etamiz */
async function getForProductDetail(userId, rawProductId, rawLimit) {
  const current = await findProductById(rawProductId);
  const all = await loadAllProducts();
  const viewedIds = await getViewedProductIds(userId);
  const limit = parseOptionalLimit(rawLimit);
  const products = getRecommendationsForProductDetail(current, viewedIds, all, limit);
  return { products };
}

/** Cart / Wishlist / Profile */
async function getByViewingHistory(userId, rawLimit) {
  const limit = parseOptionalLimit(rawLimit);
  const all = await loadAllProducts();

  if (!userId) {
    return { products: getDefaultProducts(all, limit) };
  }

  const viewedIds = await getViewedProductIds(userId);
  let products = getRecommendationsByViewingHistory(viewedIds, all, limit);
  if (products.length === 0) {
    products = getDefaultProducts(all, limit);
  }
  return { products };
}

module.exports = {
  getForProductDetail,
  getByViewingHistory,
};
