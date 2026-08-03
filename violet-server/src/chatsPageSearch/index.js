const {
  DEFAULT_SEARCH_LIMIT,
  MIN_QUERY_LENGTH,
  searchSellersFromDatabase,
  enrichSellersByIds,
  mapSellerSearchResultForClient,
  scoreSellerNameMatch,
  stringsFuzzyMatch,
} = require("./chatsPageSearchAlgorithm");

module.exports = {
  DEFAULT_SEARCH_LIMIT,
  MIN_QUERY_LENGTH,
  searchSellersFromDatabase,
  enrichSellersByIds,
  mapSellerSearchResultForClient,
  scoreSellerNameMatch,
  stringsFuzzyMatch,
};
