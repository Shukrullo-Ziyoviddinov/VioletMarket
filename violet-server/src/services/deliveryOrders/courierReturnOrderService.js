const {
  resolveStoredPaymentMethod,
} = require("../../productManagement/paymentMethods");
const {
  getStatisticsDateKey,
  getTashkentYmd,
  getIsoWeekFromYmd,
} = require("../../utils/customerStatisticsDate");
const { formatWeekKey } = require("../adminSales/salesStatisticsHelpers");

/**
 * Kuryer uchun: online (payme/click) = to‘langan.
 * Naqd (on_delivery) = hali olinmagan — status "paid" bo‘lsa ham.
 */
function isOrderPaid(order) {
  if (!order) return false;
  const method = resolveStoredPaymentMethod(order.paymentMethod);
  if (method === "on_delivery") return false;
  if (method === "payme" || method === "click") return true;

  const status = String(order.status || "");
  if (status === "paid" || status === "delivered") return true;
  return Boolean(order.paidAt);
}

function resolvePeriodKeys(date = new Date()) {
  const dateKey = getStatisticsDateKey(date);
  const { year, month, day } = getTashkentYmd(date);
  const { isoYear, week } = getIsoWeekFromYmd(year, month, day);
  return {
    dateKey,
    weekKey: formatWeekKey(isoYear, week),
    monthKey: `${year}-${String(month).padStart(2, "0")}`,
  };
}

function toPublicReturnedOrder(doc) {
  if (!doc) return null;
  const row = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(row._id),
    assignmentId: String(row.assignmentId || ""),
    orderId: Number(row.orderId) || 0,
    itemIndex: Number(row.itemIndex) || 0,
    unitIndex: Number(row.unitIndex) || 0,
    productId: Number(row.productId) || 0,
    productCode: String(row.productCode || ""),
    sellerId: String(row.sellerId || ""),
    title: {
      uz: String(row.title?.uz || ""),
      ru: String(row.title?.ru || ""),
    },
    amount: Math.max(0, Number(row.amount) || 0),
    quantity: Math.max(1, Number(row.quantity) || 1),
    imageUrl: String(row.imageUrl || ""),
    color: String(row.color || ""),
    size: String(row.size || ""),
    storage: String(row.storage || ""),
    model: String(row.model || ""),
    courier: {
      firstName: String(row.courier?.firstName || ""),
      lastName: String(row.courier?.lastName || ""),
      phone: String(row.courier?.phone || ""),
      email: String(row.courier?.email || ""),
    },
    customer: {
      firstName: String(row.customer?.firstName || ""),
      lastName: String(row.customer?.lastName || ""),
      phone: String(row.customer?.phone || ""),
    },
    reasonType: String(row.reasonType || "return"),
    comment: String(row.comment || ""),
    orderedAt: row.orderedAt || null,
    returnedAt: row.returnedAt || null,
    dateKey: String(row.dateKey || ""),
    weekKey: String(row.weekKey || ""),
    monthKey: String(row.monthKey || ""),
    orderPaymentStatus: String(row.orderPaymentStatus || ""),
    isPaid: Boolean(row.isPaid),
    createdAt: row.createdAt || null,
  };
}

module.exports = {
  toPublicReturnedOrder,
  isOrderPaid,
  resolvePeriodKeys,
};
