/**
 * Courier pool closed-unit filter smoke.
 * Run: node test/verifyCourierClosedUnitFilter.js
 */
const assert = require("assert");
const {
  isClosedUnitStatus,
  resolveUnitTrackingStatus,
} = require("../src/productManagement/orderItemUnitTracking");

function expandOpenUnits(item) {
  const unitCount = Math.max(1, Number(item.quantity) || 1);
  const open = [];
  for (let unitIndex = 0; unitIndex < unitCount; unitIndex += 1) {
    if (isClosedUnitStatus(resolveUnitTrackingStatus(item, unitIndex))) continue;
    open.push(unitIndex);
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

check("pool skips unavailable unit", () => {
  const item = {
    quantity: 2,
    trackingStatus: "handed_to_courier",
    units: [
      { unitIndex: 0, trackingStatus: "unavailable" },
      { unitIndex: 1, trackingStatus: "handed_to_courier" },
    ],
  };
  assert.deepStrictEqual(expandOpenUnits(item), [1]);
  assert.strictEqual(isClosedUnitStatus(resolveUnitTrackingStatus(item, 0)), true);
  assert.strictEqual(isClosedUnitStatus(resolveUnitTrackingStatus(item, 1)), false);
});

check("legacy no units: both open when handed", () => {
  const item = {
    quantity: 2,
    trackingStatus: "handed_to_courier",
  };
  assert.deepStrictEqual(expandOpenUnits(item), [0, 1]);
});

console.log("\nPassed", passed, "checks");
if (!process.exitCode) console.log("Verification PASSED");
