/**
 * Order item pipeline — faqat ochiq (yopilmagan) donalarni keyingi statusga o‘tkazish.
 * Yopiq: unavailable | cancelled | returned_to_seller — tegilmaydi.
 * Agregat: recomputeItemTrackingStatusFromUnits.
 */

const { normalizeOrderTrackingStatus } = require("./orderTracking");
const {
  ensureItemUnits,
  getItemUnit,
  isClosedUnitStatus,
  recomputeItemTrackingStatusFromUnits,
  resolveItemQuantity,
} = require("./orderItemUnitTracking");

/**
 * Ochiq donalarni `nextStatus` ga o‘tkazadi; yopiqlar saqlanadi.
 * Item history ga status yoziladi (agar kamida bitta dona o‘tsa).
 */
function advanceOpenUnitsTracking(item, nextStatusRaw, at = new Date()) {
  if (!item || typeof item !== "object") {
    return {
      advancedUnitIndexes: [],
      trackingStatus: "accepted",
      skippedClosedCount: 0,
    };
  }

  const nextStatus = normalizeOrderTrackingStatus(nextStatusRaw);
  ensureItemUnits(item, at);

  const qty = resolveItemQuantity(item);
  const advancedUnitIndexes = [];
  let skippedClosedCount = 0;

  for (let unitIndex = 0; unitIndex < qty; unitIndex += 1) {
    const unit = getItemUnit(item, unitIndex);
    if (!unit) continue;

    const current = normalizeOrderTrackingStatus(unit.trackingStatus);
    if (isClosedUnitStatus(current)) {
      skippedClosedCount += 1;
      continue;
    }
    if (current === nextStatus) continue;

    unit.trackingStatus = nextStatus;
    if (!Array.isArray(unit.trackingHistory)) unit.trackingHistory = [];
    unit.trackingHistory.push({ status: nextStatus, at });
    advancedUnitIndexes.push(unitIndex);
  }

  if (advancedUnitIndexes.length) {
    if (!Array.isArray(item.trackingHistory)) item.trackingHistory = [];
    const alreadyLogged = item.trackingHistory.some(
      (entry) => String(entry?.status || "") === nextStatus,
    );
    if (!alreadyLogged) {
      item.trackingHistory.push({ status: nextStatus, at });
    }
  }

  const trackingStatus = recomputeItemTrackingStatusFromUnits(item);

  return {
    advancedUnitIndexes,
    trackingStatus: normalizeOrderTrackingStatus(trackingStatus),
    skippedClosedCount,
  };
}

/**
 * Item + ochiq units sync (idempotent wrapper).
 */
function applyItemPipelineStatus(item, nextStatusRaw, at = new Date()) {
  const nextStatus = normalizeOrderTrackingStatus(nextStatusRaw);
  const current = normalizeOrderTrackingStatus(item?.trackingStatus);

  if (current === nextStatus) {
    ensureItemUnits(item, at);
    const qty = resolveItemQuantity(item);
    let needsSync = false;
    for (let unitIndex = 0; unitIndex < qty; unitIndex += 1) {
      const unit = getItemUnit(item, unitIndex);
      if (!unit) continue;
      const unitStatus = normalizeOrderTrackingStatus(unit.trackingStatus);
      if (isClosedUnitStatus(unitStatus)) continue;
      if (unitStatus !== nextStatus) {
        needsSync = true;
        break;
      }
    }
    if (!needsSync) {
      return {
        advancedUnitIndexes: [],
        trackingStatus: current,
        skippedClosedCount: 0,
        changed: false,
      };
    }
  }

  const result = advanceOpenUnitsTracking(item, nextStatus, at);
  return {
    ...result,
    changed:
      result.advancedUnitIndexes.length > 0 || current !== result.trackingStatus,
  };
}

/**
 * Bekor: faqat ochiq donalar → cancelled.
 * unavailable / returned_to_seller ga tegmaydi.
 * releaseToWarehouse uchun cancelledCount.
 */
function cancelOpenItemUnits(item, at = new Date()) {
  const result = advanceOpenUnitsTracking(item, "cancelled", at);
  return {
    cancelledUnitIndexes: result.advancedUnitIndexes,
    cancelledCount: result.advancedUnitIndexes.length,
    skippedClosedCount: result.skippedClosedCount,
    trackingStatus: result.trackingStatus,
  };
}

/** Ombor release uchun ochiq donalar soni (units yo‘q = quantity yoki 0 agar item yopiq). */
function countOpenItemUnits(item) {
  if (!item) return 0;
  const qty = resolveItemQuantity(item);
  if (!Array.isArray(item.units) || !item.units.length) {
    const status = normalizeOrderTrackingStatus(item.trackingStatus);
    return isClosedUnitStatus(status) ? 0 : qty;
  }

  let open = 0;
  for (let unitIndex = 0; unitIndex < qty; unitIndex += 1) {
    const unit = getItemUnit(item, unitIndex);
    const status = normalizeOrderTrackingStatus(
      unit?.trackingStatus || item.trackingStatus,
    );
    if (!isClosedUnitStatus(status)) open += 1;
  }
  return open;
}

module.exports = {
  advanceOpenUnitsTracking,
  applyItemPipelineStatus,
  cancelOpenItemUnits,
  countOpenItemUnits,
};
