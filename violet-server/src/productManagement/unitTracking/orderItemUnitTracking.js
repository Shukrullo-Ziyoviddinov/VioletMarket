/**
 * Order item — dona (unit) tracking.
 * items[].trackingStatus agregat qoladi (zanjir/filter/index).
 * units[] ixtiyoriy; bo‘sh bo‘lsa eski item-level holat.
 */

const {
  normalizeOrderTrackingStatus,
} = require("./orderTracking");

const CLOSED_UNIT_STATUSES = new Set([
  "cancelled",
  "unavailable",
  "returned_to_seller",
]);

function resolveItemQuantity(item) {
  return Math.max(1, Math.floor(Number(item?.quantity) || 1));
}

function isClosedUnitStatus(status) {
  return CLOSED_UNIT_STATUSES.has(normalizeOrderTrackingStatus(status));
}

/**
 * units[] yo‘q yoki qisqa bo‘lsa — item statusidan to‘ldiradi (lazy).
 * quantity o‘zgarmaydi; itemIndex barqaror.
 */
function ensureItemUnits(item, at = new Date()) {
  if (!item || typeof item !== "object") return [];

  const qty = resolveItemQuantity(item);
  const itemStatus = normalizeOrderTrackingStatus(item.trackingStatus);
  if (!Array.isArray(item.units)) item.units = [];

  for (let unitIndex = 0; unitIndex < qty; unitIndex += 1) {
    const existing = item.units.find(
      (row) => Number(row?.unitIndex) === unitIndex,
    );
    if (existing) continue;

    item.units.push({
      unitIndex,
      trackingStatus: itemStatus,
      trackingHistory: [
        {
          status: itemStatus,
          at:
            (Array.isArray(item.trackingHistory) &&
              item.trackingHistory[item.trackingHistory.length - 1]?.at) ||
            at,
        },
      ],
    });
  }

  item.units.sort(
    (a, b) => (Number(a.unitIndex) || 0) - (Number(b.unitIndex) || 0),
  );
  return item.units;
}

function getItemUnit(item, unitIndexRaw) {
  const unitIndex = Math.max(0, Math.floor(Number(unitIndexRaw) || 0));
  const units = Array.isArray(item?.units) ? item.units : [];
  return (
    units.find((row) => Number(row?.unitIndex) === unitIndex) || null
  );
}

/** Kartochka / list: units bor bo‘lsa dona statusi, aks holda item. */
function resolveUnitTrackingStatus(item, unitIndexRaw) {
  const unitIndex = Math.max(0, Math.floor(Number(unitIndexRaw) || 0));
  const unit = getItemUnit(item, unitIndex);
  if (unit?.trackingStatus) {
    return normalizeOrderTrackingStatus(unit.trackingStatus);
  }
  return normalizeOrderTrackingStatus(item?.trackingStatus);
}

function resolveUnitTrackingHistory(item, unitIndexRaw) {
  const unit = getItemUnit(item, unitIndexRaw);
  if (unit && Array.isArray(unit.trackingHistory) && unit.trackingHistory.length) {
    return unit.trackingHistory;
  }
  return Array.isArray(item?.trackingHistory) ? item.trackingHistory : [];
}

/**
 * Faol (yopilmagan) donalar statusidan agregat.
 * Hammasi yopiq + aralash: returned_to_seller > unavailable > cancelled.
 * (partial «mavjud emas» + qolgani qaytarilganda item «returned_to_seller»).
 */
function recomputeItemTrackingStatusFromUnits(item) {
  const qty = resolveItemQuantity(item);
  const units = ensureItemUnits(item);
  const active = [];

  for (let unitIndex = 0; unitIndex < qty; unitIndex += 1) {
    const unit = units.find((row) => Number(row?.unitIndex) === unitIndex);
    const status = normalizeOrderTrackingStatus(
      unit?.trackingStatus || item.trackingStatus,
    );
    if (!isClosedUnitStatus(status)) {
      active.push(status);
    }
  }

  if (active.length) {
    // Bir xil pipeline statusini saqlash (odatda hammasi sync)
    item.trackingStatus = active[0];
    return item.trackingStatus;
  }

  const closed = [];
  for (let unitIndex = 0; unitIndex < qty; unitIndex += 1) {
    const unit = units.find((row) => Number(row?.unitIndex) === unitIndex);
    closed.push(
      normalizeOrderTrackingStatus(unit?.trackingStatus || item.trackingStatus),
    );
  }

  if (closed.every((status) => status === "unavailable")) {
    item.trackingStatus = "unavailable";
  } else if (closed.every((status) => status === "cancelled")) {
    item.trackingStatus = "cancelled";
  } else if (closed.every((status) => status === "returned_to_seller")) {
    item.trackingStatus = "returned_to_seller";
  } else if (closed.includes("returned_to_seller")) {
    // unavailable/cancelled + returned aralash → qaytarish yakuni
    item.trackingStatus = "returned_to_seller";
  } else if (closed.includes("unavailable")) {
    item.trackingStatus = "unavailable";
  } else if (closed.includes("cancelled")) {
    item.trackingStatus = "cancelled";
  } else {
    item.trackingStatus = closed[0] || "accepted";
  }

  return item.trackingStatus;
}

/**
 * SellerSoldItem sync: faqat mijozga haqiqatan topshirilgan donalar.
 * returned_to_seller / unavailable / cancelled / ochiq pipeline — yo‘q.
 * Live yozuv: recordSalesOnDelivery; bu helper backfill/heal uchun.
 */
function isUnitEligibleForSoldSync(item, unitIndexRaw) {
  return resolveUnitTrackingStatus(item, unitIndexRaw) === "delivered";
}

function isUnitExcludedFromSoldSync(item, unitIndexRaw) {
  return !isUnitEligibleForSoldSync(item, unitIndexRaw);
}

/**
 * Deliver yakuni: bu dona mijozga ketmaydi (mavjud emas / bekor).
 * returned_to_seller BU YERGA KIRMAYDI — qayta kuryer / qayta aktiv / sotildi
 * hali mumkin; erta «delivered» qilmaslik.
 */
function isUnitSkippedForCustomerDelivery(status) {
  const normalized = normalizeOrderTrackingStatus(status);
  return normalized === "unavailable" || normalized === "cancelled";
}

/**
 * Item «delivered» bo‘lishi uchun dona yakunlanganmi?
 * deliveredUnitIndexes — assignment delivered yoki no_answer «sotildi».
 *
 * options.unresolvedNoAnswerUnitIndexes (Set|array|null):
 *   - berilsa: returned_to_seller + shu setda → hali ochiq no_answer (settle YO‘Q)
 *             returned_to_seller + setda yo‘q → terminal return/defective/yopilgan (settle OK)
 *   - berilmasa: returned_to_seller settle qilinmaydi (xavfsiz default — eski himoya)
 */
function isUnitSettledForItemDelivery(
  item,
  unitIndexRaw,
  deliveredUnitIndexes,
  options = {},
) {
  const unitIndex = Math.max(0, Math.floor(Number(unitIndexRaw) || 0));
  const deliveredSet =
    deliveredUnitIndexes instanceof Set
      ? deliveredUnitIndexes
      : new Set(
          Array.isArray(deliveredUnitIndexes)
            ? deliveredUnitIndexes.map((value) => Number(value) || 0)
            : [],
        );

  if (deliveredSet.has(unitIndex)) return true;

  const status = resolveUnitTrackingStatus(item, unitIndex);
  if (status === "delivered") return true;
  if (isUnitSkippedForCustomerDelivery(status)) return true;

  if (status === "returned_to_seller") {
    const rawUnresolved = options?.unresolvedNoAnswerUnitIndexes;
    if (rawUnresolved == null) {
      // Caller DB tekshirmagan — no_answer xavfini saqlaymiz
      return false;
    }
    const unresolvedSet =
      rawUnresolved instanceof Set
        ? rawUnresolved
        : new Set(
            Array.isArray(rawUnresolved)
              ? rawUnresolved.map((value) => Number(value) || 0)
              : [],
          );
    // Ochiq no_answer → settle yo‘q; terminal return/defective → settle OK
    return !unresolvedSet.has(unitIndex);
  }

  return false;
}

function areAllItemUnitsSettledForDelivery(
  item,
  deliveredUnitIndexes,
  options = {},
) {
  const qty = resolveItemQuantity(item);
  for (let unitIndex = 0; unitIndex < qty; unitIndex += 1) {
    if (
      !isUnitSettledForItemDelivery(
        item,
        unitIndex,
        deliveredUnitIndexes,
        options,
      )
    ) {
      return false;
    }
  }
  return true;
}

/** Order.status=delivered: item delivered / unavailable / cancelled / terminal returned. */
function isItemSettledForOrderDelivery(item, options = {}) {
  const status = normalizeOrderTrackingStatus(item?.trackingStatus);
  const hasUnresolvedOption = options?.unresolvedNoAnswerUnitIndexes != null;

  // Aggregate «delivered» qty≥2 da ochiq no_answer sibling bilan chalkashishi mumkin
  // (Topshirdim + Ajdaniya). Options berilsa — faqat donalar bo‘yicha.
  if (status === "delivered") {
    if (!hasUnresolvedOption) return true;
    return areAllItemUnitsSettledForDelivery(item, new Set(), options);
  }

  if (isUnitSkippedForCustomerDelivery(status)) return true;

  if (status === "returned_to_seller") {
    const rawUnresolved = options?.unresolvedNoAnswerUnitIndexes;
    if (rawUnresolved == null) {
      // Caller DB tekshirmagan — ochiq no_answer xavfini saqlaymiz
      return false;
    }
    const unresolvedSet =
      rawUnresolved instanceof Set
        ? rawUnresolved
        : new Set(
            Array.isArray(rawUnresolved)
              ? rawUnresolved.map((value) => Number(value) || 0)
              : [],
          );
    // Shu itemda ochiq no_answer dona bo‘lsa — order hali yakunlanmasin
    return unresolvedSet.size === 0;
  }

  // Aggregate lag: options berilgan bo‘lsa donalar bo‘yicha
  if (hasUnresolvedOption) {
    return areAllItemUnitsSettledForDelivery(item, new Set(), options);
  }

  return false;
}

/**
 * Shu donaga units[].trackingStatus = delivered (yopiq donaga tegmaydi).
 */
function markItemUnitDelivered(item, unitIndexRaw, at = new Date()) {
  ensureItemUnits(item, at);
  const unitIndex = Math.max(0, Math.floor(Number(unitIndexRaw) || 0));
  const unit = getItemUnit(item, unitIndex);
  if (!unit) return false;

  const prev = normalizeOrderTrackingStatus(unit.trackingStatus);
  if (isUnitSkippedForCustomerDelivery(prev)) return false;
  if (prev === "delivered") return false;

  unit.trackingStatus = "delivered";
  if (!Array.isArray(unit.trackingHistory)) unit.trackingHistory = [];
  unit.trackingHistory.push({ status: "delivered", at });
  return true;
}

function normalizeUnitIndexes(raw, quantity) {
  const qty = Math.max(1, Math.floor(Number(quantity) || 1));
  const list = Array.isArray(raw) ? raw : raw == null ? null : [raw];
  if (list == null) return null;

  const indexes = [
    ...new Set(
      list
        .map((value) => Math.floor(Number(value)))
        .filter((value) => Number.isInteger(value) && value >= 0 && value < qty),
    ),
  ].sort((a, b) => a - b);

  return indexes;
}

/**
 * unitIndexes null → butun qator (eski API).
 * Aks holda faqat shu donalar.
 */
function resolveTargetUnitIndexes(item, unitIndexesRaw) {
  const qty = resolveItemQuantity(item);
  const normalized = normalizeUnitIndexes(unitIndexesRaw, qty);
  if (normalized == null) {
    return Array.from({ length: qty }, (_, index) => index);
  }
  return normalized;
}

module.exports = {
  CLOSED_UNIT_STATUSES,
  resolveItemQuantity,
  isClosedUnitStatus,
  isUnitEligibleForSoldSync,
  isUnitExcludedFromSoldSync,
  isUnitSkippedForCustomerDelivery,
  isUnitSettledForItemDelivery,
  areAllItemUnitsSettledForDelivery,
  isItemSettledForOrderDelivery,
  markItemUnitDelivered,
  ensureItemUnits,
  getItemUnit,
  resolveUnitTrackingStatus,
  resolveUnitTrackingHistory,
  recomputeItemTrackingStatusFromUnits,
  normalizeUnitIndexes,
  resolveTargetUnitIndexes,
};
