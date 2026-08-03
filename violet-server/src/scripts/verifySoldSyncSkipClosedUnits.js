/**
 * Sold sync: skip unavailable / cancelled / returned_to_seller units.
 * Run: node src/scripts/verifySoldSyncSkipClosedUnits.js
 */
const assert = require("assert");
const {
  isUnitExcludedFromSoldSync,
} = require("../productManagement/orderItemUnitTracking");

function listSoldSyncUnitIndexes(item) {
  const quantity = Math.max(0, Math.floor(Number(item?.quantity) || 0));
  const indexes = [];
  for (let unitIndex = 0; unitIndex < quantity; unitIndex += 1) {
    if (isUnitExcludedFromSoldSync(item, unitIndex)) continue;
    indexes.push(unitIndex);
  }
  return indexes;
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

check("legacy qty=1 delivered item — include [0]", () => {
  const item = { quantity: 1, trackingStatus: "delivered" };
  assert.deepStrictEqual(listSoldSyncUnitIndexes(item), [0]);
});

check("legacy qty=2 delivered no units — include both", () => {
  const item = { quantity: 2, trackingStatus: "delivered" };
  assert.deepStrictEqual(listSoldSyncUnitIndexes(item), [0, 1]);
});

check("partial unavailable + delivered — only delivered unit", () => {
  const item = {
    quantity: 2,
    trackingStatus: "delivered",
    units: [
      { unitIndex: 0, trackingStatus: "unavailable" },
      { unitIndex: 1, trackingStatus: "delivered" },
    ],
  };
  assert.deepStrictEqual(listSoldSyncUnitIndexes(item), [1]);
});

check("cancelled sibling skipped", () => {
  const item = {
    quantity: 2,
    trackingStatus: "delivered",
    units: [
      { unitIndex: 0, trackingStatus: "cancelled" },
      { unitIndex: 1, trackingStatus: "delivered" },
    ],
  };
  assert.deepStrictEqual(listSoldSyncUnitIndexes(item), [1]);
});

check("returned_to_seller sibling skipped (not customer sold)", () => {
  const item = {
    quantity: 2,
    trackingStatus: "delivered",
    units: [
      { unitIndex: 0, trackingStatus: "returned_to_seller" },
      { unitIndex: 1, trackingStatus: "delivered" },
    ],
  };
  assert.deepStrictEqual(listSoldSyncUnitIndexes(item), [1]);
});

check("no_answer sotildi unit is delivered — included", () => {
  const item = {
    quantity: 1,
    trackingStatus: "delivered",
    units: [{ unitIndex: 0, trackingStatus: "delivered" }],
  };
  assert.strictEqual(isUnitExcludedFromSoldSync(item, 0), false);
  assert.deepStrictEqual(listSoldSyncUnitIndexes(item), [0]);
});

check("all unavailable — include none", () => {
  const item = {
    quantity: 2,
    trackingStatus: "unavailable",
    units: [
      { unitIndex: 0, trackingStatus: "unavailable" },
      { unitIndex: 1, trackingStatus: "unavailable" },
    ],
  };
  assert.deepStrictEqual(listSoldSyncUnitIndexes(item), []);
});

console.log("\nPassed", passed, "checks");
if (!process.exitCode) console.log("Verification PASSED");
