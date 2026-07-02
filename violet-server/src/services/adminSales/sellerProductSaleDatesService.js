const { SellerProductSale } = require("../../models/sellerProductSale");
const { HttpError } = require("../../utils/httpError");
const { toNumber } = require("./salesStatisticsHelpers");
const { backfillSellerProductSalesFromOrders } = require("../../productManagement/recordSellerProductSales");

function pickProductTitle(title) {
  if (!title) return "";
  if (typeof title === "string") return title;
  return title.uz || title.ru || "";
}

function formatSoldAtLabel(date) {
  if (!date) return "Ma'lumot yo'q";

  const dateFormatted = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));

  const timeFormatted = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tashkent",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date));

  const [year, month, day] = dateFormatted.split("-");
  return `${year} yil ${month} oy ${day} kun, ${timeFormatted}`;
}

async function buildSellerProductSaleDates(query = {}) {
  const sellerId = String(query.sellerId || "").trim();
  const productId = Number(query.productId);

  if (!sellerId) {
    throw new HttpError(400, "sellerId talab qilinadi", "SELLER_ID_REQUIRED");
  }
  if (!Number.isFinite(productId)) {
    throw new HttpError(400, "productId talab qilinadi", "PRODUCT_ID_REQUIRED");
  }

  await backfillSellerProductSalesFromOrders();

  const rows = await SellerProductSale.find({
    sellerId,
    productId,
  })
    .select("orderId productId title quantity amount paidAt")
    .sort({ paidAt: -1, orderId: -1 })
    .lean();

  const firstTitle = rows.length ? pickProductTitle(rows[0]?.title) : "";

  return {
    sellerId,
    productId,
    productTitle: firstTitle || `Mahsulot #${productId}`,
    sales: rows.map((row, index) => ({
      rank: index + 1,
      orderId: toNumber(row.orderId, 0),
      quantity: toNumber(row.quantity, 0),
      amount: toNumber(row.amount, 0),
      paidAt: row.paidAt ? new Date(row.paidAt).toISOString() : "",
      soldAtLabel: formatSoldAtLabel(row.paidAt),
    })),
  };
}

module.exports = {
  buildSellerProductSaleDates,
};
