const { Order } = require("../models/order");
const { User } = require("../models/user");
const { HttpError } = require("../utils/httpError");
const { toNumber } = require("../services/adminSales/salesStatisticsHelpers");

const VALID_PAYMENT_METHODS = new Set(["payme", "click", "on_delivery", "mock"]);
const DEFAULT_PAGE_SIZE = 20;

function cleanSellerId(value) {
  return String(value || "").trim();
}

function normalizePaymentMethod(raw) {
  const method = String(raw || "").trim().toLowerCase();
  if (!method) return "mock";
  if (!VALID_PAYMENT_METHODS.has(method)) {
    throw new HttpError(400, "To'lov usuli noto'g'ri", "VALIDATION_ERROR");
  }
  return method;
}

function formatOrderCode(orderId) {
  const id = Math.max(0, Math.floor(toNumber(orderId, 0)));
  return `#${String(id).padStart(4, "0")}`;
}

function formatProductCode(productId) {
  const id = Math.max(0, Math.floor(toNumber(productId, 0)));
  if (!id) return "";
  return `#${String(id).padStart(4, "0")}`;
}

function resolveTitle(title) {
  if (title && typeof title === "object") {
    return {
      uz: String(title.uz || "").trim(),
      ru: String(title.ru || "").trim(),
    };
  }
  const text = String(title || "").trim();
  return { uz: text, ru: text };
}

function mapSellerOrderItems(items, sellerId) {
  return (Array.isArray(items) ? items : [])
    .filter((item) => cleanSellerId(item?.sellerId) === sellerId)
    .map((item) => {
      const productId = Math.max(0, Math.floor(toNumber(item?.productId, 0)));
      const quantity = Math.max(1, Math.floor(toNumber(item?.quantity, 1)));
      const price = Math.max(0, toNumber(item?.price, 0));
      const lineTotal = Math.max(0, toNumber(item?.lineTotal, price * quantity));

      return {
        productId,
        productCode: formatProductCode(productId),
        title: resolveTitle(item?.title),
        image: String(item?.image || "/img/no-image.png"),
        quantity,
        price,
        lineTotal,
      };
    });
}

function buildSellerOrderCard(order, user, sellerId) {
  const sellerItems = mapSellerOrderItems(order?.items, sellerId);
  const amount = sellerItems.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);
  const orderedAt = order?.paidAt || order?.createdAt || null;

  return {
    id: Number(order?.id) || 0,
    orderCode: formatOrderCode(order?.id),
    orderedAt,
    buyer: {
      firstName: String(user?.firstName || "").trim(),
      lastName: String(user?.lastName || "").trim(),
    },
    paymentMethod: String(order?.paymentMethod || "mock").trim() || "mock",
    status: String(order?.status || "paid"),
    amount,
    productCodes: sellerItems.map((item) => item.productCode).filter(Boolean),
    items: sellerItems,
  };
}

/**
 * Seller admin "Buyurtmalar" sahifasi uchun — faqat shu sellerga tegishli buyurtmalar.
 */
async function listSellerOrders(sellerId, query = {}) {
  const normalizedSellerId = cleanSellerId(sellerId);
  if (!normalizedSellerId) {
    throw new HttpError(400, "Seller ID topilmadi", "VALIDATION_ERROR");
  }

  const page = Math.max(1, Math.floor(toNumber(query.page, 1)));
  const limit = Math.min(50, Math.max(1, Math.floor(toNumber(query.limit, DEFAULT_PAGE_SIZE))));

  const match = { "items.sellerId": normalizedSellerId };

  const [total, rows] = await Promise.all([
    Order.countDocuments(match),
    Order.find(match)
      .sort({ paidAt: -1, createdAt: -1, id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  const userIds = [...new Set(rows.map((row) => String(row.userId || "")).filter(Boolean))];
  const users = userIds.length
    ? await User.find({ _id: { $in: userIds } })
        .select({ firstName: 1, lastName: 1 })
        .lean()
    : [];
  const userById = new Map(users.map((row) => [String(row._id), row]));

  const orders = rows
    .map((row) => buildSellerOrderCard(row, userById.get(String(row.userId)), normalizedSellerId))
    .filter((row) => row.items.length > 0);

  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    orders,
  };
}

module.exports = {
  VALID_PAYMENT_METHODS,
  normalizePaymentMethod,
  formatOrderCode,
  formatProductCode,
  buildSellerOrderCard,
  listSellerOrders,
};
