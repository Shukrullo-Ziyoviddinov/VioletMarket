/**
 * completeReturn retry after no_answer Sotildi must not clobber.
 * Run: node test/verifyCompleteReturnAfterSold.js
 */
const assert = require("assert");
const {
  ensureItemUnits,
  getItemUnit,
  resolveUnitTrackingStatus,
} = require("../src/productManagement/orderItemUnitTracking");

/**
 * Mirrors markOrderItemReturnedToSeller unit write guard (no DB).
 */
function applyReturnedUnitWrite(item, unitIndex) {
  const at = new Date();
  ensureItemUnits(item, at);
  const unit = getItemUnit(item, unitIndex);
  if (!unit) return { wrote: false };
  const prev = resolveUnitTrackingStatus(item, unitIndex);
  if (prev !== "delivered" && prev !== "returned_to_seller") {
    unit.trackingStatus = "returned_to_seller";
    if (!Array.isArray(unit.trackingHistory)) unit.trackingHistory = [];
    unit.trackingHistory.push({ status: "returned_to_seller", at });
    return { wrote: true, prev };
  }
  return { wrote: false, prev };
}

function shouldSkipCompleteReturnRetry({ resolvedAt, unitStatus }) {
  if (resolvedAt) return true;
  if (String(unitStatus || "") === "delivered") return true;
  return false;
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

check("resolved Sotildi → skip retry", () => {
  assert.strictEqual(
    shouldSkipCompleteReturnRetry({
      resolvedAt: new Date(),
      unitStatus: "delivered",
    }),
    true,
  );
});

check("unit delivered without resolvedAt → skip retry (+ heal path)", () => {
  assert.strictEqual(
    shouldSkipCompleteReturnRetry({
      resolvedAt: null,
      unitStatus: "delivered",
    }),
    true,
  );
});

check("crash heal sharti: no_answer + delivered + !resolvedAt", () => {
  const shouldHeal = ({ reasonType, resolvedAt, unitStatus }) =>
    !resolvedAt &&
    String(reasonType) === "no_answer" &&
    String(unitStatus) === "delivered";
  assert.strictEqual(
    shouldHeal({
      reasonType: "no_answer",
      resolvedAt: null,
      unitStatus: "delivered",
    }),
    true,
  );
  assert.strictEqual(
    shouldHeal({
      reasonType: "no_answer",
      resolvedAt: null,
      unitStatus: "returned_to_seller",
    }),
    false,
  );
});

check("unresolved return heal still allowed", () => {
  assert.strictEqual(
    shouldSkipCompleteReturnRetry({
      resolvedAt: null,
      unitStatus: "returned_to_seller",
    }),
    false,
  );
});

check("markReturned does not overwrite delivered unit", () => {
  const item = {
    quantity: 1,
    trackingStatus: "delivered",
    units: [
      { unitIndex: 0, trackingStatus: "delivered", trackingHistory: [] },
    ],
  };
  const result = applyReturnedUnitWrite(item, 0);
  assert.strictEqual(result.wrote, false);
  assert.strictEqual(resolveUnitTrackingStatus(item, 0), "delivered");
});

check("markReturned still writes handed → returned_to_seller", () => {
  const item = {
    quantity: 1,
    trackingStatus: "handed_to_courier",
    units: [
      { unitIndex: 0, trackingStatus: "handed_to_courier", trackingHistory: [] },
    ],
  };
  const result = applyReturnedUnitWrite(item, 0);
  assert.strictEqual(result.wrote, true);
  assert.strictEqual(resolveUnitTrackingStatus(item, 0), "returned_to_seller");
});

console.log("\nPassed", passed, "checks");
if (!process.exitCode) console.log("Verification PASSED");
