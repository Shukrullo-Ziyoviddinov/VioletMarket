const { SellerProductSale } = require("../../models/sellerProductSale");
const { Product } = require("../../models/product");
const { toNumber } = require("../adminSales/salesStatisticsHelpers");
const { resolveSelectedFilters } = require("../adminSales/salesFilterOptionsService");
const { buildSellerSalesFilterOptions } = require("./sellerSalesStatisticsService");
const { ensureSalesStatisticsSynced } = require("../../productManagement/salesOrderSyncService");
const {
  addDaysToDateKey,
  getIsoWeekStart,
  parseMonthKey,
} = require("../../utils/customerStatisticsDate");

const UNKNOWN_CATEGORY_LABEL = "Boshqa";

const PERIOD_LABELS = {
  day: "Kunlik",
  week: "Haftalik",
  month: "Oylik",
};

const MONTH_LABELS_UZ = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];

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

function resolvePeriod(raw) {
  const period = String(raw || "day").trim();
  if (period === "week" || period === "month") return period;
  return "day";
}

function normalizeCategoryLabel(value) {
  const label = String(value || "").trim();
  return label || UNKNOWN_CATEGORY_LABEL;
}

function buildPeriodMatch(sellerId, period, filters) {
  const match = {
    sellerId: String(sellerId),
    productId: { $gt: 0 },
  };

  if (period === "week") {
    match.weekKey = String(filters.week || "");
  } else if (period === "month") {
    match.monthKey = String(filters.month || "");
  } else {
    match.dateKey = String(filters.day || "");
  }

  return match;
}

function formatDayLabel(dateKey) {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  const monthLabel = MONTH_LABELS_UZ[Math.max(0, Math.min(11, month - 1))] || "";
  return `${day} ${monthLabel} ${year}`.trim();
}

function formatMonthLabel(monthKey) {
  const { year, month } = parseMonthKey(monthKey);
  const monthLabel = MONTH_LABELS_UZ[Math.max(0, Math.min(11, month - 1))] || "";
  return `${monthLabel} ${year}`;
}

function formatWeekLabel(weekKey) {
  const raw = String(weekKey || "");
  const match = /^(\d{4})-W(\d{1,2})$/.exec(raw);
  if (!match) return raw;

  const isoYear = Number(match[1]);
  const week = Number(match[2]);
  const weekStartKey = getIsoWeekStart(isoYear, week);
  const weekEndKey = addDaysToDateKey(weekStartKey, 6);
  const startLabel = formatDayLabel(weekStartKey).replace(/\s\d{4}$/, "");
  const endLabel = formatDayLabel(weekEndKey);
  return `${startLabel} - ${endLabel}`;
}

function buildScopeLabel(period, filters) {
  if (period === "week") {
    return formatWeekLabel(filters.week);
  }
  if (period === "month") {
    return formatMonthLabel(filters.month);
  }
  return formatDayLabel(filters.day);
}

function buildCategoryRows(rows, totalQuantity) {
  return rows
    .map((row, index) => ({
      category: String(row._id || "").trim(),
      quantity: toNumber(row.totalQuantity, 0),
      percentage: totalQuantity > 0
        ? Math.round((toNumber(row.totalQuantity, 0) / totalQuantity) * 1000) / 10
        : 0,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }))
    .filter((item) => item.category && item.quantity > 0);
}

async function buildSellerCategorySalesStatistics(sellerId, query = {}) {
  await ensureSalesStatisticsSynced();

  const filterOptions = await buildSellerSalesFilterOptions(sellerId);
  const filters = resolveSelectedFilters(query, filterOptions);
  const period = resolvePeriod(query.period);
  const match = buildPeriodMatch(sellerId, period, filters);

  const productRows = await SellerProductSale.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$productId",
        totalQuantity: { $sum: "$quantity" },
      },
    },
  ]);

  const productIds = productRows
    .map((row) => Number(row._id))
    .filter(Number.isFinite);

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
    .sort((a, b) => b.totalQuantity - a.totalQuantity || String(a._id).localeCompare(String(b._id)));

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
    categories: buildCategoryRows(groupedRows, totalQuantity),
  };
}

module.exports = {
  buildSellerCategorySalesStatistics,
};
