/**
 * Buyurtma item tracking — umumiy normalize + UZB (local) zanjir.
 *
 * Local (uzb):  accepted → seller_confirmed → collected → handed_to_courier → delivered
 * Foreign:      productManagement/foreignOrderTracking.js
 * Rejim:        productManagement/sellerPipelineMode.js
 */

const {
  LOCAL_SELLER_COUNTRY,
  normalizeSellerCountry,
  isLocalSellerCountry,
  isForeignSellerCountry,
  resolveSellerPipelineMode,
} = require("../seller/sellerPipelineMode");
const {
  FOREIGN_ORDER_TRACKING_STEPS,
  FOREIGN_ONLY_TRACKING_STATUSES,
  LOGISTICA_PROCESS_STEPS,
  isForeignTrackingStatus,
  isForeignOnlyTrackingStatus,
} = require("../foreign/foreignOrderTracking");

const UZB_ORDER_TRACKING_STEPS = [
  "accepted",
  "seller_confirmed",
  "collected",
  "handed_to_courier",
  "delivered",
];

const UZB_CUSTOMER_TRACKING_STEPS = [
  "accepted",
  "seller_confirmed",
  "collected",
  "handed_to_courier",
  "delivered",
];

/** UZB_SELLER_COUNTRY — eski importlar uchun alias */
const UZB_SELLER_COUNTRY = LOCAL_SELLER_COUNTRY;

/** cancelled = omborga qaytarildi; unavailable = sillerda yo‘q (qty qaytmaydi) */
const TERMINAL_TRACKING_STATUSES = [
  "cancelled",
  "unavailable",
  "returned_to_seller",
];

/**
 * Order.items.trackingStatus enum — local + foreign + terminal.
 * delivered local yakun; foreign da ham keyinroq ishlatiladi.
 */
const ALL_ORDER_TRACKING_STATUSES = [
  ...new Set([
    ...UZB_ORDER_TRACKING_STEPS,
    ...FOREIGN_ONLY_TRACKING_STATUSES,
    ...TERMINAL_TRACKING_STATUSES,
  ]),
];

const KNOWN_TRACKING_STATUS_SET = new Set(ALL_ORDER_TRACKING_STATUSES);

function normalizeOrderTrackingStatus(raw) {
  const status = String(raw || "")
    .trim()
    .toLowerCase();
  if (TERMINAL_TRACKING_STATUSES.includes(status)) {
    return status;
  }
  return KNOWN_TRACKING_STATUS_SET.has(status) ? status : "accepted";
}

function normalizeCustomerTrackingStatus(raw) {
  return normalizeOrderTrackingStatus(raw);
}

function createInitialOrderTracking(at = new Date()) {
  return {
    trackingStatus: "accepted",
    trackingHistory: [{ status: "accepted", at }],
  };
}

function resolveTrackingDate(history, status) {
  const entry = (Array.isArray(history) ? history : []).find(
    (row) => String(row?.status || "") === status,
  );
  return entry?.at || null;
}

function buildUzbOrderTrackingSteps(item, orderedAt, courierCtx = null) {
  let currentStatus = normalizeCustomerTrackingStatus(item?.trackingStatus);
  const courierAccepted = Boolean(courierCtx?.accepted);

  if (currentStatus === "delivered") {
    // final
  } else if (courierAccepted) {
    currentStatus = "handed_to_courier";
  } else if (currentStatus === "handed_to_courier") {
    // Siller/admin topshirgan — kuryer hali qabul qilmagan
    currentStatus = "collected";
  }

  const currentIndex = UZB_CUSTOMER_TRACKING_STEPS.indexOf(currentStatus);
  const history = Array.isArray(item?.trackingHistory) ? item.trackingHistory : [];

  return UZB_CUSTOMER_TRACKING_STEPS.map((status, index) => ({
    status,
    state:
      index < currentIndex
        ? "completed"
        : index === currentIndex
          ? "current"
          : "upcoming",
    occurredAt:
      status === "handed_to_courier"
        ? courierCtx?.acceptedAt ||
          resolveTrackingDate(history, status) ||
          null
        : resolveTrackingDate(history, status) ||
          (status === "accepted" ? orderedAt || null : null),
  }));
}

/**
 * Pipeline rejimiga qarab asosiy bosqichlar ro‘yxati.
 * UI/list filter uchun (B/E bullaklar).
 */
function getOrderTrackingStepsForPipeline(pipelineMode) {
  return pipelineMode === "foreign"
    ? [...FOREIGN_ORDER_TRACKING_STEPS]
    : [...UZB_ORDER_TRACKING_STEPS];
}

module.exports = {
  UZB_ORDER_TRACKING_STEPS,
  UZB_CUSTOMER_TRACKING_STEPS,
  UZB_SELLER_COUNTRY,
  LOCAL_SELLER_COUNTRY,
  TERMINAL_TRACKING_STATUSES,
  ALL_ORDER_TRACKING_STATUSES,
  FOREIGN_ORDER_TRACKING_STEPS,
  FOREIGN_ONLY_TRACKING_STATUSES,
  LOGISTICA_PROCESS_STEPS,
  normalizeSellerCountry,
  isLocalSellerCountry,
  isForeignSellerCountry,
  resolveSellerPipelineMode,
  isForeignTrackingStatus,
  isForeignOnlyTrackingStatus,
  normalizeOrderTrackingStatus,
  normalizeCustomerTrackingStatus,
  createInitialOrderTracking,
  buildUzbOrderTrackingSteps,
  getOrderTrackingStepsForPipeline,
};
