const { HttpError } = require("../../utils/httpError");

/** Home grid + load-more bo‘limlari (productCatalog categoryName) */
const HOME_COLLECTION_NAMES = new Set([
  "products",
  "engArzonlare",
  "trendingItems",
  "electronicsCollection",
  "stationeryCollection",
  "accessoriesCollection",
  "vitaminsHealthCollection",
  "travelGearCollection",
]);

function parseCategoryName(raw) {
  const categoryName = String(raw ?? "").trim();
  if (!HOME_COLLECTION_NAMES.has(categoryName)) {
    throw new HttpError(400, "Bo‘lim nomi noto'g'ri", "INVALID_COLLECTION");
  }
  return categoryName;
}

module.exports = {
  HOME_COLLECTION_NAMES,
  parseCategoryName,
};
