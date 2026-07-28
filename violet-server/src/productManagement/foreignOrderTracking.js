/**
 * Foreign (xorij) siller buyurtma tracking zanjiri.
 * UZB kuryer zanjiriga aralashmaydi.
 *
 * Siller bosqichlari:
 *   accepted → seller_confirmed → collected → ready_for_cargo → handed_to_cargo
 *
 * Logistica ichki holatlar (shipment process) — alohida;
 * order.item.trackingStatus emas (B/C bosqichlarda shipment modeliga).
 */

const FOREIGN_ORDER_TRACKING_STEPS = [
  "accepted",
  "seller_confirmed",
  "collected",
  "ready_for_cargo",
  "handed_to_cargo",
];

/** Order item trackingStatus uchun foreign-only statuslar */
const FOREIGN_ONLY_TRACKING_STATUSES = [
  "ready_for_cargo",
  "handed_to_cargo",
];

/**
 * Logistica app process steplari — order.item.trackingStatus emas.
 */
const LOGISTICA_PROCESS_STEPS = [
  "xitoy_omborida",
  "yolda",
  "bojxonada",
  "toshkent_omborida",
];

/** Toshkent omborida + To‘landi = asosiy admin Xorij→UZB ga chiqadi */
const UZ_WAREHOUSE_READY_PROCESS_STEP = "toshkent_omborida";

function isForeignTrackingStatus(status) {
  const value = String(status || "")
    .trim()
    .toLowerCase();
  return FOREIGN_ORDER_TRACKING_STEPS.includes(value);
}

function isForeignOnlyTrackingStatus(status) {
  const value = String(status || "")
    .trim()
    .toLowerCase();
  return FOREIGN_ONLY_TRACKING_STATUSES.includes(value);
}

function isUzWarehouseReadyProcessStep(step) {
  return (
    String(step || "")
      .trim()
      .toLowerCase() === UZ_WAREHOUSE_READY_PROCESS_STEP
  );
}

module.exports = {
  FOREIGN_ORDER_TRACKING_STEPS,
  FOREIGN_ONLY_TRACKING_STATUSES,
  LOGISTICA_PROCESS_STEPS,
  UZ_WAREHOUSE_READY_PROCESS_STEP,
  isForeignTrackingStatus,
  isForeignOnlyTrackingStatus,
  isUzWarehouseReadyProcessStep,
};
