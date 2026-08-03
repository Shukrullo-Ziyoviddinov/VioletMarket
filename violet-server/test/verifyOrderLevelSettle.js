/**
 * Order-level settle: terminal returned_to_seller OK; open no_answer not.
 * Run: node test/verifyOrderLevelSettle.js
 */
const assert = require("assert");
const {
  isItemSettledForOrderDelivery,
} = require("../src/productManagement/orderItemUnitTracking");

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

check("delivered / unavailable / cancelled", () => {
  assert.strictEqual(isItemSettledForOrderDelivery({ trackingStatus: "delivered" }), true);
  assert.strictEqual(isItemSettledForOrderDelivery({ trackingStatus: "unavailable" }), true);
  assert.strictEqual(isItemSettledForOrderDelivery({ trackingStatus: "cancelled" }), true);
});

check("returned_to_seller without options → false", () => {
  assert.strictEqual(
    isItemSettledForOrderDelivery({ trackingStatus: "returned_to_seller" }),
    false,
  );
});

check("terminal returned (empty unresolved) → true", () => {
  assert.strictEqual(
    isItemSettledForOrderDelivery(
      { trackingStatus: "returned_to_seller", quantity: 2 },
      { unresolvedNoAnswerUnitIndexes: new Set() },
    ),
    true,
  );
});

check("open no_answer on item → false", () => {
  assert.strictEqual(
    isItemSettledForOrderDelivery(
      { trackingStatus: "returned_to_seller", quantity: 1 },
      { unresolvedNoAnswerUnitIndexes: new Set([0]) },
    ),
    false,
  );
});

check("multi-item simulation: A returned terminal + B delivered", () => {
  const items = [
    { trackingStatus: "returned_to_seller", quantity: 1 },
    { trackingStatus: "delivered", quantity: 1 },
  ];
  const unresolvedByItem = [new Set(), new Set()];
  const allOk = items.every((item, index) =>
    isItemSettledForOrderDelivery(item, {
      unresolvedNoAnswerUnitIndexes: unresolvedByItem[index],
    }),
  );
  assert.strictEqual(allOk, true);
});

check("multi-item: A open no_answer blocks order", () => {
  const items = [
    { trackingStatus: "returned_to_seller", quantity: 1 },
    { trackingStatus: "delivered", quantity: 1 },
  ];
  const unresolvedByItem = [new Set([0]), new Set()];
  const allOk = items.every((item, index) =>
    isItemSettledForOrderDelivery(item, {
      unresolvedNoAnswerUnitIndexes: unresolvedByItem[index],
    }),
  );
  assert.strictEqual(allOk, false);
});

check("BUGFIX: item aggregate delivered + open no_answer sibling → NOT settled", () => {
  const item = {
    quantity: 2,
    trackingStatus: "delivered",
    units: [
      { unitIndex: 0, trackingStatus: "delivered", trackingHistory: [] },
      { unitIndex: 1, trackingStatus: "returned_to_seller", trackingHistory: [] },
    ],
  };
  assert.strictEqual(
    isItemSettledForOrderDelivery(item, {
      unresolvedNoAnswerUnitIndexes: new Set([1]),
    }),
    false,
  );
});

check("item aggregate delivered + both units closed (empty unresolved) → settled", () => {
  const item = {
    quantity: 2,
    trackingStatus: "delivered",
    units: [
      { unitIndex: 0, trackingStatus: "delivered", trackingHistory: [] },
      { unitIndex: 1, trackingStatus: "delivered", trackingHistory: [] },
    ],
  };
  assert.strictEqual(
    isItemSettledForOrderDelivery(item, {
      unresolvedNoAnswerUnitIndexes: new Set(),
    }),
    true,
  );
});

console.log("\nPassed", passed, "checks");
if (!process.exitCode) console.log("Verification PASSED");
