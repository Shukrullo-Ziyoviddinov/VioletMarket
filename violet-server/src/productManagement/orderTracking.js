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

const UZB_SELLER_COUNTRY = "uzb";

function normalizeOrderTrackingStatus(raw) {
  const status = String(raw || "").trim().toLowerCase();
  return UZB_ORDER_TRACKING_STEPS.includes(status) ? status : "accepted";
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

function buildUzbOrderTrackingSteps(item, orderedAt) {
  const currentStatus = normalizeCustomerTrackingStatus(item?.trackingStatus);
  const currentIndex = UZB_CUSTOMER_TRACKING_STEPS.indexOf(currentStatus);
  const history = Array.isArray(item?.trackingHistory) ? item.trackingHistory : [];

  return UZB_CUSTOMER_TRACKING_STEPS.map((status, index) => ({
    status,
    state: index < currentIndex ? "completed" : index === currentIndex ? "current" : "upcoming",
    occurredAt:
      resolveTrackingDate(history, status) ||
      (status === "accepted" ? orderedAt || null : null),
  }));
}

module.exports = {
  UZB_ORDER_TRACKING_STEPS,
  UZB_CUSTOMER_TRACKING_STEPS,
  UZB_SELLER_COUNTRY,
  normalizeOrderTrackingStatus,
  normalizeCustomerTrackingStatus,
  createInitialOrderTracking,
  buildUzbOrderTrackingSteps,
};
