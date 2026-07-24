const { CourierReturnedOrder } = require("../../models/courierReturnedOrder");
const { Product } = require("../../models/product");
const { BrandCountryFilterValue } = require("../../models/brandCountryFilterValue");
const { CountryCategory } = require("../../models/countryCategory");
const { toNumber } = require("../adminSales/salesStatisticsHelpers");
const {
  PERIOD_LABELS,
  buildScopeLabel,
  buildReturnedPeriodMatch,
  resolveReturnedFilters,
} = require("./sellerReturnedStatisticsCommon");

const COUNTRY_CATEGORY_COLORS = [
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#7c3aed",
  "#b45309",
  "#db2777",
  "#0d9488",
  "#4f46e5",
  "#dc2626",
  "#65a30d",
  "#0891b2",
  "#ea580c",
];

function normalizeFilterToken(value) {
  return String(value || "").trim().toLowerCase();
}

async function loadCountryMetadata() {
  const [filterRows, categoryRows] = await Promise.all([
    BrandCountryFilterValue.find({ type: "country" })
      .select("filterValue")
      .sort({ id: 1 })
      .lean(),
    CountryCategory.find().select("filterValue name").lean(),
  ]);

  const allowedValues = filterRows
    .map((row) => String(row.filterValue || "").trim())
    .filter(Boolean);

  const labelByFilterValue = new Map();
  for (const row of categoryRows) {
    const filterValue = String(row.filterValue || "").trim();
    if (!filterValue) continue;
    const label = String(row?.name?.uz || row?.name?.ru || filterValue).trim();
    labelByFilterValue.set(normalizeFilterToken(filterValue), label);
  }

  return {
    allowedTokens: new Set(allowedValues.map((value) => normalizeFilterToken(value))),
    labelByFilterValue,
    filterRows,
  };
}

function resolveCountriesCategoriesValue(rawValue, countryFilterRows) {
  const token = normalizeFilterToken(rawValue);
  if (!token) return "";
  const matched = countryFilterRows.find(
    (row) => normalizeFilterToken(row.filterValue) === token,
  );
  return matched
    ? String(matched.filterValue || "").trim()
    : String(rawValue || "").trim();
}

function buildCountryCategoryRows(rows, totalQuantity, metadata) {
  return rows
    .map((row, index) => {
      const filterValue = String(row._id || "").trim();
      const token = normalizeFilterToken(filterValue);
      if (!metadata.allowedTokens.has(token)) return null;
      return {
        filterValue,
        label: metadata.labelByFilterValue.get(token) || filterValue,
        quantity: toNumber(row.totalQuantity, 0),
        percentage:
          totalQuantity > 0
            ? Math.round((toNumber(row.totalQuantity, 0) / totalQuantity) * 1000) / 10
            : 0,
        color: COUNTRY_CATEGORY_COLORS[index % COUNTRY_CATEGORY_COLORS.length],
      };
    })
    .filter((item) => item && item.filterValue && item.quantity > 0);
}

async function buildSellerCountryCategoryReturnedStatistics(sellerId, query = {}) {
  const { filters, period } = await resolveReturnedFilters(sellerId, query);
  const match = buildReturnedPeriodMatch(sellerId, period, filters);
  const metadata = await loadCountryMetadata();

  const productRows = await CourierReturnedOrder.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$productId",
        totalQuantity: { $sum: "$quantity" },
      },
    },
  ]);

  const productIds = productRows.map((row) => Number(row._id)).filter(Number.isFinite);
  const countriesCategoriesByProductId = new Map();
  if (productIds.length) {
    const products = await Product.find({ id: { $in: productIds } })
      .select("id countriesCategories")
      .lean();
    for (const product of products) {
      const value = resolveCountriesCategoriesValue(
        product.countriesCategories,
        metadata.filterRows,
      );
      if (value) {
        countriesCategoriesByProductId.set(Number(product.id), value);
      }
    }
  }

  const countryTotals = new Map();
  for (const row of productRows) {
    const productId = Number(row._id);
    const countriesCategories = countriesCategoriesByProductId.get(productId);
    if (!countriesCategories) continue;
    const quantity = toNumber(row.totalQuantity, 0);
    countryTotals.set(
      countriesCategories,
      (countryTotals.get(countriesCategories) || 0) + quantity,
    );
  }

  const groupedRows = [...countryTotals.entries()]
    .map(([countriesCategories, totalQuantity]) => ({
      _id: countriesCategories,
      totalQuantity,
    }))
    .sort(
      (a, b) =>
        b.totalQuantity - a.totalQuantity || String(a._id).localeCompare(String(b._id)),
    );

  const totalQuantity = groupedRows.reduce(
    (sum, row) => sum + toNumber(row.totalQuantity, 0),
    0,
  );

  return {
    period,
    periodLabel: PERIOD_LABELS[period] || PERIOD_LABELS.day,
    scopeLabel: buildScopeLabel(period, filters),
    filters,
    totalQuantity,
    countries: buildCountryCategoryRows(groupedRows, totalQuantity, metadata),
  };
}

module.exports = {
  buildSellerCountryCategoryReturnedStatistics,
};
