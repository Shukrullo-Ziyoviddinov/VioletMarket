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
 * Logistica app process steplari (keyingi bullaklar).
 * Hozir faqat konstanta — order enum ga qo‘shilmaydi.
 */
const LOGISTICA_PROCESS_STEPS = [
  "xitoy_omborida",
  "yolda",
  "bojxonada",
  "toshkent_omborida",
];

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

module.exports = {
  FOREIGN_ORDER_TRACKING_STEPS,
  FOREIGN_ONLY_TRACKING_STATUSES,
  LOGISTICA_PROCESS_STEPS,
  isForeignTrackingStatus,
  isForeignOnlyTrackingStatus,
};
