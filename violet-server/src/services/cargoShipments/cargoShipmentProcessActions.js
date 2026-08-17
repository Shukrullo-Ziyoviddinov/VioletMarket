/**
 * Cargo jarayon amallari — bitta qoida.
 * Logistica app va asosiy admin shu funksiyalarni chaqiradi.
 * Saqlash: CargoShipment (+ order tracking accept da).
 */

const mongoose = require("mongoose");
const { Order } = require("../../models/order");
const { CargoShipment } = require("../../models/cargoShipment");
const { HttpError } = require("../../utils/httpError");
const {
  normalizeOrderTrackingStatus,
} = require("../../productManagement/orderTracking");
const {
  applyItemPipelineStatus,
} = require("../../productManagement/orderItemUnitPipelineSync");
const {
  normalizeCargoCountry,
} = require("../../utils/cargoCountryNormalize");
const {
  parseOptionalArrivalPhoto,
} = require("./cargoUzArrivalPhotoStorage");
const {
  recordHandedOverHistory,
} = require("./cargoLogisticaHistoryService");
const {
  assertAdminCargoFeeConfirmedForMarkPaid,
  canLogisticaMarkPaid,
} = require("../../productManagement/foreignCargoFeePayment");
const { applyCargoLaneMongoFilter } = require("../../utils/cargoServiceType");

const YUKLARIM_PROCESS_STEPS = ["xitoy_omborida", "yolda", "bojxonada"];
const YUKLARIM_PROCESS_STEP_SET = new Set(YUKLARIM_PROCESS_STEPS);
const UZB_WAREHOUSE_LIST_STEPS = ["bojxonada", "toshkent_omborida"];
const UZB_WAREHOUSE_LIST_STEP_SET = new Set(UZB_WAREHOUSE_LIST_STEPS);

function syncShipmentClaimFields(shipment, row) {
  shipment.status = row.status;
  shipment.logisticaId = row.logisticaId;
  shipment.acceptedAt = row.acceptedAt;
  shipment.processStep = row.processStep;
  shipment.sellerCountry = row.sellerCountry;
}

async function markOrderItemHandedToCargo(orderId, itemIndex, sellerId, at) {
  const order = await Order.findOne({ id: Number(orderId) });
  if (!order) {
    throw new HttpError(404, "Buyurtma topilmadi", "ORDER_NOT_FOUND");
  }
  const item = order.items?.[itemIndex];
  if (!item || String(item.sellerId || "").trim() !== String(sellerId).trim()) {
    throw new HttpError(404, "Buyurtma mahsuloti topilmadi", "ORDER_ITEM_NOT_FOUND");
  }

  const status = normalizeOrderTrackingStatus(item.trackingStatus);
  if (status === "handed_to_cargo") {
    return { order, item, already: true };
  }
  if (status !== "ready_for_cargo") {
    throw new HttpError(
      409,
      "Buyurtma cargoga yuborilmagan",
      "ORDER_TRACKING_STATUS_CONFLICT",
    );
  }

  applyItemPipelineStatus(item, "handed_to_cargo", at);
  order.markModified("items");
  await order.save();
  return { order, item, already: false };
}

/**
 * pending → accepted (atomic claim); order item → handed_to_cargo.
 * Parallel qabulda faqat birinchi logisticaId yoziladi.
 */
async function applyAcceptShipment(shipment, logisticaId) {
  const lid = String(logisticaId || "").trim();
  if (!lid) {
    throw new HttpError(400, "Logistica ID talab qilinadi", "LOGISTICA_ID_REQUIRED");
  }
  if (!mongoose.isValidObjectId(lid)) {
    throw new HttpError(400, "Logistica ID noto‘g‘ri", "INVALID_LOGISTICA_ID");
  }

  const status = String(shipment.status || "");
  if (status === "accepted" && String(shipment.logisticaId) === lid) {
    return { alreadyAccepted: true };
  }

  if (status !== "pending") {
    throw new HttpError(
      409,
      "Faqat kutilayotgan so‘rovni qabul qilish mumkin",
      "SHIPMENT_STATUS_CONFLICT",
    );
  }

  const acceptedAt = new Date();
  const sellerCountry =
    normalizeCargoCountry(shipment.sellerCountry) || shipment.sellerCountry;

  const claimed = await CargoShipment.findOneAndUpdate(
    { _id: shipment._id, status: "pending" },
    {
      $set: {
        status: "accepted",
        logisticaId: lid,
        acceptedAt,
        processStep: null,
        sellerCountry,
      },
    },
    { new: true },
  );

  if (!claimed) {
    const current = await CargoShipment.findById(shipment._id);
    if (
      current &&
      String(current.status || "") === "accepted" &&
      String(current.logisticaId) === lid
    ) {
      syncShipmentClaimFields(shipment, current);
      return { alreadyAccepted: true };
    }
    throw new HttpError(
      409,
      "So‘rov boshqa logistica tomonidan qabul qilingan",
      "SHIPMENT_STATUS_CONFLICT",
    );
  }

  syncShipmentClaimFields(shipment, claimed);

  try {
    await markOrderItemHandedToCargo(
      shipment.orderId,
      shipment.itemIndex,
      shipment.sellerId,
      acceptedAt,
    );
  } catch (error) {
    await CargoShipment.updateOne(
      {
        _id: shipment._id,
        status: "accepted",
        logisticaId: lid,
        acceptedAt,
      },
      {
        $set: {
          status: "pending",
          logisticaId: null,
          acceptedAt: null,
          processStep: null,
        },
      },
    );
    shipment.status = "pending";
    shipment.logisticaId = null;
    shipment.acceptedAt = null;
    shipment.processStep = null;
    throw error;
  }

  return { alreadyAccepted: false };
}

/**
 * Yuklarim steplari — faqat oldinga: xitoy → yolda → bojxona.
 * Skip / orqaga blok. Toshkent faqat applyUzWarehouseArrival.
 */
async function applyYuklarimProcessStep(shipment, processStepRaw) {
  const status = String(shipment.status || "");
  if (status !== "accepted") {
    throw new HttpError(
      409,
      "Avval so‘rovni qabul qiling",
      "SHIPMENT_NOT_ACCEPTED",
    );
  }

  if (shipment.paidAt) {
    throw new HttpError(
      409,
      "To‘langan yuk holatini o‘zgartirib bo‘lmaydi",
      "SHIPMENT_ALREADY_PAID",
    );
  }

  const processStep = String(processStepRaw || "")
    .trim()
    .toLowerCase();

  if (processStep === "toshkent_omborida") {
    throw new HttpError(
      409,
      "Toshkent omboriga «Clientga yuborish» orqali o‘ting",
      "USE_UZ_ARRIVAL",
    );
  }

  if (!YUKLARIM_PROCESS_STEP_SET.has(processStep)) {
    throw new HttpError(400, "Jarayon holati noto‘g‘ri", "INVALID_PROCESS_STEP");
  }

  const current = String(shipment.processStep || "")
    .trim()
    .toLowerCase();

  if (UZB_WAREHOUSE_LIST_STEP_SET.has(current)) {
    throw new HttpError(
      409,
      "Bu yuk allaqachon UZBda — Yuklarim holatini o‘zgartirib bo‘lmaydi",
      "ALREADY_IN_UZ_WAREHOUSE_FLOW",
    );
  }

  if (current === processStep) {
    return { alreadySame: true };
  }

  const currentIndex = current
    ? YUKLARIM_PROCESS_STEPS.indexOf(current)
    : -1;
  const nextIndex = YUKLARIM_PROCESS_STEPS.indexOf(processStep);
  const expectedIndex = currentIndex + 1;

  if (nextIndex !== expectedIndex) {
    throw new HttpError(
      409,
      "Jarayon holatini faqat ketma-ket oldinga o‘zgartirish mumkin",
      "PROCESS_STEP_ORDER",
    );
  }

  shipment.processStep = processStep;
  await shipment.save();
  return { alreadySame: false };
}

/** Guruh uchun umumiy to‘lov yozuvi shu shipmentda. */
function isCargoFeeBearer(shipment) {
  return Boolean(shipment?.cargoFeePaymentRequired);
}

/**
 * Bir orderId+sellerId guruhida faqat bitta fee-bearer bo‘lishi kerak.
 * DB qatori (boshqa shipment) berilganda — 409.
 */
function raiseIfOtherGroupFeeBearer(shipment, otherBearer) {
  if (!otherBearer) return;
  const otherId = String(otherBearer._id || otherBearer.id || "").trim();
  const selfId = String(shipment?._id || shipment?.id || "").trim();
  if (!otherId) return;
  if (selfId && otherId === selfId) return;

  const code = String(otherBearer.requestCode || "").trim();
  throw new HttpError(
    409,
    code
      ? `Guruh to‘lovi allaqachon «${code}» yukiga biriktirilgan. Ikkinchi fee yozib bo‘lmaydi.`
      : "Guruh to‘lovi allaqachon biriktirilgan. Ikkinchi fee yozib bo‘lmaydi.",
    "GROUP_FEE_ALREADY_ATTACHED",
  );
}

/** orderId+sellerId guruhida boshqa cargoFeePaymentRequired=true bormi */
async function findOtherGroupFeeBearer(shipment) {
  const orderId = Number(shipment?.orderId) || 0;
  const sellerId = String(shipment?.sellerId || "").trim();
  const selfId = String(shipment?._id || "").trim();
  if (!orderId || !sellerId || !selfId) return null;

  return CargoShipment.findOne({
    orderId,
    sellerId,
    cargoFeePaymentRequired: true,
    status: { $nin: ["cancelled"] },
    _id: { $ne: shipment._id },
    ...applyCargoLaneMongoFilter({}, shipment),
  })
    .select({ _id: 1, requestCode: 1 })
    .lean();
}

async function assertNoOtherGroupFeeBearer(shipment) {
  const other = await findOtherGroupFeeBearer(shipment);
  raiseIfOtherGroupFeeBearer(shipment, other);
}

/**
 * payload.itemWeights[{ shipmentId, weightKg }]
 * — har bir mahsulot (shipment) uchun alohida kg.
 */
function resolveOptionalItemWeightKg(payload, shipmentId) {
  const rows = Array.isArray(payload?.itemWeights) ? payload.itemWeights : [];
  const id = String(shipmentId || "").trim();
  if (!id || !rows.length) return null;
  const match = rows.find((row) => String(row?.shipmentId || "").trim() === id);
  if (!match) return null;
  const weightKg = Number(match.weightKg);
  if (!Number.isFinite(weightKg) || weightKg <= 0) return null;
  return Math.round(weightKg * 1000) / 1000;
}

/** Yaroqli itemWeights yig‘indisi (noto‘g‘ri qatorlar tashlanadi). */
function sumPayloadItemWeights(payload) {
  const rows = Array.isArray(payload?.itemWeights) ? payload.itemWeights : [];
  let sum = 0;
  let count = 0;
  for (const row of rows) {
    const id = String(row?.shipmentId || "").trim();
    const kg = Number(row?.weightKg);
    if (!id || !Number.isFinite(kg) || kg <= 0) continue;
    sum += kg;
    count += 1;
  }
  return {
    sum: Math.round(sum * 1000) / 1000,
    count,
  };
}

/**
 * itemWeights yuborilgan bo‘lsa: weightKg ≈ yig‘indi.
 * itemWeights yo‘q → faqat weightKg (eski yo‘l); jim o‘tkazilmaydi.
 */
function assertWeightKgMatchesItemWeights(payload) {
  const { sum, count } = sumPayloadItemWeights(payload);
  if (count === 0) return;

  const total = Number(payload?.weightKg);
  if (!Number.isFinite(total) || total <= 0) {
    throw new HttpError(400, "Og‘irlikni to‘g‘ri kiriting", "INVALID_WEIGHT");
  }
  if (Math.abs(sum - total) > 0.051) {
    throw new HttpError(
      400,
      "Umumiy og‘irlik mahsulotlar yig‘indisiga teng emas",
      "WEIGHT_SUM_MISMATCH",
    );
  }
}

/**
 * Guruh (2+ shipment): har bir id uchun itemWeights majburiy.
 * Bitta shipment: weightKg yetadi (eski yo‘l).
 * itemWeights bo‘lsa — weightKg yig‘indi bilan mos (har doim).
 */
function assertItemWeightsForGroup(payload, shipmentIds = []) {
  const ids = [
    ...new Set(
      (Array.isArray(shipmentIds) ? shipmentIds : [])
        .map((id) => String(id || "").trim())
        .filter(Boolean),
    ),
  ];

  if (ids.length > 1) {
    for (const id of ids) {
      if (resolveOptionalItemWeightKg(payload, id) == null) {
        throw new HttpError(
          400,
          "Guruhda har bir mahsulot og‘irligini alohida kiriting",
          "ITEM_WEIGHTS_REQUIRED",
        );
      }
    }
  }

  assertWeightKgMatchesItemWeights(payload);
}

/** O‘lchangan kg ni products[] da ham ko‘rsatish (itemda alohida). */
function syncShipmentProductWeights(shipment, weightKg) {
  const products = Array.isArray(shipment.products) ? shipment.products : [];
  if (!products.length) return;
  const kg = Math.round(Number(weightKg) * 1000) / 1000;
  if (!(kg > 0)) return;
  if (products.length === 1) {
    products[0].weightKg = kg;
    return;
  }
  const prevTotal = products.reduce(
    (sum, row) => sum + Math.max(0, Number(row.weightKg) || 0),
    0,
  );
  if (prevTotal > 0) {
    for (const row of products) {
      const share = Math.max(0, Number(row.weightKg) || 0) / prevTotal;
      row.weightKg = Math.round(kg * share * 1000) / 1000;
    }
    return;
  }
  products[0].weightKg = kg;
}

/**
 * Clientga yuborish: og‘irlik + summa → toshkent_omborida.
 *
 * options.attachFee (default true):
 *   true  — fee-bearer: kg + summa + comment/photo + cargoFeePaymentRequired
 *   false — guruh sibling: faqat Toshkentga o‘tadi; to‘lov talab qilinmaydi
 *
 * weightKg — guruh umumiy (validatsiya); itemWeights bo‘lsa har bir shipment o‘z kg sini oladi.
 */
async function applyUzWarehouseArrival(shipment, payload = {}, options = {}) {
  const attachFee = options.attachFee !== false;
  const status = String(shipment.status || "");
  if (status !== "accepted") {
    throw new HttpError(409, "Avval so‘rovni qabul qiling", "SHIPMENT_NOT_ACCEPTED");
  }

  if (shipment.paidAt) {
    throw new HttpError(
      409,
      "To‘langan yukni qayta yuborib bo‘lmaydi",
      "SHIPMENT_ALREADY_PAID",
    );
  }

  if (
    String(shipment.processStep || "") === "toshkent_omborida" &&
    shipment.uzArrivedAt
  ) {
    return { alreadyArrived: true };
  }

  if (String(shipment.processStep || "") !== "bojxonada") {
    throw new HttpError(
      409,
      "Avval «Bojxonada» holatini belgilang",
      "NOT_IN_CUSTOMS",
    );
  }

  const arrivedAt = new Date();

  if (!attachFee) {
    const itemWeight = resolveOptionalItemWeightKg(payload, shipment._id);
    if (itemWeight != null) {
      shipment.weightKg = itemWeight;
      shipment.weightLabel = "Og'irlik";
      syncShipmentProductWeights(shipment, itemWeight);
    }
    shipment.cargoDeliveryFee = 0;
    shipment.cargoFeePaymentRequired = false;
    shipment.uzArrivedAt = arrivedAt;
    shipment.processStep = "toshkent_omborida";
    await shipment.save();
    return { alreadyArrived: false, feeAttached: false };
  }

  // Ikkinchi fee-bearer blok: guruhda allaqachon to‘lov biriktirilgan bo‘lsa
  await assertNoOtherGroupFeeBearer(shipment);

  // itemWeights kelgan bo‘lsa weightKg yig‘indi bilan mosligi (caller aylanib o‘tmasin)
  assertWeightKgMatchesItemWeights(payload);

  const weightKg = Number(payload.weightKg);
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    throw new HttpError(400, "Og‘irlikni to‘g‘ri kiriting", "INVALID_WEIGHT");
  }

  const cargoDeliveryFee = Number(payload.cargoDeliveryFee);
  if (!Number.isFinite(cargoDeliveryFee) || cargoDeliveryFee < 0) {
    throw new HttpError(400, "Og‘irlik summasini to‘g‘ri kiriting", "INVALID_FEE");
  }

  const comment = String(payload.comment || payload.uzArrivalComment || "").trim();
  const photoUrl = parseOptionalArrivalPhoto(
    payload.photoBase64 || payload.imageBase64,
  );

  const itemWeight = resolveOptionalItemWeightKg(payload, shipment._id);
  const appliedWeight =
    itemWeight != null ? itemWeight : Math.round(weightKg * 1000) / 1000;

  shipment.weightKg = appliedWeight;
  shipment.weightLabel = "Og'irlik";
  syncShipmentProductWeights(shipment, appliedWeight);
  shipment.cargoDeliveryFee = Math.round(cargoDeliveryFee);
  shipment.uzArrivalComment = comment;
  if (photoUrl) {
    shipment.uzArrivalPhotoUrl = photoUrl;
  }
  shipment.uzArrivedAt = arrivedAt;
  shipment.processStep = "toshkent_omborida";
  shipment.cargoFeePaymentRequired = true;
  await shipment.save();
  return { alreadyArrived: false, feeAttached: true };
}

/**
 * To‘landi → admin Xorij→UZB ga chiqadi.
 * Toshkent faqat Clientga yuborish orqali: processStep + uzArrivedAt.
 */
async function applyMarkShipmentPaid(shipment) {
  const status = String(shipment.status || "");
  if (status !== "accepted") {
    throw new HttpError(409, "Avval so‘rovni qabul qiling", "SHIPMENT_NOT_ACCEPTED");
  }

  if (String(shipment.processStep || "") !== "toshkent_omborida") {
    throw new HttpError(
      409,
      "Avval «Clientga yuborish» orqali Toshkent omboriga o‘ting",
      "NOT_IN_UZ_WAREHOUSE",
    );
  }

  if (!shipment.uzArrivedAt) {
    throw new HttpError(
      409,
      "Avval «Clientga yuborish» orqali Toshkent omboriga o‘ting",
      "UZ_ARRIVAL_REQUIRED",
    );
  }

  // Guruh sibling (Toshkent, fee yo‘q) — To‘landi faqat fee-bearer orqali + fan-out
  if (
    !isCargoFeeBearer(shipment) &&
    Number(shipment.cargoDeliveryFee) === 0 &&
    shipment.uzArrivedAt
  ) {
    throw new HttpError(
      409,
      "Guruh to‘lovi asosiy yuk orqali To‘landi qilinadi",
      "GROUP_FEE_BEARER_REQUIRED",
    );
  }

  assertAdminCargoFeeConfirmedForMarkPaid(shipment);

  if (shipment.paidAt) {
    await recordHandedOverHistory(shipment, shipment.paidAt);
    return { alreadyPaid: true };
  }

  shipment.paidAt = new Date();
  await shipment.save();
  await recordHandedOverHistory(shipment, shipment.paidAt);
  return { alreadyPaid: false };
}

/**
 * Fee-bearer To‘landi dan keyin: guruh siblinglariga paidAt (tarix/balans yozilmaydi).
 */
async function applyPaidAtToGroupCompanion(shipment, paidAt) {
  if (!shipment) return { skipped: true };
  if (shipment.paidAt) return { alreadyPaid: true };
  if (String(shipment.processStep || "") !== "toshkent_omborida") {
    return { skipped: true };
  }
  if (!shipment.uzArrivedAt) return { skipped: true };
  if (isCargoFeeBearer(shipment)) return { skipped: true };

  const at = paidAt instanceof Date ? paidAt : new Date(paidAt || Date.now());
  shipment.paidAt = at;
  await shipment.save();
  return { alreadyPaid: false };
}

/**
 * orderId+sellerId guruhidagi Toshkent siblinglarga paidAt yoyish.
 * @returns {number} yangi yozilgan sibling soni
 */
async function fanOutPaidAtToGroupCompanions(feeBearer) {
  if (!feeBearer?.paidAt || !isCargoFeeBearer(feeBearer)) return 0;

  const orderId = Number(feeBearer.orderId) || 0;
  const sellerId = String(feeBearer.sellerId || "").trim();
  if (!orderId || !sellerId) return 0;

  const rows = await CargoShipment.find(
    applyCargoLaneMongoFilter(
      {
        orderId,
        sellerId,
        status: "accepted",
        paidAt: null,
        processStep: "toshkent_omborida",
        uzArrivedAt: { $ne: null },
        _id: { $ne: feeBearer._id },
      },
      feeBearer,
    ),
  );

  let count = 0;
  for (const sibling of rows) {
    const result = await applyPaidAtToGroupCompanion(sibling, feeBearer.paidAt);
    if (result && !result.skipped && !result.alreadyPaid) count += 1;
  }
  return count;
}

module.exports = {
  YUKLARIM_PROCESS_STEPS,
  UZB_WAREHOUSE_LIST_STEPS,
  markOrderItemHandedToCargo,
  applyAcceptShipment,
  applyYuklarimProcessStep,
  applyUzWarehouseArrival,
  applyMarkShipmentPaid,
  applyPaidAtToGroupCompanion,
  fanOutPaidAtToGroupCompanions,
  isCargoFeeBearer,
  raiseIfOtherGroupFeeBearer,
  findOtherGroupFeeBearer,
  assertNoOtherGroupFeeBearer,
  resolveOptionalItemWeightKg,
  sumPayloadItemWeights,
  assertWeightKgMatchesItemWeights,
  assertItemWeightsForGroup,
  canLogisticaMarkPaid,
};
