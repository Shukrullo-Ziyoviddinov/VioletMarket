/**
 * Logistica Tarix — alohida collection.
 * To‘landi → handed_over; cargo confirm qaytarish → returned.
 */

const mongoose = require("mongoose");
const {
  CargoLogisticaHistory,
} = require("../../models/cargoLogisticaHistory");
const { HttpError } = require("../../utils/httpError");
const {
  normalizeCargoCountry,
  cargoCountryDisplayLabel,
} = require("../../utils/cargoCountryNormalize");
const { toNumber } = require("../adminSales/salesStatisticsHelpers");

function resolveProductTitle(title) {
  if (title && typeof title === "object") {
    return String(title.uz || title.ru || "").trim() || "Mahsulot";
  }
  return String(title || "").trim() || "Mahsulot";
}

function formatProductCode(productId) {
  const id = Number(productId) || 0;
  if (!id) return "";
  return `#${String(id).padStart(4, "0")}`;
}

function snapshotFromShipment(shipment, extras = {}) {
  const row = shipment?.toObject ? shipment.toObject() : shipment || {};
  const product = Array.isArray(row.products) ? row.products[0] : null;
  const productId = Number(product?.productId) || 0;
  return {
    logisticaId: row.logisticaId,
    shipmentId: row._id,
    requestCode: String(row.requestCode || ""),
    storeName: String(row.storeName || ""),
    sellerId: String(row.sellerId || "").trim(),
    orderId: Number(row.orderId) || 0,
    itemIndex: Number(row.itemIndex) || 0,
    productTitle: resolveProductTitle(product?.title),
    productCode: formatProductCode(productId),
    amount: Math.max(0, toNumber(extras.amount, 0)),
    cargoCountry: normalizeCargoCountry(row.sellerCountry),
    cargoReturnRequestId: extras.cargoReturnRequestId || null,
  };
}

function toPublicHistoryItem(doc) {
  if (!doc) return null;
  const row = doc.toObject ? doc.toObject() : doc;
  const kind = String(row.kind || "");
  return {
    id: String(row._id),
    shipmentId: String(row.shipmentId || ""),
    kind,
    kindLabel: kind === "returned" ? "Qaytarilgan" : "Topshirilgan",
    requestCode: String(row.requestCode || ""),
    storeName: String(row.storeName || ""),
    sellerId: String(row.sellerId || ""),
    orderId: Number(row.orderId) || 0,
    productTitle: String(row.productTitle || "Mahsulot"),
    productCode: String(row.productCode || ""),
    amount: Math.max(0, Number(row.amount) || 0),
    cargoCountry: normalizeCargoCountry(row.cargoCountry),
    cargoCountryLabel: cargoCountryDisplayLabel(row.cargoCountry),
    at: row.at || row.createdAt || null,
  };
}

/**
 * Idempotent: shipmentId + kind unique.
 */
async function upsertHistoryEntry({ kind, shipment, at, amount, cargoReturnRequestId }) {
  if (!shipment?._id && !shipment?.id) return null;
  const logisticaId = shipment.logisticaId;
  if (!logisticaId) return null;

  const snap = snapshotFromShipment(shipment, {
    amount,
    cargoReturnRequestId,
  });
  const shipmentId = shipment._id || shipment.id;
  const when = at instanceof Date ? at : new Date(at || Date.now());

  const saved = await CargoLogisticaHistory.findOneAndUpdate(
    { shipmentId, kind },
    {
      $setOnInsert: {
        ...snap,
        shipmentId,
        logisticaId,
        kind,
        at: when,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return saved;
}

async function recordHandedOverHistory(shipment, at = new Date()) {
  return upsertHistoryEntry({
    kind: "handed_over",
    shipment,
    at,
  });
}

async function recordReturnedHistory(shipment, extras = {}) {
  return upsertHistoryEntry({
    kind: "returned",
    shipment,
    at: extras.at || new Date(),
    amount: extras.amount,
    cargoReturnRequestId: extras.cargoReturnRequestId || null,
  });
}

async function listHistoryForLogistica(logisticaId, query = {}) {
  if (!mongoose.isValidObjectId(logisticaId)) {
    throw new HttpError(401, "Avtorizatsiya noto‘g‘ri", "UNAUTHORIZED");
  }

  const { LogisticaProfile } = require("../../models/logisticaProfile");
  const profile = await LogisticaProfile.findById(logisticaId)
    .select({ status: 1 })
    .lean();
  if (!profile || profile.status !== "active") {
    throw new HttpError(403, "Logistica akkaunt faol emas", "ACCOUNT_BLOCKED");
  }

  const page = Math.max(1, Math.floor(toNumber(query.page, 1)));
  const limit = Math.min(100, Math.max(1, Math.floor(toNumber(query.limit, 50))));
  const kindRaw = String(query.kind || "all").trim().toLowerCase();
  const filter = { logisticaId };
  if (kindRaw === "handed_over" || kindRaw === "returned") {
    filter.kind = kindRaw;
  }

  const [total, rows] = await Promise.all([
    CargoLogisticaHistory.countDocuments(filter),
    CargoLogisticaHistory.find(filter)
      .sort({ at: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit) || 1),
    items: rows.map(toPublicHistoryItem),
  };
}

module.exports = {
  recordHandedOverHistory,
  recordReturnedHistory,
  listHistoryForLogistica,
  toPublicHistoryItem,
};
