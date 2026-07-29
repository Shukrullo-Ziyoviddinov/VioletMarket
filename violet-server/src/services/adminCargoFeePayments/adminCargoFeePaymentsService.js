/**
 * Asosiy admin — cargo yetkazish summasi so‘rovlari (mijoz to‘lovi tasdiqi).
 * Qoida: productManagement/foreignCargoFeePayment.js
 */

const mongoose = require("mongoose");
const { CargoShipment } = require("../../models/cargoShipment");
const { SellerAccount } = require("../../models/sellerAccount");
const { LogisticaProfile } = require("../../models/logisticaProfile");
const { HttpError } = require("../../utils/httpError");
const { toNumber } = require("../adminSales/salesStatisticsHelpers");
const { resolvePublicAssetUrl } = require("../../utils/resolvePublicAssetUrl");
const {
  buildAdminCargoFeeListMatch,
  applyAdminCargoFeeConfirm,
  toCargoFeePaymentView,
} = require("../../productManagement/foreignCargoFeePayment");
const {
  normalizeCargoCountry,
} = require("../../utils/cargoCountryNormalize");

const DEFAULT_PAGE_SIZE = 50;

function pickSellerName(account) {
  if (!account?.name) return "";
  if (typeof account.name === "string") return account.name;
  return String(account.name.uz || account.name.ru || "").trim();
}

function resolveProductTitle(title) {
  if (title && typeof title === "object") {
    return String(title.uz || title.ru || "").trim() || "Mahsulot";
  }
  return String(title || "").trim() || "Mahsulot";
}

async function loadSellerMap(sellerIds = []) {
  const ids = [...new Set(sellerIds.map((id) => String(id || "").trim()).filter(Boolean))];
  if (!ids.length) return new Map();
  const rows = await SellerAccount.find({ id: { $in: ids } })
    .select("id name sellerCountry")
    .lean();
  return new Map(
    rows.map((row) => [
      String(row.id),
      {
        id: String(row.id),
        name: pickSellerName(row) || String(row.id),
        sellerCountry: String(row.sellerCountry || ""),
      },
    ]),
  );
}

async function loadLogisticaMap(logisticaIds = []) {
  const ids = [
    ...new Set(
      logisticaIds
        .map((id) => String(id || "").trim())
        .filter((id) => mongoose.isValidObjectId(id)),
    ),
  ];
  if (!ids.length) return new Map();
  const rows = await LogisticaProfile.find({ _id: { $in: ids } })
    .select({ companyName: 1 })
    .lean();
  return new Map(
    rows.map((row) => [
      String(row._id),
      { companyName: String(row.companyName || "") },
    ]),
  );
}

function toAdminCargoFeeCard(row, sellerMap, logisticaMap) {
  const sellerId = String(row.sellerId || "");
  const seller = sellerMap.get(sellerId);
  const logisticaId = row.logisticaId ? String(row.logisticaId) : "";
  const logistica = logisticaId ? logisticaMap.get(logisticaId) : null;
  const first = Array.isArray(row.products) ? row.products[0] : null;
  const payment = toCargoFeePaymentView(row);
  const confirmed = Boolean(row.adminCargoFeeConfirmedAt);

  return {
    id: String(row._id),
    requestCode: String(row.requestCode || ""),
    orderId: Number(row.orderId) || 0,
    itemIndex: Number(row.itemIndex) || 0,
    sellerId,
    sellerName: seller?.name || sellerId || "—",
    sellerCountry:
      normalizeCargoCountry(row.sellerCountry) || String(row.sellerCountry || ""),
    logisticaId: logisticaId || null,
    logisticaCompanyName: logistica?.companyName || "—",
    productTitle: resolveProductTitle(first?.title || row.storeName),
    productId: Number(first?.productId) || 0,
    productImage: resolvePublicAssetUrl(first?.image || "/img/no-image.png"),
    productCount: Math.max(0, Number(row.productCount) || 0),
    weightKg: Math.max(0, Number(row.weightKg) || 0),
    cargoDeliveryFee: Math.max(0, Number(row.cargoDeliveryFee) || 0),
    uzArrivalPhotoUrl: String(row.uzArrivalPhotoUrl || ""),
    uzArrivalComment: String(row.uzArrivalComment || ""),
    uzArrivedAt: row.uzArrivedAt || null,
    customerPaidAt: row.customerCargoFeePaidAt || null,
    customerPaymentMethod: row.customerCargoFeePaymentMethod || null,
    adminConfirmedAt: row.adminCargoFeeConfirmedAt || null,
    logisticaPaidAt: row.paidAt || null,
    paymentStatus: confirmed ? "paid" : "unpaid",
    canConfirm: Boolean(payment?.canAdminConfirm),
    payment,
  };
}

async function listAdminCargoFeePayments(query = {}) {
  const page = Math.max(1, Math.floor(toNumber(query.page, 1)));
  const limit = Math.min(
    100,
    Math.max(1, Math.floor(toNumber(query.limit, DEFAULT_PAGE_SIZE))),
  );
  const { filter, match } = buildAdminCargoFeeListMatch(query.filter || query.status);

  const [total, rows] = await Promise.all([
    CargoShipment.countDocuments(match),
    CargoShipment.find(match)
      .sort({ uzArrivedAt: -1, updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  const sellerMap = await loadSellerMap(rows.map((r) => r.sellerId));
  const logisticaMap = await loadLogisticaMap(rows.map((r) => r.logisticaId));

  return {
    filter,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit) || 1),
    items: rows.map((row) => toAdminCargoFeeCard(row, sellerMap, logisticaMap)),
  };
}

async function getAdminCargoFeePaymentDetail(shipmentIdRaw) {
  const shipmentId = String(shipmentIdRaw || "").trim();
  if (!mongoose.isValidObjectId(shipmentId)) {
    throw new HttpError(400, "So‘rov ID noto‘g‘ri", "INVALID_SHIPMENT_ID");
  }
  const shipment = await CargoShipment.findById(shipmentId).lean();
  if (!shipment) {
    throw new HttpError(404, "Yuk so‘rovi topilmadi", "SHIPMENT_NOT_FOUND");
  }
  const sellerMap = await loadSellerMap([shipment.sellerId]);
  const logisticaMap = await loadLogisticaMap([shipment.logisticaId]);
  return {
    item: toAdminCargoFeeCard(shipment, sellerMap, logisticaMap),
  };
}

async function confirmAdminCargoFeePayment(shipmentIdRaw) {
  const shipmentId = String(shipmentIdRaw || "").trim();
  if (!mongoose.isValidObjectId(shipmentId)) {
    throw new HttpError(400, "So‘rov ID noto‘g‘ri", "INVALID_SHIPMENT_ID");
  }
  const shipment = await CargoShipment.findById(shipmentId);
  if (!shipment) {
    throw new HttpError(404, "Yuk so‘rovi topilmadi", "SHIPMENT_NOT_FOUND");
  }

  const result = await applyAdminCargoFeeConfirm(shipment);
  const sellerMap = await loadSellerMap([shipment.sellerId]);
  const logisticaMap = await loadLogisticaMap([shipment.logisticaId]);
  return {
    alreadyConfirmed: Boolean(result.alreadyConfirmed),
    item: toAdminCargoFeeCard(shipment.toObject(), sellerMap, logisticaMap),
  };
}

module.exports = {
  listAdminCargoFeePayments,
  getAdminCargoFeePaymentDetail,
  confirmAdminCargoFeePayment,
};
