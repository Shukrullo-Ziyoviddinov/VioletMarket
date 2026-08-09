/**
 * Asosiy admin — cargo / logistica jarayon monitoring + amallar.
 * Amallar bitta qoida: cargoShipmentProcessActions (logistica app bilan bir xil).
 */

const mongoose = require("mongoose");
const { CargoShipment } = require("../../models/cargoShipment");
const { HttpError } = require("../../utils/httpError");
const { toNumber } = require("../adminSales/salesStatisticsHelpers");
const {
  LOGISTICA_PROCESS_STEPS,
} = require("../../productManagement/foreignOrderTracking");
const {
  normalizeCargoCountry,
} = require("../../utils/cargoCountryNormalize");
const {
  YUKLARIM_PROCESS_STEPS,
  applyYuklarimProcessStep,
  applyUzWarehouseArrival,
  applyMarkShipmentPaid,
  fanOutPaidAtToGroupCompanions,
  isCargoFeeBearer,
  canLogisticaMarkPaid,
} = require("../cargoShipments/cargoShipmentProcessActions");
const {
  groupLogisticaShipmentCards,
} = require("../cargoShipments/cargoShipmentLogisticaService");
const {
  resolveProductTitle,
  formatProductCode,
  loadSellerMap,
  loadLogisticaMap,
} = require("../cargoShipments/cargoShipmentDisplayHelpers");

const DEFAULT_PAGE_SIZE = 100;
const LIST_FETCH_CAP = 500;

function buildFulfillmentGroupKey(orderId, sellerId) {
  const oid = Number(orderId) || 0;
  const sid = String(sellerId || "").trim();
  if (!oid || !sid) return "";
  return `${oid}:${sid}`;
}

const COUNTRY_LABELS = {
  china: "China",
  xitoy: "China",
  usa: "AQSH",
  aqsh: "AQSH",
  turkiya: "Turkiya",
  turkey: "Turkiya",
  korea: "Koreya",
  koreya: "Koreya",
  japan: "Yaponiya",
};

function countryLabel(code) {
  const key = normalizeCargoCountry(code) || String(code || "").trim().toLowerCase();
  return COUNTRY_LABELS[key] || key.toUpperCase() || "—";
}

function processStepLabel(step) {
  const map = {
    xitoy_omborida: "Xitoy omborida",
    yolda: "Yo‘lda",
    bojxonada: "Bojxonada",
    toshkent_omborida: "Toshkent omborida",
  };
  const key = String(step || "").trim();
  return map[key] || (key ? key : "Qabul qilindi");
}

function toAdminShipmentCard(row, sellerMap, logisticaMap) {
  const sellerId = String(row.sellerId || "");
  const seller = sellerMap.get(sellerId);
  const logisticaId = row.logisticaId ? String(row.logisticaId) : "";
  const logistica = logisticaId ? logisticaMap.get(logisticaId) : null;
  const firstProduct = Array.isArray(row.products) ? row.products[0] : null;
  const country = normalizeCargoCountry(row.sellerCountry) || String(row.sellerCountry || "");
  const productId = Number(firstProduct?.productId) || 0;
  const orderId = Number(row.orderId) || 0;

  return {
    id: String(row._id),
    requestCode: String(row.requestCode || ""),
    orderId,
    itemIndex: Number(row.itemIndex) || 0,
    sellerId,
    sellerName: seller?.name || sellerId || "Noma’lum siller",
    sellerCountry: country,
    sellerCountryLabel: countryLabel(country),
    productTitle: resolveProductTitle(firstProduct?.title || row.storeName),
    productId,
    productCode: formatProductCode(productId),
    productCount: Math.max(0, Number(row.productCount) || 0),
    weightKg: Math.max(0, Number(row.weightKg) || 0),
    cargoDeliveryFee: Math.max(0, Number(row.cargoDeliveryFee) || 0),
    cargoFeePaymentRequired: Boolean(row.cargoFeePaymentRequired),
    status: String(row.status || ""),
    processStep: row.processStep || null,
    processStepLabel: processStepLabel(row.processStep),
    paidAt: row.paidAt || null,
    uzArrivedAt: row.uzArrivedAt || null,
    uzArrivalComment: String(row.uzArrivalComment || ""),
    customerCargoFeePaidAt: row.customerCargoFeePaidAt || null,
    adminCargoFeeConfirmedAt: row.adminCargoFeeConfirmedAt || null,
    canMarkPaid: canLogisticaMarkPaid(row),
    acceptedAt: row.acceptedAt || null,
    submittedAt: row.submittedAt || row.createdAt || null,
    logisticaId: logisticaId || null,
    logisticaCompanyName: logistica?.companyName || "—",
    logisticaCountry: logistica?.logisticaCountry || country,
    groupKey: buildFulfillmentGroupKey(orderId, sellerId),
    isGroup: false,
    siblingIds: [],
  };
}

/**
 * Guruh kartochkada mahsulot nomlarini birlashtirish
 * (groupLogisticaShipmentCards faqat primary title qoldiradi).
 */
function enrichAdminGroupedCards(grouped, cardsById) {
  return grouped.map((card) => {
    if (!card?.isGroup) return card;
    const units = (Array.isArray(card.siblingIds) ? card.siblingIds : [])
      .map((id) => cardsById.get(String(id)))
      .filter(Boolean);
    if (!units.length) return card;

    const titles = [
      ...new Set(
        units
          .map((unit) => String(unit.productTitle || "").trim())
          .filter(Boolean),
      ),
    ];
    const feeSum = units.reduce(
      (sum, unit) => sum + Math.max(0, Number(unit.cargoDeliveryFee) || 0),
      0,
    );
    // Fee faqat bearerda — yig‘indi != har sibling fee (siblinglar 0)
    return {
      ...card,
      productTitle:
        titles.length <= 1
          ? titles[0] || card.productTitle
          : `${titles[0]} +${titles.length - 1}`,
      cargoDeliveryFee: Math.max(
        0,
        Number(card.cargoDeliveryFee) || 0,
      ) || feeSum,
    };
  });
}

function mergeAdminGroupDetail(primaryRow, siblingRows, sellerMap, logisticaMap) {
  const allRows = [primaryRow, ...(Array.isArray(siblingRows) ? siblingRows : [])];
  const feeBearerRow =
    allRows.find((row) => Boolean(row.cargoFeePaymentRequired)) || primaryRow;
  const detail = toAdminShipmentDetail(feeBearerRow, sellerMap, logisticaMap);
  if (allRows.length <= 1) return detail;

  const products = [];
  const requestCodes = [];
  let weightKg = 0;
  let productCount = 0;

  for (const row of allRows) {
    const mapped = toAdminShipmentDetail(row, sellerMap, logisticaMap);
    const code = String(mapped.requestCode || "").trim();
    if (code) requestCodes.push(code);
    weightKg += Math.max(0, Number(mapped.weightKg) || 0);
    for (const product of mapped.products || []) {
      products.push({
        ...product,
        shipmentId: String(row._id),
      });
      productCount += Math.max(1, Number(product.quantity) || 1);
    }
  }

  const uniqueCodes = [...new Set(requestCodes)];
  const titles = [
    ...new Set(products.map((p) => String(p.title || "").trim()).filter(Boolean)),
  ];

  return {
    ...detail,
    requestCode:
      uniqueCodes.length <= 1
        ? uniqueCodes[0] || detail.requestCode
        : uniqueCodes.join(", "),
    productTitle:
      titles.length <= 1
        ? titles[0] || detail.productTitle
        : `${titles[0]} +${titles.length - 1}`,
    products,
    productCount,
    weightKg: Number(weightKg.toFixed(2)),
    siblingIds: allRows.map((row) => String(row._id)),
    isGroup: true,
    groupKey: buildFulfillmentGroupKey(detail.orderId, detail.sellerId),
  };
}

async function loadAdminGroupCompanionRows(shipmentRow) {
  const orderId = Number(shipmentRow.orderId) || 0;
  const sellerId = String(shipmentRow.sellerId || "").trim();
  if (!orderId || !sellerId) return [];

  return CargoShipment.find({
    orderId,
    sellerId,
    status: "accepted",
    paidAt: null,
    _id: { $ne: shipmentRow._id },
  })
    .sort({ acceptedAt: -1, submittedAt: -1 })
    .lean();
}

function toAdminShipmentDetail(row, sellerMap, logisticaMap) {
  const card = toAdminShipmentCard(row, sellerMap, logisticaMap);
  const stepIndex = LOGISTICA_PROCESS_STEPS.indexOf(String(row.processStep || ""));
  const timeline = [
    {
      key: "accepted",
      label: "Qabul qilindi",
      done: String(row.status || "") === "accepted" || Boolean(row.acceptedAt),
      at: row.acceptedAt || null,
    },
    ...LOGISTICA_PROCESS_STEPS.map((key, index) => ({
      key,
      label: processStepLabel(key),
      done: stepIndex >= 0 && index <= stepIndex,
      at: key === "toshkent_omborida" ? row.uzArrivedAt || null : null,
    })),
    {
      key: "paid",
      label: "To‘landi",
      done: Boolean(row.paidAt),
      at: row.paidAt || null,
    },
  ];

  return {
    ...card,
    storeName: String(row.storeName || ""),
    warehouseAddress: String(row.warehouseAddress || ""),
    note: String(row.note || ""),
    products: (Array.isArray(row.products) ? row.products : []).map((p, i) => ({
      id: `${row._id}-${i}`,
      title: resolveProductTitle(p.title),
      productId: Number(p.productId) || 0,
      color: String(p.color || ""),
      size: String(p.size || ""),
      storage: String(p.storage || ""),
      model: String(p.model || ""),
      quantity: Math.max(1, Number(p.quantity) || 1),
      weightKg: Math.max(0, Number(p.weightKg) || 0),
    })),
    timeline,
    processSteps: YUKLARIM_PROCESS_STEPS.map((key) => ({
      key,
      label: processStepLabel(key),
    })),
    toshkentStep: {
      key: "toshkent_omborida",
      label: processStepLabel("toshkent_omborida"),
      done: String(row.processStep || "") === "toshkent_omborida" && Boolean(row.uzArrivedAt),
    },
  };
}

async function loadShipmentDoc(shipmentIdRaw) {
  const shipmentId = String(shipmentIdRaw || "").trim();
  if (!mongoose.isValidObjectId(shipmentId)) {
    throw new HttpError(400, "So‘rov ID noto‘g‘ri", "INVALID_SHIPMENT_ID");
  }
  const shipment = await CargoShipment.findById(shipmentId);
  if (!shipment) {
    throw new HttpError(404, "Yuk so‘rovi topilmadi", "SHIPMENT_NOT_FOUND");
  }
  return shipment;
}

async function toAdminDetailResponse(shipment) {
  const row = typeof shipment.toObject === "function" ? shipment.toObject() : shipment;
  const siblings = await loadAdminGroupCompanionRows(row);
  const sellerIds = [row.sellerId, ...siblings.map((s) => s.sellerId)];
  const logisticaIds = [row.logisticaId, ...siblings.map((s) => s.logisticaId)];
  const sellerMap = await loadSellerMap(sellerIds);
  const logisticaMap = await loadLogisticaMap(logisticaIds);
  return {
    shipment: mergeAdminGroupDetail(row, siblings, sellerMap, logisticaMap),
  };
}

async function listAdminCargoShipmentCountries() {
  // Davlat soni — guruh (orderId+sellerId) bo‘yicha, alohida shipment emas
  const rows = await CargoShipment.aggregate([
    { $match: { status: "accepted", paidAt: null } },
    {
      $group: {
        _id: {
          country: { $toLower: "$sellerCountry" },
          orderId: "$orderId",
          sellerId: "$sellerId",
        },
      },
    },
    {
      $group: {
        _id: "$_id.country",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const byCanonical = new Map();
  for (const row of rows) {
    const raw = String(row._id || "").trim().toLowerCase();
    if (!raw) continue;
    const code = normalizeCargoCountry(raw) || raw;
    const prev = byCanonical.get(code) || { code, count: 0, label: countryLabel(code) };
    prev.count += Number(row.count) || 0;
    byCanonical.set(code, prev);
  }

  return {
    countries: [...byCanonical.values()].sort((a, b) => b.count - a.count),
  };
}

/**
 * Qabul qilingan, hali To‘lanmagan (Xorij→UZB ga o‘tmagan).
 * Bir checkout (orderId) + bir siller → bitta kartochka.
 */
async function listAdminCargoShipments(query = {}) {
  const page = Math.max(1, Math.floor(toNumber(query.page, 1)));
  const limit = Math.min(200, Math.max(1, Math.floor(toNumber(query.limit, DEFAULT_PAGE_SIZE))));
  const countryRaw = String(query.sellerCountry || query.country || "")
    .trim()
    .toLowerCase();
  const country = countryRaw ? normalizeCargoCountry(countryRaw) || countryRaw : "";

  const filter = { status: "accepted", paidAt: null };
  if (country) {
    const aliases = [country];
    if (country === "turkiya") aliases.push("turkey");
    if (country === "china") aliases.push("xitoy");
    if (country === "usa") aliases.push("aqsh", "us");
    if (country === "korea") aliases.push("koreya");
    filter.sellerCountry = { $in: aliases };
  }

  // Avval guruhlash, keyin paginate (Logistica bilan bir xil)
  const rows = await CargoShipment.find(filter)
    .sort({ acceptedAt: -1, submittedAt: -1 })
    .limit(LIST_FETCH_CAP)
    .lean();

  const sellerMap = await loadSellerMap(rows.map((r) => r.sellerId));
  const logisticaMap = await loadLogisticaMap(rows.map((r) => r.logisticaId));
  const cards = rows.map((row) => toAdminShipmentCard(row, sellerMap, logisticaMap));
  const cardsById = new Map(cards.map((card) => [String(card.id), card]));
  const grouped = enrichAdminGroupedCards(
    groupLogisticaShipmentCards(cards),
    cardsById,
  );

  const total = grouped.length;
  const start = (page - 1) * limit;
  const pageItems = grouped.slice(start, start + limit);

  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit) || 1),
    shipments: pageItems,
  };
}

async function getAdminCargoShipmentDetail(shipmentIdRaw) {
  const shipment = await loadShipmentDoc(shipmentIdRaw);
  return toAdminDetailResponse(shipment);
}

async function updateAdminCargoShipmentProcessStep(shipmentIdRaw, processStepRaw) {
  const shipment = await loadShipmentDoc(shipmentIdRaw);
  await applyYuklarimProcessStep(shipment, processStepRaw);

  const companions = await loadAdminGroupCompanionRows(
    typeof shipment.toObject === "function" ? shipment.toObject() : shipment,
  );
  for (const siblingRow of companions) {
    const sibling = await CargoShipment.findById(siblingRow._id);
    if (!sibling) continue;
    try {
      await applyYuklarimProcessStep(sibling, processStepRaw);
    } catch (error) {
      if (Number(error?.status) === 409) continue;
      throw error;
    }
  }

  return toAdminDetailResponse(shipment);
}

async function arriveAdminCargoShipmentUzWarehouse(shipmentIdRaw, payload = {}) {
  const shipment = await loadShipmentDoc(shipmentIdRaw);
  const result = await applyUzWarehouseArrival(shipment, payload, {
    attachFee: true,
  });

  // Logistica bilan bir xil: siblinglar Toshkentga o‘tadi, fee ko‘paytirilmaydi
  const orderId = Number(shipment.orderId) || 0;
  const sellerId = String(shipment.sellerId || "").trim();
  let advancedSiblingCount = 0;
  if (orderId && sellerId) {
    const siblings = await CargoShipment.find({
      orderId,
      sellerId,
      status: "accepted",
      paidAt: null,
      _id: { $ne: shipment._id },
    });
    for (const sibling of siblings) {
      try {
        await applyUzWarehouseArrival(sibling, payload, { attachFee: false });
        advancedSiblingCount += 1;
      } catch (error) {
        if (Number(error?.status) === 409) continue;
        throw error;
      }
    }
  }

  const data = await toAdminDetailResponse(shipment);
  return {
    ...data,
    alreadyArrived: Boolean(result.alreadyArrived),
    advancedSiblingCount,
  };
}

async function markAdminCargoShipmentPaid(shipmentIdRaw) {
  const shipment = await loadShipmentDoc(shipmentIdRaw);
  const result = await applyMarkShipmentPaid(shipment);
  let paidSiblingCount = 0;
  if (isCargoFeeBearer(shipment) && shipment.paidAt) {
    paidSiblingCount = await fanOutPaidAtToGroupCompanions(shipment);
  }
  const data = await toAdminDetailResponse(shipment);
  return {
    ...data,
    alreadyPaid: Boolean(result.alreadyPaid),
    paidSiblingCount,
  };
}

module.exports = {
  listAdminCargoShipmentCountries,
  listAdminCargoShipments,
  getAdminCargoShipmentDetail,
  updateAdminCargoShipmentProcessStep,
  arriveAdminCargoShipmentUzWarehouse,
  markAdminCargoShipmentPaid,
  LOGISTICA_PROCESS_STEPS,
  YUKLARIM_PROCESS_STEPS,
  buildFulfillmentGroupKey,
  enrichAdminGroupedCards,
};
