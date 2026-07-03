const { CountryCategoryProductSale } = require("../models/countryCategoryProductSale");
const { BrandCountryFilterValue } = require("../models/brandCountryFilterValue");
const { Product } = require("../models/product");
const { getPeriodKeysFromPaidAt } = require("./recordSellerSales");
const { aggregateOrderProductLines } = require("./recordSellerProductSales");

const PAID_STATUSES = ["paid", "delivered"];

function normalizeFilterToken(value) {
  return String(value || "").trim().toLowerCase();
}

async function loadCountryFilterRows() {
  return BrandCountryFilterValue.find({ type: "country" })
    .select("filterValue")
    .lean();
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

async function loadCountriesCategoriesByProductId(productIds, countryFilterRows) {
  const ids = [...new Set(productIds.filter((id) => Number.isFinite(id)))];
  if (!ids.length) return new Map();

  const products = await Product.find({ id: { $in: ids } })
    .select("id countriesCategories")
    .lean();

  return new Map(
    products.map((product) => [
      Number(product.id),
      resolveCountriesCategoriesValue(product.countriesCategories, countryFilterRows),
    ]),
  );
}

async function recordCountryCategoryProductSalesFromOrder(order) {
  if (!order || !PAID_STATUSES.includes(String(order.status || ""))) {
    return [];
  }

  const paidAt = order.paidAt || order.createdAt;
  if (!paidAt) return [];

  const periodKeys = getPeriodKeysFromPaidAt(paidAt);
  const linesByProductId = aggregateOrderProductLines(order.items);
  if (linesByProductId.size === 0) return [];

  const countryFilterRows = await loadCountryFilterRows();
  const productIds = [...linesByProductId.values()].map((line) => Number(line.productId));
  const countriesCategoriesByProductId = await loadCountriesCategoriesByProductId(
    productIds,
    countryFilterRows,
  );

  const docs = [];
  for (const line of linesByProductId.values()) {
    const productId = Number(line.productId);
    const countriesCategories = countriesCategoriesByProductId.get(productId);
    if (!countriesCategories) continue;

    const row = await CountryCategoryProductSale.findOneAndUpdate(
      {
        orderId: order.id,
        productId,
      },
      {
        $set: {
          countriesCategories,
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

async function backfillCountryCategoryProductSalesFromOrders() {
  const { ensureSalesStatisticsSynced } = require("./salesOrderSyncService");
  return ensureSalesStatisticsSynced();
}

module.exports = {
  recordCountryCategoryProductSalesFromOrder,
  backfillCountryCategoryProductSalesFromOrders,
};
