/**
 * markOrderItemReturnedToSeller — closed units without assignment count as satisfied.
 * Pure logic mirror (no DB): Run: node src/scripts/verifyReturnedToSellerClosedUnits.js
 */
const assert = require("assert");
const {
  ensureItemUnits,
  getItemUnit,
  resolveUnitTrackingStatus,
  isClosedUnitStatus,
} = require("../productManagement/orderItemUnitTracking");

/**
 * Mirrors returnUnitLifecycleService.markOrderItemReturnedToSeller satisfaction loop
 * (after writing the returning unit to units[]).
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

  for (let i = 0; i < unitCount; i += 1) {
    if (String(statusByUnit.get(i) || "") === "returned") continue;
    if (isClosedUnitStatus(resolveUnitTrackingStatus(item, i))) continue;
    return false;
  }
  return true;
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
  // only unit 1 has assignment; unit 0 never assigned
  assert.strictEqual(
    wouldMarkItemReturnedToSeller(item, 1, { 1: "out_for_delivery" }),
    true,
  );
  assert.strictEqual(resolveUnitTrackingStatus(item, 1), "returned_to_seller");
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
  // Unit still written even when item aggregate waits
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
});

console.log("\nPassed", passed, "checks");
if (!process.exitCode) console.log("Verification PASSED");
