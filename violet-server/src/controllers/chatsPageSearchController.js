const chatsPageSearchService = require("../services/chatsPageSearch/chatsPageSearchService");
const chatsPageSearchHistoryService = require("../services/chatsPageSearch/chatsPageSearchHistoryService");
const { DEFAULT_SEARCH_LIMIT } = require("../chatsPageSearch");
const { asyncHandler } = require("../utils/asyncHandler");

const searchSellers = asyncHandler(async (req, res) => {
  const { q, limit } = req.query;
  const data = await chatsPageSearchService.searchSellers(q, Number(limit) || DEFAULT_SEARCH_LIMIT);
  res.json(data);
});

const getSearchHistory = asyncHandler(async (req, res) => {
  const data = await chatsPageSearchHistoryService.getSearchHistory(req.userId);
  res.json(data);
});

const addSellerToHistory = asyncHandler(async (req, res) => {
  const { sellerId } = req.body || {};
  const data = await chatsPageSearchHistoryService.addSellerToHistory(req.userId, sellerId);
  res.json(data);
});

const removeSellerFromHistory = asyncHandler(async (req, res) => {
  const sellerId = req.params.sellerId || req.body?.sellerId;
  const data = await chatsPageSearchHistoryService.removeSellerFromHistory(req.userId, sellerId);
  res.json(data);
});

module.exports = {
  searchSellers,
  getSearchHistory,
  addSellerToHistory,
  removeSellerFromHistory,
};
