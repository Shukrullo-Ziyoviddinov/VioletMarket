/**
 * Agregat closed-status mix priority.
 * Run: node src/scripts/verifyAggregateClosedMix.js
 */
const assert = require("assert");
const {
  recomputeItemTrackingStatusFromUnits,
} = require("../productManagement/orderItemUnitTracking");

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

function itemWithUnits(statuses) {
  return {
    quantity: statuses.length,
    trackingStatus: "accepted",
    units: statuses.map((trackingStatus, unitIndex) => ({
      unitIndex,
      trackingStatus,
      trackingHistory: [],
    })),
  };
}

check("unavailable + returned_to_seller → returned_to_seller", () => {
  const item = itemWithUnits(["unavailable", "returned_to_seller"]);
  assert.strictEqual(
    recomputeItemTrackingStatusFromUnits(item),
    "returned_to_seller",
  );
});

check("returned_to_seller + unavailable (order) → returned_to_seller", () => {
  const item = itemWithUnits(["returned_to_seller", "unavailable"]);
  assert.strictEqual(
    recomputeItemTrackingStatusFromUnits(item),
    "returned_to_seller",
  );
});

check("cancelled + returned_to_seller → returned_to_seller", () => {
  const item = itemWithUnits(["cancelled", "returned_to_seller"]);
  assert.strictEqual(
    recomputeItemTrackingStatusFromUnits(item),
    "returned_to_seller",
  );
});

check("all unavailable stays unavailable", () => {
  const item = itemWithUnits(["unavailable", "unavailable"]);
  assert.strictEqual(recomputeItemTrackingStatusFromUnits(item), "unavailable");
});

check("all returned stays returned_to_seller", () => {
  const item = itemWithUnits(["returned_to_seller", "returned_to_seller"]);
  assert.strictEqual(
    recomputeItemTrackingStatusFromUnits(item),
    "returned_to_seller",
  );
});

check("open unit still drives aggregate", () => {
  const item = itemWithUnits(["unavailable", "collected"]);
  assert.strictEqual(recomputeItemTrackingStatusFromUnits(item), "collected");
});

check("cancelled + unavailable (no return) → unavailable", () => {
  const item = itemWithUnits(["cancelled", "unavailable"]);
  assert.strictEqual(recomputeItemTrackingStatusFromUnits(item), "unavailable");
});

console.log("\nPassed", passed, "checks");
if (!process.exitCode) console.log("Verification PASSED");
