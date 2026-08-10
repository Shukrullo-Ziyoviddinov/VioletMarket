/**
 * Mijoz (Buyurtmalarim) uchun foreign tracking timeline.
 *
 * Order.item.trackingStatus + CargoShipment.processStep birlashtiriladi.
 * Process steplar order.item ga yozilmaydi — faqat ko‘rsatish.
 *
 * Zanjir:
 *   accepted → seller_confirmed → collected → ready_for_cargo → handed_to_cargo
 *   → xitoy_omborida → yolda → bojxonada → toshkent_omborida
 *   → handed_to_courier → delivered
 *
 * To‘landi (paidAt): mijoz timelineiga alohida bosqich emas.
 * Admin Xorij→UZB: kuryer pooliga chiqaradi (item.trackingStatus=handed_to_courier).
 * Mijozda «Mahsulot kuryerda» faqat kuryer «Qabul qilish» (active assignment) dan keyin.
 */

const {
  FOREIGN_ORDER_TRACKING_STEPS,
  LOGISTICA_PROCESS_STEPS,
} = require("./foreignOrderTracking");

const FOREIGN_CUSTOMER_TRACKING_STEPS = [
  ...FOREIGN_ORDER_TRACKING_STEPS,
  ...LOGISTICA_PROCESS_STEPS,
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
  "unavailable",
  "returned_to_seller",
]);

function normalizeItemTrackingStatus(raw) {
  const status = String(raw || "")
    .trim()
    .toLowerCase();
  if (
    status === "cancelled" ||
    status === "unavailable" ||
    status === "returned_to_seller"
  ) {
    return status;
  }
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
 * Last-mile: faqat kuryer qabul qilgan (courierAccepted) bo‘lsa handed_to_courier.
 * Admin handoff yolg‘iz — pool uchun; mijoz hali Toshkent omborida qoladi.
 */
function resolveForeignCustomerTrackingStatus(
  item,
  shipment,
  courierCtx = null,
) {
  const trackingStatus = normalizeItemTrackingStatus(item?.trackingStatus);
  const courierAccepted = Boolean(courierCtx?.accepted);

  if (trackingStatus === "delivered") return "delivered";
  if (courierAccepted) return "handed_to_courier";
  if (
    trackingStatus === "cancelled" ||
    trackingStatus === "unavailable" ||
    trackingStatus === "returned_to_seller"
  ) {
    return trackingStatus;
  }

  // Admin handoff qilingan, lekin kuryer hali qabul qilmagan
  if (trackingStatus === "handed_to_courier") {
    const processStep = String(shipment?.processStep || "")
      .trim()
      .toLowerCase();
    if (PROCESS_STEP_SET.has(processStep)) return processStep;
    return "toshkent_omborida";
  }

  const processStep = String(shipment?.processStep || "")
    .trim()
    .toLowerCase();
  if (PROCESS_STEP_SET.has(processStep)) return processStep;

  if (FOREIGN_SELLER_STEP_SET.has(trackingStatus)) return trackingStatus;

  return "accepted";
}

function resolveForeignStepOccurredAt(
  status,
  item,
  orderedAt,
  shipment,
  courierCtx = null,
) {
  const history = Array.isArray(item?.trackingHistory) ? item.trackingHistory : [];

  if (FOREIGN_SELLER_STEP_SET.has(status)) {
    return (
      resolveTrackingDate(history, status) ||
      (status === "accepted" ? orderedAt || null : null) ||
      (status === "ready_for_cargo" ? shipment?.submittedAt || null : null) ||
      (status === "handed_to_cargo" ? shipment?.acceptedAt || null : null)
    );
  }

  if (status === "handed_to_courier") {
    return (
      courierCtx?.acceptedAt ||
      resolveTrackingDate(history, status) ||
      null
    );
  }

  if (status === "delivered") {
    return resolveTrackingDate(history, status);
  }

  const processStep = String(shipment?.processStep || "")
    .trim()
    .toLowerCase();
  if (status === processStep) {
    return (
      (status === "toshkent_omborida" ? shipment?.uzArrivedAt || null : null) ||
      shipment?.updatedAt ||
      shipment?.acceptedAt ||
      null
    );
  }

  return null;
}

function buildForeignCustomerOrderTrackingSteps(
  item,
  orderedAt,
  shipment = null,
  courierCtx = null,
) {
  const currentStatus = resolveForeignCustomerTrackingStatus(
    item,
    shipment,
    courierCtx,
  );
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
    occurredAt: resolveForeignStepOccurredAt(
      status,
      item,
      orderedAt,
      shipment,
      courierCtx,
    ),
  }));
}

module.exports = {
  FOREIGN_CUSTOMER_TRACKING_STEPS,
  resolveForeignCustomerTrackingStatus,
  buildForeignCustomerOrderTrackingSteps,
};
