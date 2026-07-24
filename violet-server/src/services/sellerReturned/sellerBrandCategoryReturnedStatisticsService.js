const { CourierReturnedOrder } = require("../../models/courierReturnedOrder");
const { Product } = require("../../models/product");
const { BrandCountryFilterValue } = require("../../models/brandCountryFilterValue");
const { BrandCategory } = require("../../models/brandCategory");
const { toNumber } = require("../adminSales/salesStatisticsHelpers");
const {
  PERIOD_LABELS,
  buildScopeLabel,
  buildReturnedPeriodMatch,
  resolveReturnedFilters,
} = require("./sellerReturnedStatisticsCommon");

const BRAND_CATEGORY_COLORS = [
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

async function loadBrandMetadata() {
  const [filterRows, categoryRows] = await Promise.all([
    BrandCountryFilterValue.find({ type: "brand" })
      .select("filterValue")
      .sort({ id: 1 })
      .lean(),
    BrandCategory.find().select("filterValue name").lean(),
  ]);

  const allowedValues = filterRows
    .map((row) => String(row.filterValue || "").trim())
    .filter(Boolean);

  const labelByFilterValue = new Map();
  for (const row of categoryRows) {
    const filterValue = String(row.filterValue || "").trim();
    if (!filterValue) continue;
    const label = String(row?.name || filterValue).trim();
    labelByFilterValue.set(normalizeFilterToken(filterValue), label);
  }

  return {
    allowedTokens: new Set(allowedValues.map((value) => normalizeFilterToken(value))),
    labelByFilterValue,
    filterRows,
  };
}

function resolveBrandCategoriesValue(rawValue, brandFilterRows) {
  const token = normalizeFilterToken(rawValue);
  if (!token) return "";
  const matched = brandFilterRows.find(
    (row) => normalizeFilterToken(row.filterValue) === token,
  );
  return matched
    ? String(matched.filterValue || "").trim()
    : String(rawValue || "").trim();
}

function buildBrandCategoryRows(rows, totalQuantity, metadata) {
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
        color: BRAND_CATEGORY_COLORS[index % BRAND_CATEGORY_COLORS.length],
      };
    })
    .filter((item) => item && item.filterValue && item.quantity > 0);
}

async function buildSellerBrandCategoryReturnedStatistics(sellerId, query = {}) {
  const { filters, period } = await resolveReturnedFilters(sellerId, query);
  const match = buildReturnedPeriodMatch(sellerId, period, filters);
  const metadata = await loadBrandMetadata();

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
  const brandCategoriesByProductId = new Map();
  if (productIds.length) {
    const products = await Product.find({ id: { $in: productIds } })
      .select("id brandCategories")
      .lean();
    for (const product of products) {
      const value = resolveBrandCategoriesValue(product.brandCategories, metadata.filterRows);
      if (value) {
        brandCategoriesByProductId.set(Number(product.id), value);
      }
    }
  }

  const brandTotals = new Map();
  for (const row of productRows) {
    const productId = Number(row._id);
    const brandCategories = brandCategoriesByProductId.get(productId);
    if (!brandCategories) continue;
    const quantity = toNumber(row.totalQuantity, 0);
    brandTotals.set(
      brandCategories,
      (brandTotals.get(brandCategories) || 0) + quantity,
    );
  }

  const groupedRows = [...brandTotals.entries()]
    .map(([brandCategories, totalQuantity]) => ({
      _id: brandCategories,
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
    brands: buildBrandCategoryRows(groupedRows, totalQuantity, metadata),
  };
}

module.exports = {
  buildSellerBrandCategoryReturnedStatistics,
};
