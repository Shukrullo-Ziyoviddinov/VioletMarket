const { CourierReturnedOrder } = require("../../models/courierReturnedOrder");
const { Product } = require("../../models/product");
const { MasterCategory } = require("../../models/masterCategory");
const { toNumber } = require("../adminSales/salesStatisticsHelpers");
const { normalizeMasterCategoryDisplayName } = require("../../utils/masterCategoryDisplay");
const {
  PERIOD_LABELS,
  buildScopeLabel,
  buildReturnedPeriodMatch,
  resolveReturnedFilters,
} = require("./sellerReturnedStatisticsCommon");

const UNKNOWN_CATEGORY_LABEL = "Boshqa";

const CATEGORY_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#a16207",
  "#ec4899",
  "#14b8a6",
  "#6366f1",
  "#ef4444",
  "#84cc16",
  "#06b6d4",
  "#f97316",
  "#64748b",
  "#d946ef",
  "#0ea5e9",
  "#65a30d",
  "#c026d3",
  "#ea580c",
  "#0891b2",
];

function normalizeCategoryLabel(value) {
  const label = String(value || "").trim();
  return label || UNKNOWN_CATEGORY_LABEL;
}

function buildCategoryRows(rows, totalQuantity, masterCategoryByName) {
  return rows
    .map((row, index) => {
      const category = String(row._id || "").trim();
      const masterMeta = masterCategoryByName.get(category);
      const displayName =
        masterMeta?.displayName ||
        normalizeMasterCategoryDisplayName(null, { uz: category });

      return {
        category,
        displayName,
        masterCategoryId: masterMeta?.id ?? null,
        quantity: toNumber(row.totalQuantity, 0),
        percentage:
          totalQuantity > 0
            ? Math.round((toNumber(row.totalQuantity, 0) / totalQuantity) * 1000) / 10
            : 0,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      };
    })
    .filter((item) => item.category && item.quantity > 0);
}

async function loadMasterCategoryLookupByUzName() {
  const rows = await MasterCategory.find()
    .select({ id: 1, name: 1, displayName: 1 })
    .lean();

  const masterCategoryByName = new Map();
  for (const row of rows) {
    const uzName = String(row?.name?.uz || "").trim();
    if (!uzName) continue;
    masterCategoryByName.set(uzName, {
      id: row.id,
      displayName: normalizeMasterCategoryDisplayName(row.displayName, row.name),
    });
  }
  return masterCategoryByName;
}

async function buildSellerCategoryReturnedStatistics(sellerId, query = {}) {
  const { filters, period } = await resolveReturnedFilters(sellerId, query);
  const match = buildReturnedPeriodMatch(sellerId, period, filters);

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

  const categoryByProductId = new Map();
  if (productIds.length) {
    const products = await Product.find({ id: { $in: productIds } })
      .select("id category")
      .lean();
    for (const product of products) {
      categoryByProductId.set(Number(product.id), normalizeCategoryLabel(product.category));
    }
  }

  const categoryTotals = new Map();
  for (const row of productRows) {
    const productId = Number(row._id);
    const category = categoryByProductId.get(productId) || UNKNOWN_CATEGORY_LABEL;
    const quantity = toNumber(row.totalQuantity, 0);
    categoryTotals.set(category, (categoryTotals.get(category) || 0) + quantity);
  }

  const groupedRows = [...categoryTotals.entries()]
    .map(([category, totalQuantity]) => ({ _id: category, totalQuantity }))
    .sort(
      (a, b) =>
        b.totalQuantity - a.totalQuantity || String(a._id).localeCompare(String(b._id)),
    );

  const totalQuantity = groupedRows.reduce(
    (sum, row) => sum + toNumber(row.totalQuantity, 0),
    0,
  );
  const masterCategoryByName = await loadMasterCategoryLookupByUzName();

  return {
    period,
    periodLabel: PERIOD_LABELS[period] || PERIOD_LABELS.day,
    scopeLabel: buildScopeLabel(period, filters),
    filters,
    totalQuantity,
    categories: buildCategoryRows(groupedRows, totalQuantity, masterCategoryByName),
  };
}

module.exports = {
  buildSellerCategoryReturnedStatistics,
};
