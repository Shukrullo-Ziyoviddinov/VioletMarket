const mongoose = require("mongoose");
const { Product } = require("../../models/product");
const { SearchBarHistory } = require("../../models/searchBarHistory");
const { HttpError } = require("../../utils/httpError");
const {
  filterProductsBySearch,
  getSimilarRecommended,
  getDefaultRecommended,
} = require("../../utils/searchAlgorithm");
const { filterProductsActiveOnClient } = require("../../utils/productClientVisibility");

function toUserObjectId(userId) {
  if (userId instanceof mongoose.Types.ObjectId) return userId;
  return new mongoose.Types.ObjectId(String(userId));
}

const MAX_QUERY_HISTORY = 15;

async function loadAllProducts() {
  return filterProductsActiveOnClient(await Product.find().lean());
}

async function searchProducts(rawQuery, limit) {
  const q = (rawQuery || "").trim();
  if (!q) return [];
  const products = await loadAllProducts();
  const numLimit = limit ? Number(limit) : 0;
  return filterProductsBySearch(products, q, numLimit > 0 ? numLimit : undefined);
}

async function getSearchHistory(userId) {
  const uid = toUserObjectId(userId);
  const rows = await SearchBarHistory.find({ userId: uid, type: "query" })
    .sort({ updatedAt: -1 })
    .limit(MAX_QUERY_HISTORY)
    .lean();

  return {
    queries: rows.map((r) => r.query).filter(Boolean),
  };
}

async function trimHistory(userId, type, max) {
  const uid = toUserObjectId(userId);
  const rows = await SearchBarHistory.find({ userId: uid, type })
    .sort({ updatedAt: -1 })
    .skip(max)
    .select("_id")
    .lean();
  if (rows.length === 0) return;
  await SearchBarHistory.deleteMany({
    _id: { $in: rows.map((r) => r._id) },
  });
}

async function addSearchQuery(userId, rawQuery) {
  const query = (rawQuery || "").trim();
  if (!query) {
    throw new HttpError(400, "Qidiruv so'rovi bo'sh", "EMPTY_QUERY");
  }

  const uid = toUserObjectId(userId);
  await SearchBarHistory.deleteOne({ userId: uid, type: "query", query });
  await SearchBarHistory.create({
    userId: uid,
    type: "query",
    query,
  });

  await trimHistory(userId, "query", MAX_QUERY_HISTORY);
  return getSearchHistory(userId);
}

async function removeSearchQuery(userId, rawQuery) {
  const query = (rawQuery || "").trim();
  const uid = toUserObjectId(userId);
  await SearchBarHistory.deleteOne({ userId: uid, type: "query", query });
  return getSearchHistory(userId);
}

async function getRecommendedProducts(userId) {
  const products = await loadAllProducts();
  const { queries } = await getSearchHistory(userId);
  const recommended = getSimilarRecommended(products, queries);
  return { products: recommended, queries };
}

async function getDefaultRecommendedProducts() {
  const products = await loadAllProducts();
  return {
    products: getDefaultRecommended(products),
    queries: [],
  };
}

module.exports = {
  searchProducts,
  getSearchHistory,
  addSearchQuery,
  removeSearchQuery,
  getRecommendedProducts,
  getDefaultRecommendedProducts,
};
