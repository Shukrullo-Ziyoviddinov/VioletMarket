/**
 * Asosiy admin — cargo yetkazish summasi so‘rovlari (mijoz to‘lovi tasdiqi).
 * Qoida: productManagement/foreignCargoFeePayment.js
 */

const mongoose = require("mongoose");
const { CargoShipment } = require("../../models/cargoShipment");
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
const {
  resolveProductTitle,
  loadSellerMap,
  loadLogisticaMap,
} = require("../cargoShipments/cargoShipmentDisplayHelpers");
const {
  buildCargoLaneGroupKey,
  normalizeCargoServiceType,
} = require("../../utils/cargoServiceType");

const DEFAULT_PAGE_SIZE = 50;

function mapFeeProductLine(row, product, index) {
  const weightFromProduct = Math.max(0, Number(product?.weightKg) || 0);
  const weightFromShipment = Math.max(0, Number(row.weightKg) || 0);
  return {
    id: `${row._id}-${index}`,
    shipmentId: String(row._id),
    title: resolveProductTitle(product?.title || row.storeName),
    productId: Number(product?.productId) || 0,
    color: String(product?.color || "").trim(),
    size: String(product?.size || "").trim(),
    storage: String(product?.storage || "").trim(),
    model: String(product?.model || "").trim(),
    quantity: Math.max(1, Number(product?.quantity) || 1),
    weightKg: weightFromProduct > 0 ? weightFromProduct : weightFromShipment,
  };
}

function collectFeeProductsFromRows(rows = []) {
  const products = [];
  let weightSum = 0;
  let shipmentWeightSum = 0;

  for (const row of rows) {
    shipmentWeightSum += Math.max(0, Number(row.weightKg) || 0);
    const list =
      Array.isArray(row.products) && row.products.length > 0
        ? row.products
        : [
            {
              title: row.storeName,
              productId: 0,
              quantity: Math.max(1, Number(row.productCount) || 1),
              weightKg: row.weightKg,
            },
          ];

    list.forEach((product, index) => {
      const mapped = mapFeeProductLine(row, product, index);
      products.push(mapped);
      weightSum += mapped.weightKg;
    });
  }

  const weightKg = Number(
    (weightSum > 0 ? weightSum : shipmentWeightSum).toFixed(3),
  );
  const titles = [
    ...new Set(
      products.map((p) => String(p.title || "").trim()).filter(Boolean),
    ),
  ];

  return {
    products,
    weightKg,
    productCount: products.reduce(
      (sum, p) => sum + Math.max(1, Number(p.quantity) || 1),
      0,
    ),
    productTitle:
      titles.length <= 1
        ? titles[0] || resolveProductTitle(rows[0]?.storeName)
        : `${titles[0]} +${titles.length - 1}`,
  };
}

function toAdminCargoFeeCard(row, sellerMap, logisticaMap, groupMeta = null) {
  const sellerId = String(row.sellerId || "");
  const seller = sellerMap.get(sellerId);
  const logisticaId = row.logisticaId ? String(row.logisticaId) : "";
  const logistica = logisticaId ? logisticaMap.get(logisticaId) : null;
  const first = Array.isArray(row.products) ? row.products[0] : null;
  const payment = toCargoFeePaymentView(row);
  const confirmed = Boolean(row.adminCargoFeeConfirmedAt);

  const merged = groupMeta || collectFeeProductsFromRows([row]);
  const products = Array.isArray(merged.products) ? merged.products : [];

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
    productTitle:
      merged.productTitle ||
      resolveProductTitle(first?.title || row.storeName),
    productId: Number(first?.productId) || 0,
    productImage: resolvePublicAssetUrl(first?.image || "/img/no-image.png"),
    productCount: Math.max(
      0,
      Number(merged.productCount) || Number(row.productCount) || 0,
    ),
    weightKg: Math.max(
      0,
      Number(merged.weightKg) || Number(row.weightKg) || 0,
    ),
    cargoDeliveryFee: Math.max(0, Number(row.cargoDeliveryFee) || 0),
    products,
    isGroup: products.length > 1,
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
    cargoServiceType: normalizeCargoServiceType(row.cargoServiceType),
  };
}

async function loadFeeGroupRowsByPairs(pairs = []) {
  const unique = [];
  const seen = new Set();
  for (const pair of pairs) {
    const orderId = Number(pair.orderId) || 0;
    const sellerId = String(pair.sellerId || "").trim();
    const key = buildCargoLaneGroupKey(
      orderId,
      sellerId,
      pair.cargoServiceType,
    );
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push({ orderId, sellerId });
  }
  if (!unique.length) return new Map();

  const rows = await CargoShipment.find({
    $or: unique.map((pair) => ({
      orderId: pair.orderId,
      sellerId: pair.sellerId,
    })),
    status: {
      $in: [
        "accepted",
        "return_request_pending",
        "return_approved",
      ],
    },
  })
    .sort({ acceptedAt: -1, submittedAt: -1, createdAt: -1 })
    .lean();

  const byKey = new Map();
  for (const row of rows) {
    const key = buildCargoLaneGroupKey(
      row.orderId,
      row.sellerId,
      row.cargoServiceType,
    );
    if (!key) continue;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(row);
  }
  return byKey;
}

function resolveGroupRowsForFee(row, groupMap) {
  const key = buildCargoLaneGroupKey(
    row.orderId,
    row.sellerId,
    row.cargoServiceType,
  );
  const groupRows = key ? groupMap.get(key) : null;
  if (Array.isArray(groupRows) && groupRows.length > 0) {
    return groupRows;
  }
  return [row];
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
  const groupMap = await loadFeeGroupRowsByPairs(
    rows.map((row) => ({
      orderId: row.orderId,
      sellerId: row.sellerId,
      cargoServiceType: row.cargoServiceType,
    })),
  );

  return {
    filter,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit) || 1),
    items: rows.map((row) => {
      const groupRows = resolveGroupRowsForFee(row, groupMap);
      return toAdminCargoFeeCard(
        row,
        sellerMap,
        logisticaMap,
        collectFeeProductsFromRows(groupRows),
      );
    }),
  };
}

async function enrichFeeCard(shipment) {
  const row =
    typeof shipment.toObject === "function" ? shipment.toObject() : shipment;
  const sellerMap = await loadSellerMap([row.sellerId]);
  const logisticaMap = await loadLogisticaMap([row.logisticaId]);
  const groupMap = await loadFeeGroupRowsByPairs([
    {
      orderId: row.orderId,
      sellerId: row.sellerId,
      cargoServiceType: row.cargoServiceType,
    },
  ]);
  const groupRows = resolveGroupRowsForFee(row, groupMap);
  return toAdminCargoFeeCard(
    row,
    sellerMap,
    logisticaMap,
    collectFeeProductsFromRows(groupRows),
  );
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
  return {
    item: await enrichFeeCard(shipment),
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
  return {
    alreadyConfirmed: Boolean(result.alreadyConfirmed),
    item: await enrichFeeCard(shipment),
  };
}

module.exports = {
  listAdminCargoFeePayments,
  getAdminCargoFeePaymentDetail,
  confirmAdminCargoFeePayment,
};
