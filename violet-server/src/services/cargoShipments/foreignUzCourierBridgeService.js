/**
 * Xorij cargo → Toshkent ombori → UZB kuryer zanjiri ko‘prigi.
 * Faqat asosiy admin «Xorij → UZB» orqali.
 * Local handoffSellerOrderItem ga tegmaydi.
 *
 * Handoffda admin ombor manzilini kiritadi (matn majburiy, coords ixtiyoriy).
 */

const { Order } = require("../../models/order");
const { SellerAccount } = require("../../models/sellerAccount");
const { CargoShipment } = require("../../models/cargoShipment");
const { HttpError } = require("../../utils/httpError");
const {
  normalizeOrderTrackingStatus,
  resolveSellerPipelineMode,
} = require("../../productManagement/orderTracking");
const {
  isUzWarehouseReadyProcessStep,
  UZ_WAREHOUSE_READY_PROCESS_STEP,
} = require("../../productManagement/foreignOrderTracking");
const {
  normalizeUzWarehousePickupInput,
  snapshotUzWarehousePickup,
} = require("../../productManagement/foreignUzWarehousePickup");

function cleanSellerId(value) {
  return String(value || "").trim();
}

function parsePositiveInteger(value, fieldName) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new HttpError(400, `${fieldName} noto'g'ri`, "VALIDATION_ERROR");
  }
  return number;
}

/**
 * Toshkent omborida + To‘landi + handed_to_cargo — UZB kuryerga tayyor.
 */
function isShipmentReadyForUzCourier(shipment) {
  if (!shipment) return false;
  if (String(shipment.status || "") !== "accepted") return false;
  if (!isUzWarehouseReadyProcessStep(shipment.processStep)) return false;
  return Boolean(shipment.paidAt);
}

async function loadForeignSellerAccount(sellerId) {
  const account = await SellerAccount.findOne({ id: sellerId })
    .select({ id: 1, sellerCountry: 1 })
    .lean();
  if (!account) {
    throw new HttpError(404, "Sotuvchi topilmadi", "SELLER_NOT_FOUND");
  }
  if (resolveSellerPipelineMode(account.sellerCountry) !== "foreign") {
    throw new HttpError(
      409,
      "Faqat xorij sillerlari uchun",
      "LOCAL_SELLER_BRIDGE_FORBIDDEN",
    );
  }
  return account;
}

/**
 * Admin: handed_to_cargo (+ Toshkent ombori + To‘landi) → handed_to_courier.
 * pickupPayload: { address, coordinates?, phone?, label? }
 */
async function handoffForeignItemToUzCourier(
  sellerId,
  orderIdRaw,
  itemIndexRaw,
  pickupPayload = {},
) {
  const normalizedSellerId = cleanSellerId(sellerId);
  if (!normalizedSellerId) {
    throw new HttpError(400, "Seller ID topilmadi", "VALIDATION_ERROR");
  }

  await loadForeignSellerAccount(normalizedSellerId);

  const orderId = parsePositiveInteger(orderIdRaw, "orderId");
  const itemIndex = parsePositiveInteger(itemIndexRaw, "itemIndex");
  const order = await Order.findOne({ id: orderId });
  if (!order) {
    throw new HttpError(404, "Buyurtma topilmadi", "ORDER_NOT_FOUND");
  }

  const item = order.items?.[itemIndex];
  if (!item || cleanSellerId(item.sellerId) !== normalizedSellerId) {
    throw new HttpError(404, "Buyurtma mahsuloti topilmadi", "ORDER_ITEM_NOT_FOUND");
  }

  const currentStatus = normalizeOrderTrackingStatus(item.trackingStatus);
  const warehousePickup = normalizeUzWarehousePickupInput(pickupPayload);

  if (currentStatus === "handed_to_courier") {
    // Qayta tasdiq: manzilni yangilash mumkin
    item.uzWarehousePickup = warehousePickup;
    order.markModified("items");
    await order.save();

    const handedEntry = (Array.isArray(item.trackingHistory) ? item.trackingHistory : [])
      .find((entry) => String(entry?.status || "") === "handed_to_courier");
    return {
      orderId,
      itemIndex,
      trackingStatus: "handed_to_courier",
      handedToCourierAt: handedEntry?.at || null,
      uzWarehousePickup: snapshotUzWarehousePickup(item.uzWarehousePickup),
      alreadyHanded: true,
    };
  }

  if (currentStatus !== "handed_to_cargo") {
    throw new HttpError(
      409,
      "Avval cargo logistica orqali Toshkent omboriga yetkazilishi kerak",
      "FOREIGN_NOT_READY_FOR_UZ_COURIER",
    );
  }

  const shipment = await CargoShipment.findOne({
    orderId,
    itemIndex,
    sellerId: normalizedSellerId,
  }).lean();

  if (!isShipmentReadyForUzCourier(shipment)) {
    throw new HttpError(
      409,
      "Cargo Toshkent omborida bo‘lishi va To‘landi belgilanishi kerak",
      "FOREIGN_NOT_READY_FOR_UZ_COURIER",
    );
  }

  const handedAt = new Date();
  item.trackingStatus = "handed_to_courier";
  item.uzWarehousePickup = warehousePickup;
  if (!Array.isArray(item.trackingHistory)) item.trackingHistory = [];
  item.trackingHistory.push({ status: "handed_to_courier", at: handedAt });
  order.markModified("items");
  await order.save();

  return {
    orderId,
    itemIndex,
    trackingStatus: "handed_to_courier",
    handedToCourierAt: handedAt,
    uzWarehousePickup: snapshotUzWarehousePickup(item.uzWarehousePickup),
    alreadyHanded: false,
  };
}

module.exports = {
  handoffForeignItemToUzCourier,
  isShipmentReadyForUzCourier,
  UZ_WAREHOUSE_READY_PROCESS_STEP,
};
