/**
 * Pipeline sync smoke (no DB).
 * Run: node src/scripts/verifyUnitPipelineSync.js
 */
const assert = require("assert");
const {
  applyItemPipelineStatus,
} = require("../productManagement/orderItemUnitPipelineSync");
const {
  resolveUnitTrackingStatus,
} = require("../productManagement/orderItemUnitTracking");

function makePartialItem() {
  return {
    quantity: 2,
    trackingStatus: "accepted",
    trackingHistory: [{ status: "accepted", at: new Date() }],
    units: [
      {
        unitIndex: 0,
        trackingStatus: "unavailable",
        trackingHistory: [{ status: "unavailable", at: new Date() }],
      },
      {
        unitIndex: 1,
        trackingStatus: "accepted",
        trackingHistory: [{ status: "accepted", at: new Date() }],
      },
    ],
  };
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

check("confirm advances only open unit", () => {
  const item = makePartialItem();
  applyItemPipelineStatus(item, "seller_confirmed", new Date());
  assert.strictEqual(resolveUnitTrackingStatus(item, 0), "unavailable");
  assert.strictEqual(resolveUnitTrackingStatus(item, 1), "seller_confirmed");
  assert.strictEqual(item.trackingStatus, "seller_confirmed");
});

check("collect then handoff keep unavailable closed", () => {
  const item = makePartialItem();
  applyItemPipelineStatus(item, "seller_confirmed", new Date());
  applyItemPipelineStatus(item, "collected", new Date());
  applyItemPipelineStatus(item, "handed_to_courier", new Date());
  assert.strictEqual(resolveUnitTrackingStatus(item, 0), "unavailable");
  assert.strictEqual(resolveUnitTrackingStatus(item, 1), "handed_to_courier");
  assert.strictEqual(item.trackingStatus, "handed_to_courier");
});

check("legacy no units: all advance", () => {
  const item = {
    quantity: 2,
    trackingStatus: "accepted",
    trackingHistory: [{ status: "accepted", at: new Date() }],
  };
  applyItemPipelineStatus(item, "seller_confirmed", new Date());
  assert.strictEqual(resolveUnitTrackingStatus(item, 0), "seller_confirmed");
  assert.strictEqual(resolveUnitTrackingStatus(item, 1), "seller_confirmed");
  assert.strictEqual(item.trackingStatus, "seller_confirmed");
});

console.log("\nPassed", passed, "checks");
if (!process.exitCode) console.log("Verification PASSED");
