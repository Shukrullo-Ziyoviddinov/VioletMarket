/**
 * Mijoz (Buyurtmalarim) uchun foreign tracking timeline.
 *
 * Order.item.trackingStatus + CargoShipment.processStep/paidAt birlashtiriladi.
 * Process steplar order.item ga yozilmaydi — faqat ko‘rsatish.
 *
 * Zanjir:
 *   accepted → seller_confirmed → collected → ready_for_cargo → handed_to_cargo
 *   → xitoy_omborida → yolda → bojxonada → toshkent_omborida
 *   → topshirildi (paidAt) → handed_to_courier → delivered
 */

const {
  FOREIGN_ORDER_TRACKING_STEPS,
  LOGISTICA_PROCESS_STEPS,
} = require("./foreignOrderTracking");

/** Mijoz UI dagi «Topshirildi» — shipment.paidAt dan, trackingStatus emas */
const FOREIGN_CUSTOMER_HANDED_OVER_STATUS = "topshirildi";

const FOREIGN_CUSTOMER_TRACKING_STEPS = [
  ...FOREIGN_ORDER_TRACKING_STEPS,
  ...LOGISTICA_PROCESS_STEPS,
  FOREIGN_CUSTOMER_HANDED_OVER_STATUS,
  "handed_to_courier",
  "delivered",
];

const PROCESS_STEP_SET = new Set(LOGISTICA_PROCESS_STEPS);
const FOREIGN_SELLER_STEP_SET = new Set(FOREIGN_ORDER_TRACKING_STEPS);

const ITEM_TRACKING_STATUS_SET = new Set([
  ...FOREIGN_ORDER_TRACKING_STEPS,
  "handed_to_courier",
  "delivered",
  "cancelled",
  "returned_to_seller",
]);

function normalizeItemTrackingStatus(raw) {
  const status = String(raw || "")
    .trim()
    .toLowerCase();
  if (status === "cancelled" || status === "returned_to_seller") return status;
  return ITEM_TRACKING_STATUS_SET.has(status) ? status : "accepted";
}

function resolveTrackingDate(history, status) {
  const entry = (Array.isArray(history) ? history : []).find(
    (row) => String(row?.status || "") === status,
  );
  return entry?.at || null;
}

/**
 * Mijoz timeline uchun joriy holat.
 * Last-mile (kuryer/delivered) eng yuqori prioritet.
 */
function resolveForeignCustomerTrackingStatus(item, shipment) {
  const trackingStatus = normalizeItemTrackingStatus(item?.trackingStatus);

  if (trackingStatus === "delivered") return "delivered";
  if (trackingStatus === "handed_to_courier") return "handed_to_courier";

  if (shipment?.paidAt) return FOREIGN_CUSTOMER_HANDED_OVER_STATUS;

  const processStep = String(shipment?.processStep || "")
    .trim()
    .toLowerCase();
  if (PROCESS_STEP_SET.has(processStep)) return processStep;

  if (FOREIGN_SELLER_STEP_SET.has(trackingStatus)) return trackingStatus;

  return "accepted";
}

function resolveForeignStepOccurredAt(status, item, orderedAt, shipment) {
  const history = Array.isArray(item?.trackingHistory) ? item.trackingHistory : [];

  if (FOREIGN_SELLER_STEP_SET.has(status)) {
    return (
      resolveTrackingDate(history, status) ||
      (status === "accepted" ? orderedAt || null : null) ||
      (status === "ready_for_cargo" ? shipment?.submittedAt || null : null) ||
      (status === "handed_to_cargo" ? shipment?.acceptedAt || null : null)
    );
  }

  if (status === FOREIGN_CUSTOMER_HANDED_OVER_STATUS) {
    return shipment?.paidAt || null;
  }

  if (status === "handed_to_courier" || status === "delivered") {
    return resolveTrackingDate(history, status);
  }

  // Process steplar tarixi shipment da saqlanmaydi — faqat joriy step uchun updatedAt
  const processStep = String(shipment?.processStep || "")
    .trim()
    .toLowerCase();
  if (status === processStep) {
    return shipment?.updatedAt || shipment?.acceptedAt || null;
  }

  return null;
}

function buildForeignCustomerOrderTrackingSteps(item, orderedAt, shipment = null) {
  const currentStatus = resolveForeignCustomerTrackingStatus(item, shipment);
  const currentIndex = FOREIGN_CUSTOMER_TRACKING_STEPS.indexOf(currentStatus);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;

  return FOREIGN_CUSTOMER_TRACKING_STEPS.map((status, index) => ({
    status,
    state:
      index < safeIndex
        ? "completed"
        : index === safeIndex
          ? "current"
          : "upcoming",
    occurredAt: resolveForeignStepOccurredAt(status, item, orderedAt, shipment),
  }));
}

module.exports = {
  FOREIGN_CUSTOMER_HANDED_OVER_STATUS,
  FOREIGN_CUSTOMER_TRACKING_STEPS,
  resolveForeignCustomerTrackingStatus,
  buildForeignCustomerOrderTrackingSteps,
};
