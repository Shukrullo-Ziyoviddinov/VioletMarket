/**
 * markOrderItemReturnedToSeller — closed + delivered siblings satisfied.
 * Run: node test/verifyReturnedToSellerClosedUnits.js
 */
const assert = require("assert");
const {
  ensureItemUnits,
  getItemUnit,
  resolveUnitTrackingStatus,
  isClosedUnitStatus,
  recomputeItemTrackingStatusFromUnits,
} = require("../src/productManagement/orderItemUnitTracking");
const {
  normalizeOrderTrackingStatus,
} = require("../src/productManagement/orderTracking");

/**
 * Mirrors returnUnitLifecycleService.markOrderItemReturnedToSeller (no DB).
 * @returns {boolean} allSatisfied
 */
function wouldMarkItemReturnedToSeller(item, assignmentUnitIndex, assignmentStatuses) {
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
    for (let i = 0; i < unitCount; i += 1) {
      if (String(statusByUnit.get(i) || "") !== "returned") continue;
      const unit = getItemUnit(item, i);
      if (!unit) continue;
      const st = resolveUnitTrackingStatus(item, i);
      if (
        st === "delivered" ||
        st === "returned_to_seller" ||
        st === "unavailable" ||
        st === "cancelled"
      ) {
        continue;
      }
      unit.trackingStatus = "returned_to_seller";
      if (!Array.isArray(unit.trackingHistory)) unit.trackingHistory = [];
      unit.trackingHistory.push({ status: "returned_to_seller", at });
    }
    const previous = normalizeOrderTrackingStatus(item.trackingStatus);
    recomputeItemTrackingStatusFromUnits(item);
    const next = normalizeOrderTrackingStatus(item.trackingStatus);
    if (next && next !== previous) {
      if (!Array.isArray(item.trackingHistory)) item.trackingHistory = [];
      item.trackingHistory.push({ status: next, at });
    }
  }

  return allSatisfied;
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

check("partial unavailable + last unit returned → mark item", () => {
  const item = {
    quantity: 2,
    trackingStatus: "handed_to_courier",
    units: [
      { unitIndex: 0, trackingStatus: "unavailable", trackingHistory: [] },
      { unitIndex: 1, trackingStatus: "handed_to_courier", trackingHistory: [] },
    ],
  };
  assert.strictEqual(
    wouldMarkItemReturnedToSeller(item, 1, { 1: "out_for_delivery" }),
    true,
  );
  assert.strictEqual(resolveUnitTrackingStatus(item, 1), "returned_to_seller");
  assert.strictEqual(item.trackingStatus, "returned_to_seller");
});

check("two open units, only one returned → do not mark", () => {
  const item = {
    quantity: 2,
    trackingStatus: "handed_to_courier",
    units: [
      { unitIndex: 0, trackingStatus: "handed_to_courier", trackingHistory: [] },
      { unitIndex: 1, trackingStatus: "handed_to_courier", trackingHistory: [] },
    ],
  };
  assert.strictEqual(
    wouldMarkItemReturnedToSeller(item, 1, {
      0: "out_for_delivery",
      1: "out_for_delivery",
    }),
    false,
  );
  assert.strictEqual(resolveUnitTrackingStatus(item, 1), "returned_to_seller");
  assert.strictEqual(item.trackingStatus, "handed_to_courier");
});

check("cancelled sibling + returned → mark item", () => {
  const item = {
    quantity: 2,
    trackingStatus: "handed_to_courier",
    units: [
      { unitIndex: 0, trackingStatus: "cancelled", trackingHistory: [] },
      { unitIndex: 1, trackingStatus: "handed_to_courier", trackingHistory: [] },
    ],
  };
  assert.strictEqual(
    wouldMarkItemReturnedToSeller(item, 1, { 1: "returned" }),
    true,
  );
  assert.strictEqual(item.trackingStatus, "returned_to_seller");
});

check("both returned via assignment → mark item", () => {
  const item = {
    quantity: 2,
    trackingStatus: "handed_to_courier",
    units: [
      { unitIndex: 0, trackingStatus: "handed_to_courier", trackingHistory: [] },
      { unitIndex: 1, trackingStatus: "handed_to_courier", trackingHistory: [] },
    ],
  };
  assert.strictEqual(
    wouldMarkItemReturnedToSeller(item, 1, {
      0: "returned",
      1: "out_for_delivery",
    }),
    true,
  );
  assert.strictEqual(item.trackingStatus, "returned_to_seller");
});

check("delivered sibling + return → allSatisfied, item delivered", () => {
  const item = {
    quantity: 2,
    trackingStatus: "handed_to_courier",
    units: [
      { unitIndex: 0, trackingStatus: "delivered", trackingHistory: [] },
      { unitIndex: 1, trackingStatus: "handed_to_courier", trackingHistory: [] },
    ],
  };
  assert.strictEqual(
    wouldMarkItemReturnedToSeller(item, 1, {
      0: "delivered",
      1: "returned",
    }),
    true,
  );
  assert.strictEqual(resolveUnitTrackingStatus(item, 1), "returned_to_seller");
  // recompute: active delivered → item delivered (not stuck returned_to_seller)
  assert.strictEqual(item.trackingStatus, "delivered");
});

check("delivered unit status alone (assignment missing) + return → OK", () => {
  const item = {
    quantity: 2,
    trackingStatus: "handed_to_courier",
    units: [
      { unitIndex: 0, trackingStatus: "delivered", trackingHistory: [] },
      { unitIndex: 1, trackingStatus: "handed_to_courier", trackingHistory: [] },
    ],
  };
  assert.strictEqual(
    wouldMarkItemReturnedToSeller(item, 1, { 1: "returned" }),
    true,
  );
  assert.strictEqual(item.trackingStatus, "delivered");
});

console.log("\nPassed", passed, "checks");
if (!process.exitCode) console.log("Verification PASSED");
