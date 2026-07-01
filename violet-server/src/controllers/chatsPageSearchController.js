const chatsPageSearchService = require("../services/chatsPageSearch/chatsPageSearchService");
const { DEFAULT_SEARCH_LIMIT } = require("../chatsPageSearch");
const { asyncHandler } = require("../utils/asyncHandler");

const searchSellers = asyncHandler(async (req, res) => {
  const { q, limit } = req.query;
  const data = await chatsPageSearchService.searchSellers(q, Number(limit) || DEFAULT_SEARCH_LIMIT);
  res.json(data);
});

module.exports = {
  searchSellers,
};
