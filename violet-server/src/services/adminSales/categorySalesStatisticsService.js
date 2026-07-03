const { SellerProductSale } = require("../../models/sellerProductSale");
const { Product } = require("../../models/product");
const { toNumber } = require("./salesStatisticsHelpers");
const { resolveSelectedFilters, buildSalesFilterOptions } = require("./salesFilterOptionsService");
const { backfillSellerProductSalesFromOrders } = require("../../productManagement/recordSellerProductSales");
const { parseMonthKey } = require("../../utils/customerStatisticsDate");

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
];

const MAX_VISIBLE_CATEGORIES = 4;
const OTHER_CATEGORY_LABEL = "Boshqa";

function formatMonthLabel(monthKey) {
  const { year, month } = parseMonthKey(monthKey);
  const monthLabel = MONTH_LABELS_UZ[Math.max(0, Math.min(11, month - 1))] || "";
  return `${monthLabel} ${year}`.trim();
}

function normalizeCategoryLabel(value) {
  const label = String(value || "").trim();
  return label || OTHER_CATEGORY_LABEL;
}

function buildCategoryRows(categoryTotals, totalQuantity) {
  const sorted = [...categoryTotals.entries()]
    .map(([category, quantity]) => ({
      category,
      quantity: toNumber(quantity, 0),
    }))
    .filter((item) => item.quantity > 0)
    .sort((left, right) => right.quantity - left.quantity || left.category.localeCompare(right.category, "uz"));

  if (!sorted.length) {
    return [];
  }

  const visible = sorted.slice(0, MAX_VISIBLE_CATEGORIES);
  const hidden = sorted.slice(MAX_VISIBLE_CATEGORIES);

  if (hidden.length) {
    const otherQuantity = hidden.reduce((sum, item) => sum + item.quantity, 0);
    const existingOther = visible.find((item) => item.category === OTHER_CATEGORY_LABEL);

    if (existingOther) {
      existingOther.quantity += otherQuantity;
    } else {
      visible.push({
        category: OTHER_CATEGORY_LABEL,
        quantity: otherQuantity,
      });
    }
  }

  return visible.map((item, index) => ({
    category: item.category,
    quantity: item.quantity,
    percentage: totalQuantity > 0
      ? Math.round((item.quantity / totalQuantity) * 1000) / 10
      : 0,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }));
}

async function buildCategorySalesStatistics(query = {}) {
  await backfillSellerProductSalesFromOrders();

  const filterOptions = await buildSalesFilterOptions();
  const filters = resolveSelectedFilters(query, filterOptions);
  const monthKey = String(filters.month || "");

  const rows = await SellerProductSale.aggregate([
    {
      $match: {
        productId: { $gt: 0 },
        monthKey,
      },
    },
    {
      $group: {
        _id: "$productId",
        totalQuantity: { $sum: "$quantity" },
      },
    },
  ]);

  const productIds = rows
    .map((row) => Number(row._id))
    .filter((id) => Number.isFinite(id));

  const products = productIds.length
    ? await Product.find({ id: { $in: productIds } })
      .select("id category")
      .lean()
    : [];

  const categoryByProductId = new Map(
    products.map((product) => [Number(product.id), normalizeCategoryLabel(product.category)]),
  );

  const categoryTotals = new Map();
  let totalQuantity = 0;

  for (const row of rows) {
    const productId = Number(row._id);
    const quantity = toNumber(row.totalQuantity, 0);
    if (quantity <= 0) continue;

    const category = categoryByProductId.get(productId) || OTHER_CATEGORY_LABEL;
    categoryTotals.set(category, (categoryTotals.get(category) || 0) + quantity);
    totalQuantity += quantity;
  }

  return {
    filters,
    periodLabel: formatMonthLabel(monthKey),
    totalQuantity,
    categories: buildCategoryRows(categoryTotals, totalQuantity),
  };
}

module.exports = {
  buildCategorySalesStatistics,
};
