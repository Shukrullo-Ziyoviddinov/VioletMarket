const { BrandCategoryProductSale } = require("../models/brandCategoryProductSale");
const { BrandCountryFilterValue } = require("../models/brandCountryFilterValue");
const { Product } = require("../models/product");
const { Order } = require("../models/order");
const { getPeriodKeysFromPaidAt } = require("./recordSellerSales");
const { aggregateSellerProductLines } = require("./recordSellerProductSales");

const PAID_STATUSES = ["paid", "delivered"];

function normalizeFilterToken(value) {
  return String(value || "").trim().toLowerCase();
}

async function loadBrandFilterRows() {
  return BrandCountryFilterValue.find({ type: "brand" })
    .select("filterValue")
    .lean();
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

async function loadBrandCategoriesByProductId(productIds, brandFilterRows) {
  const ids = [...new Set(productIds.filter((id) => Number.isFinite(id)))];
  if (!ids.length) return new Map();

  const products = await Product.find({ id: { $in: ids } })
    .select("id brandCategories")
    .lean();

  return new Map(
    products.map((product) => [
      Number(product.id),
      resolveBrandCategoriesValue(product.brandCategories, brandFilterRows),
    ]),
  );
}

async function recordBrandCategoryProductSalesFromOrder(order) {
  if (!order || !PAID_STATUSES.includes(String(order.status || ""))) {
    return [];
  }

  const paidAt = order.paidAt || order.createdAt;
  if (!paidAt) return [];

  const periodKeys = getPeriodKeysFromPaidAt(paidAt);
  const linesByKey = aggregateSellerProductLines(order.items);
  if (linesByKey.size === 0) return [];

  const brandFilterRows = await loadBrandFilterRows();
  const productIds = [...linesByKey.values()].map((line) => Number(line.productId));
  const brandCategoriesByProductId = await loadBrandCategoriesByProductId(
    productIds,
    brandFilterRows,
  );

  const docs = [];
  for (const line of linesByKey.values()) {
    const productId = Number(line.productId);
    const brandCategories = brandCategoriesByProductId.get(productId);
    if (!brandCategories) continue;

    const row = await BrandCategoryProductSale.findOneAndUpdate(
      {
        orderId: order.id,
        productId,
      },
      {
        $set: {
          brandCategories,
          quantity: line.quantity,
          amount: line.amount,
          paidAt,
          dateKey: periodKeys.dateKey,
          weekKey: periodKeys.weekKey,
          monthKey: periodKeys.monthKey,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
    docs.push(row);
  }

  return docs;
}

async function backfillBrandCategoryProductSalesFromOrders() {
  const existingCount = await BrandCategoryProductSale.countDocuments();
  if (existingCount > 0) return existingCount;

  const orders = await Order.find({
    status: { $in: PAID_STATUSES },
    paidAt: { $ne: null },
  })
    .select("id items status paidAt createdAt")
    .lean();

  let created = 0;
  for (const order of orders) {
    const rows = await recordBrandCategoryProductSalesFromOrder(order);
    created += rows.length;
  }

  return created;
}

module.exports = {
  recordBrandCategoryProductSalesFromOrder,
  backfillBrandCategoryProductSalesFromOrders,
};
