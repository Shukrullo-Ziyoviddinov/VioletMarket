const searchService = require("../../services/search/searchService");
const { asyncHandler } = require("../../utils/asyncHandler");

const search = asyncHandler(async (req, res) => {
  const { q, limit } = req.query;
  const products = await searchService.searchProducts(q, limit);
  let history = null;
  if (req.userId && String(q || "").trim()) {
    history = await searchService.addSearchQuery(req.userId, q);
  }
  res.json({ ok: true, products, ...(history || {}) });
});

const suggestions = asyncHandler(async (req, res) => {
  const { q, limit } = req.query;
  const numLimit = Math.min(Number(limit) || 5, 20);
  const products = await searchService.searchProducts(q, numLimit);
  res.json({ ok: true, products });
});

const getHistory = asyncHandler(async (req, res) => {
  const data = await searchService.getSearchHistory(req.userId);
  res.json({ ok: true, ...data });
});

const addQuery = asyncHandler(async (req, res) => {
  const { query } = req.body || {};
  const data = await searchService.addSearchQuery(req.userId, query);
  res.json({ ok: true, ...data });
});

const removeQuery = asyncHandler(async (req, res) => {
  const { query } = req.body || {};
  const data = await searchService.removeSearchQuery(req.userId, query);
  res.json({ ok: true, ...data });
});

const recommended = asyncHandler(async (req, res) => {
  const data = await searchService.getRecommendedProducts(req.userId);
  res.json({ ok: true, ...data });
});

const recommendedDefault = asyncHandler(async (req, res) => {
  const data = await searchService.getDefaultRecommendedProducts();
  res.json({ ok: true, ...data });
});

module.exports = {
  search,
  suggestions,
  getHistory,
  addQuery,
  removeQuery,
  recommended,
  recommendedDefault,
};
