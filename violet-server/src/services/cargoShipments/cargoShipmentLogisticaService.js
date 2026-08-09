/**
 * Logistica — cargo so‘rov: o‘qish, qabul, jarayon, sotuvchiga qaytarish.
 * UZB kuryer zanjiriga aralashmaydi (ko‘prik alohida: foreignUzCourierBridgeService).
 */

const mongoose = require("mongoose");
const { CargoShipment, toPublicCargoShipment } = require("../../models/cargoShipment");
const { LogisticaProfile } = require("../../models/logisticaProfile");
const { HttpError } = require("../../utils/httpError");
const { toNumber } = require("../adminSales/salesStatisticsHelpers");
const {
  cargoCountriesMatch,
  cargoCountryMatchValues,
  normalizeCargoCountry,
} = require("../../utils/cargoCountryNormalize");
const {
  createCargoReturnRequestForLogistica,
} = require("./cargoReturnRequestService");
const {
  YUKLARIM_PROCESS_STEPS,
  UZB_WAREHOUSE_LIST_STEPS,
  applyAcceptShipment,
  applyYuklarimProcessStep,
  applyUzWarehouseArrival,
  applyMarkShipmentPaid,
  fanOutPaidAtToGroupCompanions,
  isCargoFeeBearer,
  canLogisticaMarkPaid,
  assertItemWeightsForGroup,
} = require("./cargoShipmentProcessActions");
const { resolveProductTitle } = require("./cargoShipmentDisplayHelpers");

const DEFAULT_PAGE_SIZE = 20;

function buildFulfillmentGroupKey(orderId, sellerId) {
  return `${Number(orderId) || 0}:${String(sellerId || "").trim()}`;
}

function assertActiveLogistica(profile) {
  if (!profile) {
    throw new HttpError(404, "Logistica akkaunt topilmadi", "ACCOUNT_NOT_FOUND");
  }
  if (profile.status === "pending") {
    throw new HttpError(403, "Admin tasdiqlashini kuting", "ACCOUNT_PENDING");
  }
  if (profile.status !== "active") {
    throw new HttpError(403, "Logistica akkaunt bloklangan", "ACCOUNT_BLOCKED");
  }
}

async function loadActiveLogistica(logisticaId) {
  if (!mongoose.isValidObjectId(logisticaId)) {
    throw new HttpError(401, "Avtorizatsiya noto‘g‘ri", "UNAUTHORIZED");
  }
  const profile = await LogisticaProfile.findById(logisticaId)
    .select({ status: 1, logisticaCountry: 1, companyName: 1 })
    .lean();
  assertActiveLogistica(profile);
  return profile;
}

function formatDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
}

function buildVariantLabel(product) {
  const parts = [
    product?.color,
    product?.size,
    product?.storage,
    product?.model,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean);
  return parts.join(" / ");
}

function assertShipmentCountryAccess(profile, row) {
  if (!cargoCountriesMatch(profile.logisticaCountry, row.sellerCountry)) {
    throw new HttpError(
      403,
      "Bu so‘rov sizning davlatingizga tegishli emas",
      "SHIPMENT_FORBIDDEN",
    );
  }
}

function toLogisticaShipmentCard(doc) {
  const row = doc || {};
  const orderId = Number(row.orderId) || 0;
  const sellerId = String(row.sellerId || "").trim();
  return {
    id: String(row._id),
    requestCode: String(row.requestCode || ""),
    storeName: String(row.storeName || ""),
    dateTime: formatDateTime(row.submittedAt || row.createdAt),
    productCount: Math.max(0, Number(row.productCount) || 0),
    weightKg: Math.max(0, Number(row.weightKg) || 0),
    weightLabel: row.weightLabel || "Taxminiy og'irlik",
    status: String(row.status || "pending"),
    sellerCountry: String(row.sellerCountry || ""),
    processStep: row.processStep || null,
    cargoFeePaymentRequired: Boolean(row.cargoFeePaymentRequired),
    customerCargoFeePaidAt: row.customerCargoFeePaidAt || null,
    adminCargoFeeConfirmedAt: row.adminCargoFeeConfirmedAt || null,
    paidAt: row.paidAt || null,
    submittedAt: row.submittedAt || row.createdAt || null,
    orderId,
    sellerId,
    itemIndex: Number(row.itemIndex) || 0,
    groupId: row.groupId ? String(row.groupId) : null,
    groupKey: buildFulfillmentGroupKey(orderId, sellerId),
    isGroup: false,
    siblingIds: [],
  };
}

/**
 * Bir checkout (orderId) + bir siller → bitta UI kartochka.
 * Primary: fee-bearer (cargoFeePaymentRequired) — To‘landi id to‘g‘ri bo‘lsin.
 * Fee yo‘q guruhda — eng yangi accepted/submitted.
 */
function groupLogisticaShipmentCards(cards = []) {
  const map = new Map();

  for (const card of cards) {
    if (!card) continue;
    const key =
      String(card.groupKey || "").trim() ||
      buildFulfillmentGroupKey(card.orderId, card.sellerId);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(card);
  }

  const resolveTime = (card) => {
    const raw = card.acceptedAt || card.submittedAt || card.updatedAt || null;
    const time = raw ? new Date(raw).getTime() : 0;
    return Number.isFinite(time) ? time : 0;
  };

  const pickPrimary = (units) => {
    const feeBearer = units.find((unit) => Boolean(unit.cargoFeePaymentRequired));
    if (feeBearer) return feeBearer;
    return units[0];
  };

  const grouped = [];
  for (const units of map.values()) {
    const sorted = [...units].sort((a, b) => resolveTime(b) - resolveTime(a));
    const primary = pickPrimary(sorted);
    const siblingIds = sorted.map((unit) => String(unit.id));
    const requestCodes = [
      ...new Set(
        sorted
          .map((unit) => String(unit.requestCode || "").trim())
          .filter(Boolean),
      ),
    ];

    grouped.push({
      ...primary,
      requestCode:
        requestCodes.length <= 1
          ? requestCodes[0] || primary.requestCode
          : requestCodes.join(", "),
      productCount: sorted.reduce(
        (sum, unit) => sum + (Math.max(0, Number(unit.productCount) || 0)),
        0,
      ),
      weightKg: Number(
        sorted
          .reduce((sum, unit) => sum + (Math.max(0, Number(unit.weightKg) || 0)), 0)
          .toFixed(2),
      ),
      isGroup: sorted.length > 1,
      siblingIds,
      groupKey: primary.groupKey,
    });
  }

  grouped.sort((a, b) => resolveTime(b) - resolveTime(a));
  return grouped;
}

function toLogisticaShipmentDetail(doc) {
  const row = doc || {};
  const orderId = Number(row.orderId) || 0;
  const sellerId = String(row.sellerId || "").trim();
  const shipmentId = String(row._id || "");
  const products = (Array.isArray(row.products) ? row.products : []).map(
    (product, index) => ({
      id: `${shipmentId}-${Number(product.unitIndex) || index}`,
      shipmentId,
      title: resolveProductTitle(product.title),
      variant: buildVariantLabel(product),
      weightKg: Math.max(0, Number(product.weightKg) || 0),
      quantity: Math.max(1, Number(product.quantity) || 1),
      productId: Number(product.productId) || 0,
      color: String(product.color || ""),
      size: String(product.size || ""),
      storage: String(product.storage || ""),
      model: String(product.model || ""),
      image: String(product.image || "/img/no-image.png"),
      unitIndex: Number.isInteger(Number(product.unitIndex))
        ? Number(product.unitIndex)
        : index,
      returnStatus: String(product.returnStatus || "active"),
    }),
  );

  return {
    id: String(row._id),
    requestCode: String(row.requestCode || ""),
    storeName: String(row.storeName || ""),
    dateTime: formatDateTime(row.submittedAt || row.createdAt),
    productCount: Math.max(0, Number(row.productCount) || products.length),
    weightKg: Math.max(0, Number(row.weightKg) || 0),
    weightLabel: row.weightLabel || "Taxminiy og'irlik",
    warehouseAddress: String(row.warehouseAddress || ""),
    note: String(row.note || ""),
    products,
    activeProcessStep: row.processStep || null,
    status: String(row.status || "pending"),
    sellerId,
    sellerCountry: String(row.sellerCountry || ""),
    orderId,
    itemIndex: Number(row.itemIndex) || 0,
    groupKey: buildFulfillmentGroupKey(orderId, sellerId),
    siblingIds: [],
    isGroup: false,
    cargoDeliveryFee: Math.max(0, Number(row.cargoDeliveryFee) || 0),
    uzArrivalPhotoUrl: String(row.uzArrivalPhotoUrl || ""),
    uzArrivalComment: String(row.uzArrivalComment || ""),
    uzArrivedAt: row.uzArrivedAt || null,
    customerCargoFeePaidAt: row.customerCargoFeePaidAt || null,
    customerCargoFeePaymentMethod: row.customerCargoFeePaymentMethod || null,
    adminCargoFeeConfirmedAt: row.adminCargoFeeConfirmedAt || null,
    submittedAt: row.submittedAt || row.createdAt || null,
    acceptedAt: row.acceptedAt || null,
    returnedAt: row.returnedAt || null,
    paidAt: row.paidAt || null,
    cargoFeePaymentRequired: Boolean(row.cargoFeePaymentRequired),
    canMarkPaid: canLogisticaMarkPaid(row),
  };
}

async function loadPendingSiblingShipments(shipment) {
  const orderId = Number(shipment.orderId) || 0;
  const sellerId = String(shipment.sellerId || "").trim();
  if (!orderId || !sellerId) return [];

  const rows = await CargoShipment.find({
    orderId,
    sellerId,
    status: "pending",
    _id: { $ne: shipment._id },
  })
    .sort({ submittedAt: -1, createdAt: -1 })
    .lean();

  return rows;
}

async function loadAcceptedSiblingShipments(shipment, logisticaId) {
  const orderId = Number(shipment.orderId) || 0;
  const sellerId = String(shipment.sellerId || "").trim();
  const lid = String(logisticaId || "").trim();
  if (!orderId || !sellerId || !lid) return [];

  const rows = await CargoShipment.find({
    orderId,
    sellerId,
    status: "accepted",
    logisticaId: lid,
    paidAt: null,
    _id: { $ne: shipment._id },
  })
    .sort({ acceptedAt: -1, submittedAt: -1 })
    .lean();

  return rows;
}

/**
 * Detail / qaytarish UI: guruh siblinglari (pending + accepted + qisman return).
 * To‘langan (paidAt) chiqarilmaydi.
 */
async function loadGroupSiblingShipmentsForDetail(shipment, logisticaId = null) {
  const orderId = Number(shipment.orderId) || 0;
  const sellerId = String(shipment.sellerId || "").trim();
  if (!orderId || !sellerId) return [];

  const lid = String(logisticaId || "").trim();
  const filter = {
    orderId,
    sellerId,
    paidAt: null,
    _id: { $ne: shipment._id },
    status: {
      $in: [
        "pending",
        "accepted",
        "return_request_pending",
        "return_approved",
      ],
    },
  };

  if (lid) {
    filter.$or = [
      { status: "pending" },
      { logisticaId: lid },
    ];
  }

  return CargoShipment.find(filter)
    .sort({ acceptedAt: -1, submittedAt: -1, createdAt: -1 })
    .lean();
}

/**
 * Guruh detail: fee-bearer asosiy (admin bilan bir xil).
 * Sibling ochilsa ham to‘lov/izoh/canMarkPaid to‘g‘ri chiqsin.
 */
function mergeGroupDetail(primaryRow, siblingRows = []) {
  const allRows = [primaryRow, ...(Array.isArray(siblingRows) ? siblingRows : [])];
  if (allRows.length <= 1) {
    return toLogisticaShipmentDetail(primaryRow);
  }

  const feeBearerRow =
    allRows.find((row) => Boolean(row.cargoFeePaymentRequired)) || primaryRow;
  const detail = toLogisticaShipmentDetail(feeBearerRow);

  const products = [];
  const requestCodes = [];
  for (const row of allRows) {
    const code = String(row.requestCode || "").trim();
    if (code) requestCodes.push(code);
    const mapped = toLogisticaShipmentDetail(row).products;
    for (const product of mapped) {
      products.push(product);
    }
  }

  const uniqueCodes = [...new Set(requestCodes)];
  const siblingIds = allRows.map((row) => String(row._id));

  return {
    ...detail,
    requestCode:
      uniqueCodes.length <= 1
        ? uniqueCodes[0] || detail.requestCode
        : uniqueCodes.join(", "),
    products,
    productCount: products.reduce(
      (sum, product) => sum + Math.max(1, Number(product.quantity) || 1),
      0,
    ),
    weightKg: Number(
      allRows
        .reduce((sum, row) => sum + Math.max(0, Number(row.weightKg) || 0), 0)
        .toFixed(2),
    ),
    siblingIds,
    isGroup: true,
    groupKey:
      detail.groupKey ||
      buildFulfillmentGroupKey(detail.orderId, detail.sellerId),
  };
}

async function loadShipmentForLogistica(logisticaId, shipmentIdRaw) {
  const profile = await loadActiveLogistica(logisticaId);
  const shipmentId = String(shipmentIdRaw || "").trim();
  if (!mongoose.isValidObjectId(shipmentId)) {
    throw new HttpError(400, "So‘rov ID noto‘g‘ri", "INVALID_SHIPMENT_ID");
  }

  const shipment = await CargoShipment.findById(shipmentId);
  if (!shipment) {
    throw new HttpError(404, "Yuk so‘rovi topilmadi", "SHIPMENT_NOT_FOUND");
  }

  assertShipmentCountryAccess(profile, shipment);
  return { profile, shipment };
}

async function listPendingShipmentsForLogistica(logisticaId, query = {}) {
  const profile = await loadActiveLogistica(logisticaId);
  const countryValues = cargoCountryMatchValues(profile.logisticaCountry);

  const page = Math.max(1, Math.floor(toNumber(query.page, 1)));
  const limit = Math.min(
    100,
    Math.max(1, Math.floor(toNumber(query.limit, DEFAULT_PAGE_SIZE))),
  );

  const filter = {
    status: "pending",
    sellerCountry: { $in: countryValues.length ? countryValues : ["__none__"] },
  };

  // Guruhlash uchun barcha pending; keyin groupKey bo‘yicha paginate
  const rows = await CargoShipment.find(filter)
    .sort({ submittedAt: -1, createdAt: -1 })
    .limit(500)
    .lean();

  const grouped = groupLogisticaShipmentCards(rows.map(toLogisticaShipmentCard));
  const total = grouped.length;
  const start = (page - 1) * limit;
  const pageItems = grouped.slice(start, start + limit);

  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit) || 1),
    logisticaCountry: normalizeCargoCountry(profile.logisticaCountry),
    shipments: pageItems,
  };
}

async function getShipmentDetailForLogistica(logisticaId, shipmentIdRaw) {
  const { shipment } = await loadShipmentForLogistica(logisticaId, shipmentIdRaw);
  const row = shipment.toObject ? shipment.toObject() : shipment;
  const status = String(row.status || "");

  if (status === "pending") {
    const siblings = await loadPendingSiblingShipments(shipment);
    return { shipment: mergeGroupDetail(row, siblings) };
  }

  if (
    status === "accepted" &&
    row.logisticaId &&
    String(row.logisticaId) === String(logisticaId)
  ) {
    const siblings = await loadAcceptedSiblingShipments(shipment, logisticaId);
    return { shipment: mergeGroupDetail(row, siblings) };
  }

  if (
    status === "returned_to_seller" ||
    status === "return_request_pending" ||
    status === "return_approved"
  ) {
    // Qisman qaytarishda siblinglar guruhda ko‘rinsin
    const siblings = await loadGroupSiblingShipmentsForDetail(
      shipment,
      logisticaId,
    );
    return { shipment: mergeGroupDetail(row, siblings) };
  }

  throw new HttpError(403, "Bu so‘rovni ko‘rish mumkin emas", "SHIPMENT_FORBIDDEN");
}

/**
 * Qabul: pending → accepted; order item → handed_to_cargo.
 * Bir orderId+sellerId pending siblinglar ham birga qabul qilinadi.
 */
async function acceptShipmentForLogistica(logisticaId, shipmentIdRaw) {
  const { shipment } = await loadShipmentForLogistica(logisticaId, shipmentIdRaw);
  const result = await applyAcceptShipment(shipment, logisticaId);

  const siblingRows = await loadPendingSiblingShipments(shipment);
  let acceptedSiblings = 0;
  for (const siblingRow of siblingRows) {
    const sibling = await CargoShipment.findById(siblingRow._id);
    if (!sibling) continue;
    try {
      await applyAcceptShipment(sibling, logisticaId);
      acceptedSiblings += 1;
    } catch (error) {
      if (Number(error?.status) === 409) continue;
      throw error;
    }
  }

  return {
    shipment: toLogisticaShipmentDetail(shipment.toObject()),
    alreadyAccepted: Boolean(result.alreadyAccepted),
    acceptedSiblingCount: acceptedSiblings,
  };
}

/**
 * Jarayon stepi — faqat Yuklarim bosqichlari (xitoy → yolda → bojxona).
 * Toshkent: arriveShipmentAtUzWarehouseForLogistica (Clientga yuborish).
 */
async function updateShipmentProcessStepForLogistica(
  logisticaId,
  shipmentIdRaw,
  processStepRaw,
) {
  const { shipment } = await loadShipmentForLogistica(logisticaId, shipmentIdRaw);
  if (String(shipment.logisticaId) !== String(logisticaId)) {
    throw new HttpError(
      409,
      "Avval so‘rovni qabul qiling",
      "SHIPMENT_NOT_ACCEPTED",
    );
  }
  await applyYuklarimProcessStep(shipment, processStepRaw);

  const siblingRows = await loadAcceptedSiblingShipments(shipment, logisticaId);
  for (const siblingRow of siblingRows) {
    const sibling = await CargoShipment.findById(siblingRow._id);
    if (!sibling) continue;
    try {
      await applyYuklarimProcessStep(sibling, processStepRaw);
    } catch (error) {
      if (Number(error?.status) === 409) continue;
      throw error;
    }
  }

  const lean = shipment.toObject ? shipment.toObject() : shipment;
  const siblings = await loadAcceptedSiblingShipments(shipment, logisticaId);
  return {
    shipment: mergeGroupDetail(lean, siblings),
  };
}

/**
 * UZB ish stoli — Clientga yuborish:
 * og‘irlik + summa → processStep = toshkent_omborida.
 * Guruh: fee/comment/photo faqat form yuborilgan (primary) shipmentda;
 * siblinglar faqat Toshkentga o‘tadi (alohida to‘lov yo‘q).
 * payload.itemWeights[{shipmentId, weightKg}] — har mahsulot kg; weightKg = umumiy.
 */
async function arriveShipmentAtUzWarehouseForLogistica(
  logisticaId,
  shipmentIdRaw,
  payload = {},
) {
  const { shipment } = await loadShipmentForLogistica(logisticaId, shipmentIdRaw);
  if (String(shipment.logisticaId) !== String(logisticaId)) {
    throw new HttpError(409, "Avval so‘rovni qabul qiling", "SHIPMENT_NOT_ACCEPTED");
  }

  const siblingRows = await loadAcceptedSiblingShipments(shipment, logisticaId);
  assertItemWeightsForGroup(payload, [
    shipment._id,
    ...siblingRows.map((row) => row._id),
  ]);

  const result = await applyUzWarehouseArrival(shipment, payload, {
    attachFee: true,
  });

  for (const siblingRow of siblingRows) {
    const sibling = await CargoShipment.findById(siblingRow._id);
    if (!sibling) continue;
    try {
      await applyUzWarehouseArrival(sibling, payload, { attachFee: false });
    } catch (error) {
      if (Number(error?.status) === 409) continue;
      throw error;
    }
  }

  const lean = shipment.toObject ? shipment.toObject() : shipment;
  const siblings = await loadAcceptedSiblingShipments(shipment, logisticaId);
  return {
    shipment: mergeGroupDetail(lean, siblings),
    alreadyArrived: Boolean(result.alreadyArrived),
  };
}

function normalizeSelectedShipmentIds(primaryId, payload = {}, allowedIds = null) {
  const primary = String(primaryId || "").trim();
  const raw = Array.isArray(payload.shipmentIds) ? payload.shipmentIds : [];
  const selected = [
    ...new Set(
      raw
        .map((value) => String(value || "").trim())
        .filter((id) => mongoose.isValidObjectId(id)),
    ),
  ];
  if (!selected.length && mongoose.isValidObjectId(primary)) {
    // Tanlov yo‘q → butun guruh (allowedIds); aks holda faqat primary
    if (allowedIds instanceof Set && allowedIds.size > 0) {
      return [...allowedIds].filter((id) => mongoose.isValidObjectId(id));
    }
    return [primary];
  }
  return selected;
}

/**
 * selections[{shipmentId, unitIndex}] yoki shipmentIds.
 * Tanlov bo‘sh + allowedIds → guruhdagi barcha shipment (siblinglar qolib ketmasin).
 */
function normalizeReturnSelections(primaryId, payload = {}, allowedIds = null) {
  const rawSelections = Array.isArray(payload.selections) ? payload.selections : null;
  if (rawSelections?.length) {
    return rawSelections
      .map((row) => ({
        shipmentId: String(row?.shipmentId || "").trim(),
        unitIndex:
          row?.unitIndex == null
            ? null
            : Math.max(0, Math.floor(Number(row.unitIndex) || 0)),
      }))
      .filter((row) => mongoose.isValidObjectId(row.shipmentId));
  }

  const shipmentIds = normalizeSelectedShipmentIds(primaryId, payload, allowedIds);
  const unitRaw = payload.unitIndexes ?? payload.unitIndex;
  const hasUnitHint = unitRaw != null && !(Array.isArray(unitRaw) && !unitRaw.length);

  // unitIndexes faqat primary shipmentga; siblinglar — birinchi faol dona
  if (hasUnitHint && shipmentIds.length === 1) {
    const indexes = Array.isArray(unitRaw) ? unitRaw : [unitRaw];
    return indexes.map((unitIndex) => ({
      shipmentId: shipmentIds[0],
      unitIndex: Math.max(0, Math.floor(Number(unitIndex) || 0)),
    }));
  }

  if (hasUnitHint && shipmentIds[0] === String(primaryId)) {
    const indexes = Array.isArray(unitRaw) ? unitRaw : [unitRaw];
    const primaryUnits = indexes.map((unitIndex) => ({
      shipmentId: String(primaryId),
      unitIndex: Math.max(0, Math.floor(Number(unitIndex) || 0)),
    }));
    const siblingUnits = shipmentIds
      .filter((id) => id !== String(primaryId))
      .map((shipmentId) => ({ shipmentId, unitIndex: null }));
    return [...primaryUnits, ...siblingUnits];
  }

  return shipmentIds.map((shipmentId) => ({
    shipmentId,
    unitIndex: null,
  }));
}

/**
 * Sotuvchiga qaytarish so‘rovi — asosiy admin tasdiqlamaguncha yakunlanmaydi.
 * Tanlash: selections[{ shipmentId, unitIndex }] yoki shipmentIds (+ ixtiyoriy unitIndexes).
 * Yakunlash: cargoReturnRequestService.confirmCargoReturnByLogistica
 * To‘langan buyurtma → confirm dan keyin «Mijozga pul qaytarish».
 */
async function returnShipmentToSellerForLogistica(logisticaId, shipmentIdRaw, payload = {}) {
  const { shipment: primary } = await loadShipmentForLogistica(
    logisticaId,
    shipmentIdRaw,
  );
  const primaryId = String(primary._id);
  const status = String(primary.status || "");

  const allowedIds = new Set([primaryId]);
  if (status === "pending") {
    const siblings = await loadPendingSiblingShipments(primary);
    for (const row of siblings) allowedIds.add(String(row._id));
  } else if (
    status === "accepted" ||
    status === "return_request_pending" ||
    status === "return_approved"
  ) {
    const siblings = await loadGroupSiblingShipmentsForDetail(
      primary,
      logisticaId,
    );
    for (const row of siblings) allowedIds.add(String(row._id));
  }

  // Tanlov yo‘q → butun guruh (siblinglar primaryda qolib ketmasin)
  const selections = normalizeReturnSelections(primaryId, payload, allowedIds);
  if (!selections.length) {
    throw new HttpError(
      400,
      "Qaytariladigan mahsulotni tanlang",
      "RETURN_SELECTION_REQUIRED",
    );
  }

  for (const row of selections) {
    if (!allowedIds.has(row.shipmentId)) {
      throw new HttpError(
        400,
        "Tanlangan yuk bu guruhga tegishli emas",
        "RETURN_SELECTION_INVALID",
      );
    }
  }

  const comment = String(payload.comment || "").trim();
  const results = [];
  for (const row of selections) {
    const unitPayload =
      row.unitIndex == null
        ? { comment }
        : { comment, unitIndex: row.unitIndex };
    const result = await createCargoReturnRequestForLogistica(
      logisticaId,
      row.shipmentId,
      unitPayload,
    );
    results.push(result);
  }

  const first = results[0];
  const returnedId = String(
    first?.shipment?.id || selections[0]?.shipmentId || primaryId,
  );
  const lean = await CargoShipment.findById(returnedId).lean();
  const siblings = lean
    ? await loadGroupSiblingShipmentsForDetail(lean, logisticaId)
    : [];
  return {
    request: first.request,
    requests: results.map((row) => row.request),
    shipment: lean
      ? mergeGroupDetail(lean, siblings)
      : toLogisticaShipmentDetail(primary.toObject?.() || primary),
    returnedShipmentIds: [
      ...new Set(selections.map((row) => row.shipmentId)),
    ],
    alreadyRequested: results.every((row) => Boolean(row.alreadyRequested)),
  };
}

function paginateQuery(query = {}) {
  const page = Math.max(1, Math.floor(toNumber(query.page, 1)));
  const limit = Math.min(
    100,
    Math.max(1, Math.floor(toNumber(query.limit, DEFAULT_PAGE_SIZE))),
  );
  return { page, limit };
}

/**
 * Yuklarim — qabul qilingan, hali UZB oqimiga (bojxona+) o‘tmagan.
 */
async function listAcceptedShipmentsForLogistica(logisticaId, query = {}) {
  await loadActiveLogistica(logisticaId);
  const { page, limit } = paginateQuery(query);

  const filter = {
    status: "accepted",
    logisticaId,
    paidAt: null,
    $or: [
      { processStep: null },
      { processStep: { $exists: false } },
      { processStep: { $nin: UZB_WAREHOUSE_LIST_STEPS } },
    ],
  };

  const rows = await CargoShipment.find(filter)
    .sort({ acceptedAt: -1, submittedAt: -1 })
    .limit(500)
    .lean();

  const grouped = groupLogisticaShipmentCards(rows.map(toLogisticaShipmentCard));
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

/**
 * UZBda — bojxonada (kelish kutilmoqda) yoki toshkent (To‘landi kutilmoqda).
 */
async function listUzWarehouseShipmentsForLogistica(logisticaId, query = {}) {
  await loadActiveLogistica(logisticaId);
  const { page, limit } = paginateQuery(query);

  const filter = {
    status: "accepted",
    logisticaId,
    processStep: { $in: UZB_WAREHOUSE_LIST_STEPS },
    paidAt: null,
  };

  const rows = await CargoShipment.find(filter)
    .sort({ updatedAt: -1, acceptedAt: -1 })
    .limit(500)
    .lean();

  const grouped = groupLogisticaShipmentCards(rows.map(toLogisticaShipmentCard));
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

/**
 * To‘landi — faqat Toshkent omborida. Keyin asosiy admin Xorij→UZB ga chiqadi.
 * Fee-bearer To‘landi bo‘lgach, guruh siblinglarga paidAt yoyiladi (balans faqat bearer fee).
 */
async function markShipmentPaidForLogistica(logisticaId, shipmentIdRaw) {
  const { shipment } = await loadShipmentForLogistica(logisticaId, shipmentIdRaw);
  if (String(shipment.logisticaId) !== String(logisticaId)) {
    throw new HttpError(409, "Avval so‘rovni qabul qiling", "SHIPMENT_NOT_ACCEPTED");
  }
  const result = await applyMarkShipmentPaid(shipment);

  let paidSiblingCount = 0;
  if (isCargoFeeBearer(shipment) && shipment.paidAt) {
    paidSiblingCount = await fanOutPaidAtToGroupCompanions(shipment);
  }

  return {
    shipment: toLogisticaShipmentDetail(shipment.toObject()),
    alreadyPaid: Boolean(result.alreadyPaid),
    paidSiblingCount,
  };
}

module.exports = {
  listPendingShipmentsForLogistica,
  listAcceptedShipmentsForLogistica,
  listUzWarehouseShipmentsForLogistica,
  getShipmentDetailForLogistica,
  acceptShipmentForLogistica,
  updateShipmentProcessStepForLogistica,
  arriveShipmentAtUzWarehouseForLogistica,
  returnShipmentToSellerForLogistica,
  markShipmentPaidForLogistica,
  toLogisticaShipmentCard,
  toLogisticaShipmentDetail,
  toPublicCargoShipment,
  groupLogisticaShipmentCards,
  mergeGroupDetail,
  normalizeReturnSelections,
  normalizeSelectedShipmentIds,
  YUKLARIM_PROCESS_STEPS,
  UZB_WAREHOUSE_LIST_STEPS,
};
