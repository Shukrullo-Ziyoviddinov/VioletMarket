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

  item.trackingStatus = "handed_to_cargo";
  if (!Array.isArray(item.trackingHistory)) item.trackingHistory = [];
  item.trackingHistory.push({ status: "handed_to_cargo", at });
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

/**
 * Clientga yuborish: og‘irlik + summa → toshkent_omborida.
 */
async function applyUzWarehouseArrival(shipment, payload = {}) {
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

  const arrivedAt = new Date();
  shipment.weightKg = Math.round(weightKg * 1000) / 1000;
  shipment.weightLabel = "Og'irlik";
  shipment.cargoDeliveryFee = Math.round(cargoDeliveryFee);
  shipment.uzArrivalComment = comment;
  if (photoUrl) {
    shipment.uzArrivalPhotoUrl = photoUrl;
  }
  shipment.uzArrivedAt = arrivedAt;
  shipment.processStep = "toshkent_omborida";
  shipment.cargoFeePaymentRequired = true;
  await shipment.save();
  return { alreadyArrived: false };
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

module.exports = {
  YUKLARIM_PROCESS_STEPS,
  UZB_WAREHOUSE_LIST_STEPS,
  markOrderItemHandedToCargo,
  applyAcceptShipment,
  applyYuklarimProcessStep,
  applyUzWarehouseArrival,
  applyMarkShipmentPaid,
  canLogisticaMarkPaid,
};
