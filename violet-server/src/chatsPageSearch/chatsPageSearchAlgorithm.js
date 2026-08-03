const { SellerAccount } = require("../models/sellerAccount");
const { SellerRatingSummary } = require("../models/sellerRatingSummary");
const { Product } = require("../models/product");
const {
  getLocalizedText,
  normalizeForSearch,
  getTokens,
  tokensMatch,
  levenshteinDistance,
  textContainsRelevantSubstring,
} = require("../utils/searchAlgorithm");

const DEFAULT_SEARCH_LIMIT = 20;
const MIN_QUERY_LENGTH = 2;

function toNonNegativeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function clampRating(value) {
  return Math.max(0, Math.min(5, Number(value) || 0));
}

function buildAverageRatingFromSummary(summaryRow) {
  const totalReviews = toNonNegativeNumber(summaryRow?.totalReviews);
  const ratingSum = toNonNegativeNumber(summaryRow?.ratingSum);
  if (!totalReviews) return 0;
  return Number((ratingSum / totalReviews).toFixed(1));
}

function getSellerSearchableName(seller) {
  return [
    getLocalizedText(seller?.name, "uz"),
    getLocalizedText(seller?.name, "ru"),
    String(seller?.id || ""),
  ]
    .filter(Boolean)
    .join(" ");
}

function buildActiveSellerFilter(onlyActive = true) {
  if (!onlyActive) return {};
  return { status: { $ne: "paused" } };
}

function getSellerQueryTokens(str) {
  return normalizeForSearch(str)
    .split(/\s+/)
    .filter((token) => token.length >= MIN_QUERY_LENGTH);
}

function maxLevenshteinTolerance(len) {
  if (len <= 4) return 1;
  if (len <= 8) return 2;
  if (len <= 14) return 3;
  return Math.max(3, Math.floor(len * 0.28));
}

function stringsFuzzyMatch(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length < MIN_QUERY_LENGTH || b.length < MIN_QUERY_LENGTH) return false;
  if (a.includes(b) || b.includes(a)) return true;

  const distance = levenshteinDistance(a, b);
  const refLen = Math.max(a.length, b.length);
  return distance <= maxLevenshteinTolerance(refLen);
}

function hasFuzzyPrefixOverlap(queryToken, textTokens) {
  if (!queryToken || queryToken.length < 3) return false;

  const prefixes = [];
  for (let len = 3; len <= Math.min(queryToken.length, 6); len += 1) {
    prefixes.push(queryToken.slice(0, len));
  }

  return prefixes.some((prefix) =>
    textTokens.some((textToken) => {
      if (textToken.startsWith(prefix)) return true;
      const head = textToken.slice(0, prefix.length);
      return stringsFuzzyMatch(head, prefix);
    }),
  );
}

function hasFuzzyWindowMatch(compactText, compactQuery) {
  if (!compactText || !compactQuery || compactQuery.length < MIN_QUERY_LENGTH) {
    return false;
  }

  const minWin = Math.max(MIN_QUERY_LENGTH, compactQuery.length - 2);
  const maxWin = Math.min(compactText.length, compactQuery.length + 2);

  for (let win = minWin; win <= maxWin; win += 1) {
    for (let i = 0; i <= compactText.length - win; i += 1) {
      const slice = compactText.slice(i, i + win);
      if (stringsFuzzyMatch(slice, compactQuery)) return true;
    }
  }

  return false;
}

function scoreSingleSellerText(text, query) {
  if (!text || !query) return 0;

  const compactText = text.replace(/\s+/g, "");
  const compactQuery = query.replace(/\s+/g, "");

  if (text === query || compactText === compactQuery) return 100;
  if (text.startsWith(query) || compactText.startsWith(compactQuery)) return 92;
  if (text.includes(query) || compactText.includes(compactQuery)) return 85;

  const words = text.split(/\s+/).filter(Boolean);
  if (words.some((word) => word.startsWith(query))) return 82;
  if (words.some((word) => word.includes(query))) return 78;

  const queryTokens = getSellerQueryTokens(query);
  const textTokens = getSellerQueryTokens(text);

  if (queryTokens.length > 0 && queryTokens.every((token) => text.includes(token))) {
    return 74;
  }

  if (
    queryTokens.some((queryToken) =>
      textTokens.some(
        (textToken) =>
          tokensMatch(queryToken, textToken) || stringsFuzzyMatch(queryToken, textToken),
      ),
    )
  ) {
    return 70;
  }

  if (stringsFuzzyMatch(compactText, compactQuery)) return 68;

  if (hasFuzzyWindowMatch(compactText, compactQuery)) return 66;

  if (queryTokens.some((queryToken) => hasFuzzyPrefixOverlap(queryToken, textTokens))) {
    return 62;
  }

  if (textContainsRelevantSubstring(text, query)) return 58;

  if (
    getTokens(query).some((queryToken) =>
      getTokens(text).some((textToken) => tokensMatch(queryToken, textToken)),
    )
  ) {
    return 56;
  }

  return 0;
}

function scoreSellerNameMatch(seller, rawQuery) {
  const query = normalizeForSearch(rawQuery);
  if (!query || query.length < MIN_QUERY_LENGTH) {
    return 0;
  }

  const variants = [
    normalizeForSearch(getLocalizedText(seller?.name, "uz")),
    normalizeForSearch(getLocalizedText(seller?.name, "ru")),
    normalizeForSearch(String(seller?.id || "")),
    normalizeForSearch(getSellerSearchableName(seller)),
  ].filter(Boolean);

  if (!variants.length) return 0;

  return variants.reduce(
    (best, text) => Math.max(best, scoreSingleSellerText(text, query)),
    0,
  );
}

async function searchSellersFromDatabase({
  query = "",
  limit = DEFAULT_SEARCH_LIMIT,
  onlyActive = true,
} = {}) {
  const trimmedQuery = String(query || "").trim();
  if (trimmedQuery.length < MIN_QUERY_LENGTH) {
    return [];
  }

  const sellerFilter = buildActiveSellerFilter(onlyActive);
  const sellers = await SellerAccount.find(sellerFilter).lean();

  const ranked = sellers
    .map((seller) => ({
      seller,
      score: scoreSellerNameMatch(seller, trimmedQuery),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return getSellerSearchableName(a.seller).localeCompare(
        getSellerSearchableName(b.seller),
        "uz",
      );
    });

  const effectiveLimit = Math.max(1, Number(limit) || DEFAULT_SEARCH_LIMIT);
  const selected = ranked.slice(0, effectiveLimit);
  const sellerIds = selected.map((row) => String(row.seller.id || ""));

  if (!sellerIds.length) {
    return [];
  }

  const metrics = await loadSellerMetricsByIds(sellerIds);

  return selected.map(({ seller, score }) =>
    mapSellerRowForClient({ ...seller, matchScore: score }, metrics),
  );
}

async function loadSellerMetricsByIds(sellerIds = []) {
  const ids = [...new Set(
    (Array.isArray(sellerIds) ? sellerIds : [])
      .map((id) => String(id || "").trim())
      .filter(Boolean),
  )];

  if (!ids.length) {
    return {
      ratingBySellerId: new Map(),
      productCountBySellerId: new Map(),
    };
  }

  const [ratingRows, productCountRows] = await Promise.all([
    SellerRatingSummary.find({ sellerId: { $in: ids } }).lean(),
    Product.aggregate([
      { $match: { sellerId: { $in: ids } } },
      { $group: { _id: "$sellerId", productCount: { $sum: 1 } } },
    ]),
  ]);

  return {
    ratingBySellerId: new Map(
      ratingRows.map((row) => [String(row.sellerId || ""), row]),
    ),
    productCountBySellerId: new Map(
      productCountRows.map((row) => [String(row._id || ""), toNonNegativeNumber(row.productCount)]),
    ),
  };
}

function mapSellerRowForClient(seller, metrics = {}) {
  const sellerId = String(seller.id || seller.sellerId || "");
  const summary = metrics.ratingBySellerId?.get(sellerId);

  return {
    sellerId,
    name: seller.name,
    logo: seller.logo,
    productCount: metrics.productCountBySellerId?.get(sellerId) || 0,
    averageRating: buildAverageRatingFromSummary(summary),
    totalReviews: toNonNegativeNumber(summary?.totalReviews),
    matchScore: seller.matchScore,
  };
}

async function enrichSellersByIds(sellerIds = []) {
  const ids = [...new Set(
    (Array.isArray(sellerIds) ? sellerIds : [])
      .map((id) => String(id || "").trim())
      .filter(Boolean),
  )];

  if (!ids.length) return [];

  const sellers = await SellerAccount.find({
    ...buildActiveSellerFilter(true),
    id: { $in: ids },
  }).lean();

  const sellerById = new Map(sellers.map((seller) => [String(seller.id || ""), seller]));
  const orderedSellers = ids.map((id) => sellerById.get(id)).filter(Boolean);
  const metrics = await loadSellerMetricsByIds(orderedSellers.map((seller) => seller.id));

  return orderedSellers.map((seller) => mapSellerRowForClient(seller, metrics));
}

function mapSellerSearchResultForClient(row) {
  return {
    id: row.sellerId,
    sellerId: row.sellerId,
    name: row.name,
    logo: row.logo,
    productCount: toNonNegativeNumber(row.productCount),
    averageRating: clampRating(row.averageRating),
    totalReviews: toNonNegativeNumber(row.totalReviews),
    matchScore: row.matchScore,
  };
}

module.exports = {
  DEFAULT_SEARCH_LIMIT,
  MIN_QUERY_LENGTH,
  searchSellersFromDatabase,
  enrichSellersByIds,
  mapSellerSearchResultForClient,
  scoreSellerNameMatch,
  stringsFuzzyMatch,
};
