/**
 * Deliver: unavailable/cancelled count as settled; returned_to_seller does NOT.
 * Run: node src/scripts/verifyDeliverClosedUnitsSettled.js
 */
const assert = require("assert");
const {
  areAllItemUnitsSettledForDelivery,
  isItemSettledForOrderDelivery,
  isUnitSettledForItemDelivery,
  markItemUnitDelivered,
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

check("qty=1 delivered only → settled", () => {
  const item = {
    quantity: 1,
    trackingStatus: "handed_to_courier",
    units: [{ unitIndex: 0, trackingStatus: "handed_to_courier", trackingHistory: [] }],
  };
  assert.strictEqual(areAllItemUnitsSettledForDelivery(item, new Set([0])), true);
  markItemUnitDelivered(item, 0, new Date());
  assert.strictEqual(resolveUnitTrackingStatus(item, 0), "delivered");
});

check("partial unavailable + delivered unit → item settled", () => {
  const item = {
    quantity: 2,
    trackingStatus: "handed_to_courier",
    units: [
      { unitIndex: 0, trackingStatus: "unavailable", trackingHistory: [] },
      { unitIndex: 1, trackingStatus: "handed_to_courier", trackingHistory: [] },
    ],
  };
  assert.strictEqual(isUnitSettledForItemDelivery(item, 0, new Set()), true);
  assert.strictEqual(isUnitSettledForItemDelivery(item, 1, new Set()), false);
  assert.strictEqual(areAllItemUnitsSettledForDelivery(item, new Set([1])), true);
});

check("returned_to_seller sibling NOT settled until sold/delivered", () => {
  const item = {
    quantity: 2,
    trackingStatus: "handed_to_courier",
    units: [
      { unitIndex: 0, trackingStatus: "returned_to_seller", trackingHistory: [] },
      { unitIndex: 1, trackingStatus: "handed_to_courier", trackingHistory: [] },
    ],
  };
  // Options yo‘q → xavfsiz default (no_answer himoyasi)
  assert.strictEqual(areAllItemUnitsSettledForDelivery(item, new Set([1])), false);
  assert.strictEqual(isUnitSettledForItemDelivery(item, 0, new Set([0])), true);
});

check("terminal returned_to_seller (empty unresolved) + delivered → settled", () => {
  const item = {
    quantity: 2,
    trackingStatus: "handed_to_courier",
    units: [
      { unitIndex: 0, trackingStatus: "returned_to_seller", trackingHistory: [] },
      { unitIndex: 1, trackingStatus: "handed_to_courier", trackingHistory: [] },
    ],
  };
  const opts = { unresolvedNoAnswerUnitIndexes: new Set() };
  assert.strictEqual(
    areAllItemUnitsSettledForDelivery(item, new Set([1]), opts),
    true,
  );
});

check("open no_answer returned_to_seller blocks settle", () => {
  const item = {
    quantity: 2,
    trackingStatus: "handed_to_courier",
    units: [
      { unitIndex: 0, trackingStatus: "returned_to_seller", trackingHistory: [] },
      { unitIndex: 1, trackingStatus: "handed_to_courier", trackingHistory: [] },
    ],
  };
  const opts = { unresolvedNoAnswerUnitIndexes: new Set([0]) };
  assert.strictEqual(
    areAllItemUnitsSettledForDelivery(item, new Set([1]), opts),
    false,
  );
  // Joriy dona delivered setda — o‘zi OK
  assert.strictEqual(
    isUnitSettledForItemDelivery(item, 0, new Set([0]), opts),
    true,
  );
});

check("cancelled sibling + delivered → settled", () => {
  const item = {
    quantity: 2,
    trackingStatus: "handed_to_courier",
    units: [
      { unitIndex: 0, trackingStatus: "cancelled", trackingHistory: [] },
      { unitIndex: 1, trackingStatus: "handed_to_courier", trackingHistory: [] },
    ],
  };
  assert.strictEqual(areAllItemUnitsSettledForDelivery(item, new Set([1])), true);
});

check("markItemUnitDelivered skips unavailable", () => {
  const item = {
    quantity: 2,
    trackingStatus: "handed_to_courier",
    units: [
      { unitIndex: 0, trackingStatus: "unavailable", trackingHistory: [] },
      { unitIndex: 1, trackingStatus: "handed_to_courier", trackingHistory: [] },
    ],
  };
  assert.strictEqual(markItemUnitDelivered(item, 0, new Date()), false);
  assert.strictEqual(resolveUnitTrackingStatus(item, 0), "unavailable");
  assert.strictEqual(markItemUnitDelivered(item, 1, new Date()), true);
});

check("no_answer sotildi: returned_to_seller → delivered allowed", () => {
  const item = {
    quantity: 1,
    trackingStatus: "returned_to_seller",
    units: [
      { unitIndex: 0, trackingStatus: "returned_to_seller", trackingHistory: [] },
    ],
  };
  assert.strictEqual(markItemUnitDelivered(item, 0, new Date()), true);
  assert.strictEqual(resolveUnitTrackingStatus(item, 0), "delivered");
});

check("order settled: unavailable item counts as done", () => {
  assert.strictEqual(
    isItemSettledForOrderDelivery({ trackingStatus: "unavailable" }),
    true,
  );
  // Options yo‘q — ochiq no_answer himoyasi
  assert.strictEqual(
    isItemSettledForOrderDelivery({ trackingStatus: "returned_to_seller" }),
    false,
  );
  assert.strictEqual(
    isItemSettledForOrderDelivery({ trackingStatus: "delivered" }),
    true,
  );
});

check("order settled: terminal returned_to_seller with empty unresolved", () => {
  assert.strictEqual(
    isItemSettledForOrderDelivery(
      { trackingStatus: "returned_to_seller", quantity: 1 },
      { unresolvedNoAnswerUnitIndexes: new Set() },
    ),
    true,
  );
  assert.strictEqual(
    isItemSettledForOrderDelivery(
      { trackingStatus: "returned_to_seller", quantity: 1 },
      { unresolvedNoAnswerUnitIndexes: new Set([0]) },
    ),
    false,
  );
});

check("order settled: multi-unit item via unit statuses when aggregate lag", () => {
  const item = {
    quantity: 2,
    trackingStatus: "handed_to_courier",
    units: [
      { unitIndex: 0, trackingStatus: "returned_to_seller" },
      { unitIndex: 1, trackingStatus: "delivered" },
    ],
  };
  assert.strictEqual(
    isItemSettledForOrderDelivery(item, {
      unresolvedNoAnswerUnitIndexes: new Set(),
    }),
    true,
  );
  assert.strictEqual(
    isItemSettledForOrderDelivery(item, {
      unresolvedNoAnswerUnitIndexes: new Set([0]),
    }),
    false,
  );
});

check("two open: only one delivered → not settled", () => {
  const item = {
    quantity: 2,
    trackingStatus: "handed_to_courier",
    units: [
      { unitIndex: 0, trackingStatus: "handed_to_courier", trackingHistory: [] },
      { unitIndex: 1, trackingStatus: "handed_to_courier", trackingHistory: [] },
    ],
  };
  assert.strictEqual(areAllItemUnitsSettledForDelivery(item, new Set([0])), false);
});

console.log("\nPassed", passed, "checks");
if (!process.exitCode) console.log("Verification PASSED");
