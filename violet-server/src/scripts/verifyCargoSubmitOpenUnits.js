/**
 * Cargo submit — faqat ochiq donalar products[] ga.
 * Run: node src/scripts/verifyCargoSubmitOpenUnits.js
 */
const assert = require("assert");
const {
  listOpenUnitIndexesForCargo,
} = require("../services/cargoShipments/cargoShipmentSellerService");

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

check("skips unavailable unit, keeps original unitIndex", () => {
  const item = {
    quantity: 3,
    trackingStatus: "collected",
    units: [
      { unitIndex: 0, trackingStatus: "unavailable" },
      { unitIndex: 1, trackingStatus: "collected" },
      { unitIndex: 2, trackingStatus: "collected" },
    ],
  };
  assert.deepStrictEqual(listOpenUnitIndexesForCargo(item), [1, 2]);
});

check("skips cancelled sibling", () => {
  const item = {
    quantity: 2,
    trackingStatus: "collected",
    units: [
      { unitIndex: 0, trackingStatus: "cancelled" },
      { unitIndex: 1, trackingStatus: "collected" },
    ],
  };
  assert.deepStrictEqual(listOpenUnitIndexesForCargo(item), [1]);
});

check("legacy no units[] — all open when collected", () => {
  const item = {
    quantity: 2,
    trackingStatus: "collected",
  };
  assert.deepStrictEqual(listOpenUnitIndexesForCargo(item), [0, 1]);
});

check("all closed → empty list", () => {
  const item = {
    quantity: 2,
    trackingStatus: "unavailable",
    units: [
      { unitIndex: 0, trackingStatus: "unavailable" },
      { unitIndex: 1, trackingStatus: "unavailable" },
    ],
  };
  assert.deepStrictEqual(listOpenUnitIndexesForCargo(item), []);
});

console.log("\nPassed", passed, "checks");
if (!process.exitCode) console.log("Verification PASSED");
