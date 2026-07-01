const {
  DEFAULT_SEARCH_LIMIT,
  searchSellersFromDatabase,
  mapSellerSearchResultForClient,
} = require("../../chatsPageSearch");

async function searchSellers(query, limit = DEFAULT_SEARCH_LIMIT) {
  const rows = await searchSellersFromDatabase({
    query,
    limit: Math.max(1, Number(limit) || DEFAULT_SEARCH_LIMIT),
    onlyActive: true,
  });

  return {
    items: rows.map(mapSellerSearchResultForClient),
  };
}

module.exports = {
  searchSellers,
};
