/**
 * reHandoff — unit reopen (pool/accept closed-unit filter).
 * Run: node test/verifyReHandoffUnitReopen.js
 */
const assert = require("assert");
const {
  ensureItemUnits,
  getItemUnit,
  isClosedUnitStatus,
  resolveUnitTrackingStatus,
} = require("../src/productManagement/orderItemUnitTracking");
const {
  normalizeOrderTrackingStatus,
} = require("../src/productManagement/orderTracking");

/**
 * Mirrors reHandoffNoAnswerOrder tracking mutation (no DB).
 */
function applyReHandoffTracking(item, unitIndex) {
  const now = new Date();
  ensureItemUnits(item, now);
  const unit = getItemUnit(item, unitIndex);
  if (unit) {
    const prevUnit = normalizeOrderTrackingStatus(unit.trackingStatus);
    if (prevUnit !== "handed_to_courier") {
      unit.trackingStatus = "handed_to_courier";
      if (!Array.isArray(unit.trackingHistory)) unit.trackingHistory = [];
      unit.trackingHistory.push({ status: "handed_to_courier", at: now });
    }
  }
  item.trackingStatus = "handed_to_courier";
  if (!Array.isArray(item.trackingHistory)) item.trackingHistory = [];
  const lastHistory = item.trackingHistory[item.trackingHistory.length - 1];
  if (String(lastHistory?.status || "") !== "handed_to_courier") {
    item.trackingHistory.push({ status: "handed_to_courier", at: now });
  }
  return item;
}

function expandCourierPoolUnits(item) {
  if (normalizeOrderTrackingStatus(item.trackingStatus) !== "handed_to_courier") {
    return [];
  }
  const unitCount = Math.max(1, Number(item.quantity) || 1);
  const open = [];
  for (let i = 0; i < unitCount; i += 1) {
    if (isClosedUnitStatus(resolveUnitTrackingStatus(item, i))) continue;
    open.push(i);
  }
  return open;
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

check("qty=1: after return+reHandoff unit open in pool", () => {
  const item = {
    quantity: 1,
    trackingStatus: "returned_to_seller",
    trackingHistory: [],
    units: [
      {
        unitIndex: 0,
        trackingStatus: "returned_to_seller",
        trackingHistory: [],
      },
    ],
  };
  // OLD BUG: only item flip → pool still empty
  item.trackingStatus = "handed_to_courier";
  assert.deepStrictEqual(expandCourierPoolUnits(item), []);

  applyReHandoffTracking(item, 0);
  assert.strictEqual(resolveUnitTrackingStatus(item, 0), "handed_to_courier");
  assert.strictEqual(isClosedUnitStatus(resolveUnitTrackingStatus(item, 0)), false);
  assert.deepStrictEqual(expandCourierPoolUnits(item), [0]);
});

check("partial: reopen unit1, keep unavailable unit0 skipped", () => {
  const item = {
    quantity: 2,
    trackingStatus: "returned_to_seller",
    trackingHistory: [],
    units: [
      { unitIndex: 0, trackingStatus: "unavailable", trackingHistory: [] },
      {
        unitIndex: 1,
        trackingStatus: "returned_to_seller",
        trackingHistory: [],
      },
    ],
  };
  applyReHandoffTracking(item, 1);
  assert.strictEqual(resolveUnitTrackingStatus(item, 0), "unavailable");
  assert.strictEqual(resolveUnitTrackingStatus(item, 1), "handed_to_courier");
  assert.deepStrictEqual(expandCourierPoolUnits(item), [1]);
});

console.log("\nPassed", passed, "checks");
if (!process.exitCode) console.log("Verification PASSED");
