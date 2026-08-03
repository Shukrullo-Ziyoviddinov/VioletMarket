/**
 * Cancel open units smoke (no DB).
 * Run: node src/scripts/verifyCancelOpenUnits.js
 */
const assert = require("assert");
const {
  cancelOpenItemUnits,
  countOpenItemUnits,
} = require("../productManagement/orderItemUnitPipelineSync");
const {
  resolveUnitTrackingStatus,
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

check("partial unavailable: open count = 1", () => {
  const item = {
    quantity: 2,
    trackingStatus: "accepted",
    trackingHistory: [],
    units: [
      { unitIndex: 0, trackingStatus: "unavailable", trackingHistory: [] },
      { unitIndex: 1, trackingStatus: "accepted", trackingHistory: [] },
    ],
  };
  assert.strictEqual(countOpenItemUnits(item), 1);
  const result = cancelOpenItemUnits(item, new Date());
  assert.strictEqual(result.cancelledCount, 1);
  assert.strictEqual(resolveUnitTrackingStatus(item, 0), "unavailable");
  assert.strictEqual(resolveUnitTrackingStatus(item, 1), "cancelled");
});

check("legacy full qty open", () => {
  const item = {
    quantity: 2,
    trackingStatus: "seller_confirmed",
    trackingHistory: [],
  };
  assert.strictEqual(countOpenItemUnits(item), 2);
  const result = cancelOpenItemUnits(item, new Date());
  assert.strictEqual(result.cancelledCount, 2);
  assert.strictEqual(item.trackingStatus, "cancelled");
});

console.log("\nPassed", passed, "checks");
if (!process.exitCode) console.log("Verification PASSED");
