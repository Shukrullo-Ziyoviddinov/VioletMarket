/**
 * markOrderItemReturnedToSeller — partial return still persists units[].
 * Run: node src/scripts/verifyMarkReturnedPartialUnitSave.js
 */
const assert = require("assert");
const {
  ensureItemUnits,
  getItemUnit,
  isClosedUnitStatus,
  resolveUnitTrackingStatus,
  recomputeItemTrackingStatusFromUnits,
} = require("../productManagement/orderItemUnitTracking");
const {
  normalizeOrderTrackingStatus,
} = require("../productManagement/orderTracking");

/**
 * Mirrors markOrderItemReturnedToSeller (no DB).
 * @returns {{ allSatisfied: boolean, shouldSave: true }}
 */
function applyMarkReturned(item, assignmentUnitIndex, assignmentStatuses) {
  const at = new Date();
  ensureItemUnits(item, at);

  const thisUnit = getItemUnit(item, assignmentUnitIndex);
  if (thisUnit && resolveUnitTrackingStatus(item, assignmentUnitIndex) !== "returned_to_seller") {
    thisUnit.trackingStatus = "returned_to_seller";
    if (!Array.isArray(thisUnit.trackingHistory)) thisUnit.trackingHistory = [];
    thisUnit.trackingHistory.push({ status: "returned_to_seller", at });
  }

  const unitCount = Math.max(1, Number(item.quantity) || 1);
  const statusByUnit = new Map(
    Object.entries(assignmentStatuses || {}).map(([k, v]) => [Number(k), String(v)]),
  );
  statusByUnit.set(Number(assignmentUnitIndex) || 0, "returned");

  let allSatisfied = true;
  for (let i = 0; i < unitCount; i += 1) {
    const assignStatus = String(statusByUnit.get(i) || "");
    if (assignStatus === "returned" || assignStatus === "delivered") continue;
    const unitStatus = resolveUnitTrackingStatus(item, i);
    if (unitStatus === "delivered") continue;
    if (isClosedUnitStatus(unitStatus)) continue;
    allSatisfied = false;
    break;
  }

  if (allSatisfied) {
    const previous = normalizeOrderTrackingStatus(item.trackingStatus);
    recomputeItemTrackingStatusFromUnits(item);
    const next = normalizeOrderTrackingStatus(item.trackingStatus);
    if (next && next !== previous) {
      if (!Array.isArray(item.trackingHistory)) item.trackingHistory = [];
      item.trackingHistory.push({ status: next, at });
    }
  }

  return { allSatisfied, shouldSave: true };
}

let passed = 0;
function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log("OK ", name);
  } catch (err) {
    console.error("FAIL", name, "-", err.message);
    process.exitCode = 1;
  }
}

check("two open: return unit0 → unit saved, item stays handed", () => {
  const item = {
    quantity: 2,
    trackingStatus: "handed_to_courier",
    trackingHistory: [],
    units: [
      { unitIndex: 0, trackingStatus: "handed_to_courier", trackingHistory: [] },
      { unitIndex: 1, trackingStatus: "handed_to_courier", trackingHistory: [] },
    ],
  };
  const result = applyMarkReturned(item, 0, {
    0: "return_to_seller",
    1: "out_for_delivery",
  });
  assert.strictEqual(result.allSatisfied, false);
  assert.strictEqual(result.shouldSave, true);
  assert.strictEqual(resolveUnitTrackingStatus(item, 0), "returned_to_seller");
  assert.strictEqual(resolveUnitTrackingStatus(item, 1), "handed_to_courier");
  // Pool still sees item as handed — sibling can stay available
  assert.strictEqual(item.trackingStatus, "handed_to_courier");
});

check("unavailable sibling + return → allSatisfied + item returned", () => {
  const item = {
    quantity: 2,
    trackingStatus: "handed_to_courier",
    trackingHistory: [],
    units: [
      { unitIndex: 0, trackingStatus: "unavailable", trackingHistory: [] },
      { unitIndex: 1, trackingStatus: "handed_to_courier", trackingHistory: [] },
    ],
  };
  const result = applyMarkReturned(item, 1, { 1: "returned" });
  assert.strictEqual(result.allSatisfied, true);
  assert.strictEqual(resolveUnitTrackingStatus(item, 1), "returned_to_seller");
  assert.strictEqual(item.trackingStatus, "returned_to_seller");
});

check("qty=1 return → satisfied + item returned", () => {
  const item = {
    quantity: 1,
    trackingStatus: "handed_to_courier",
    trackingHistory: [],
    units: [
      { unitIndex: 0, trackingStatus: "handed_to_courier", trackingHistory: [] },
    ],
  };
  const result = applyMarkReturned(item, 0, { 0: "returned" });
  assert.strictEqual(result.allSatisfied, true);
  assert.strictEqual(item.trackingStatus, "returned_to_seller");
});

check("delivered sibling + return → item delivered via recompute", () => {
  const item = {
    quantity: 2,
    trackingStatus: "handed_to_courier",
    trackingHistory: [],
    units: [
      { unitIndex: 0, trackingStatus: "delivered", trackingHistory: [] },
      { unitIndex: 1, trackingStatus: "handed_to_courier", trackingHistory: [] },
    ],
  };
  const result = applyMarkReturned(item, 1, {
    0: "delivered",
    1: "returned",
  });
  assert.strictEqual(result.allSatisfied, true);
  assert.strictEqual(resolveUnitTrackingStatus(item, 1), "returned_to_seller");
  assert.strictEqual(item.trackingStatus, "delivered");
});

console.log("\nPassed", passed, "checks");
if (!process.exitCode) console.log("Verification PASSED");
