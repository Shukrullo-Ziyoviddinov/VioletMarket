/**
 * Terminal returned_to_seller vs open no_answer settle.
 * Run: node src/scripts/verifyTerminalReturnedSettle.js
 */
const assert = require("assert");
const {
  areAllItemUnitsSettledForDelivery,
  isUnitSettledForItemDelivery,
} = require("../productManagement/orderItemUnitTracking");

function itemMix() {
  return {
    quantity: 2,
    trackingStatus: "handed_to_courier",
    units: [
      { unitIndex: 0, trackingStatus: "returned_to_seller", trackingHistory: [] },
      { unitIndex: 1, trackingStatus: "handed_to_courier", trackingHistory: [] },
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

check("default (no options): returned blocks", () => {
  assert.strictEqual(
    areAllItemUnitsSettledForDelivery(itemMix(), new Set([1])),
    false,
  );
});

check("return/defective (empty unresolved): settles with delivered sibling", () => {
  assert.strictEqual(
    areAllItemUnitsSettledForDelivery(itemMix(), new Set([1]), {
      unresolvedNoAnswerUnitIndexes: new Set(),
    }),
    true,
  );
});

check("open no_answer unit0: blocks", () => {
  assert.strictEqual(
    areAllItemUnitsSettledForDelivery(itemMix(), new Set([1]), {
      unresolvedNoAnswerUnitIndexes: new Set([0]),
    }),
    false,
  );
});

check("resolved no_answer sold: unit in delivered set wins", () => {
  assert.strictEqual(
    isUnitSettledForItemDelivery(
      itemMix(),
      0,
      new Set([0]),
      { unresolvedNoAnswerUnitIndexes: new Set([0]) },
    ),
    true,
  );
});

check("unavailable still settles without options", () => {
  const item = {
    quantity: 2,
    trackingStatus: "handed_to_courier",
    units: [
      { unitIndex: 0, trackingStatus: "unavailable", trackingHistory: [] },
      { unitIndex: 1, trackingStatus: "handed_to_courier", trackingHistory: [] },
    ],
  };
  assert.strictEqual(areAllItemUnitsSettledForDelivery(item, new Set([1])), true);
});

console.log("\nPassed", passed, "checks");
if (!process.exitCode) console.log("Verification PASSED");
