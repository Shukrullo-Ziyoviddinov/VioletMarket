/**
 * Cargo return should settle order.status like courier markReturned.
 * Run: node test/verifyCargoOrderSettle.js
 */
const assert = require("assert");
const {
  ensureItemUnits,
  getItemUnit,
  resolveUnitTrackingStatus,
  recomputeItemTrackingStatusFromUnits,
  isItemSettledForOrderDelivery,
} = require("../src/productManagement/orderItemUnitTracking");
const {
  normalizeOrderTrackingStatus,
} = require("../src/productManagement/orderTracking");

/**
 * Mirrors markOrderItemReturnedToSellerFromCargo tracking + order settle decision (no DB).
 */
function applyCargoReturnedMark(order, itemIndex, unitIndex, at = new Date()) {
  const item = order.items[itemIndex];
  ensureItemUnits(item, at);
  const unit = getItemUnit(item, unitIndex);
  if (unit) {
    const unitStatus = resolveUnitTrackingStatus(item, unitIndex);
    if (unitStatus !== "delivered" && unitStatus !== "returned_to_seller") {
      unit.trackingStatus = "returned_to_seller";
      if (!Array.isArray(unit.trackingHistory)) unit.trackingHistory = [];
      unit.trackingHistory.push({ status: "returned_to_seller", at });
    }
  }
  recomputeItemTrackingStatusFromUnits(item);

  // Simulate areAllOrderItemsSettledForDelivery with empty unresolved (terminal cargo)
  const allSettled = (order.items || []).every((row) =>
    isItemSettledForOrderDelivery(row, {
      unresolvedNoAnswerUnitIndexes: new Set(),
    }),
  );
  if (allSettled && String(order.status) !== "delivered") {
    order.status = "delivered";
  }
  return {
    itemStatus: normalizeOrderTrackingStatus(item.trackingStatus),
    orderStatus: order.status,
    allSettled,
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

check("mixed: item0 delivered + cargo return item1 → order delivered", () => {
  const order = {
    id: 1,
    status: "processing",
    items: [
      {
        sellerId: "s1",
        quantity: 1,
        trackingStatus: "delivered",
        units: [{ unitIndex: 0, trackingStatus: "delivered", trackingHistory: [] }],
      },
      {
        sellerId: "s1",
        quantity: 1,
        trackingStatus: "handed_to_cargo",
        units: [
          { unitIndex: 0, trackingStatus: "handed_to_cargo", trackingHistory: [] },
        ],
      },
    ],
  };
  const result = applyCargoReturnedMark(order, 1, 0);
  assert.strictEqual(result.itemStatus, "returned_to_seller");
  assert.strictEqual(result.allSettled, true);
  assert.strictEqual(order.status, "delivered");
});

check("does not overwrite delivered unit on cargo mark", () => {
  const order = {
    id: 2,
    status: "processing",
    items: [
      {
        sellerId: "s1",
        quantity: 1,
        trackingStatus: "delivered",
        units: [{ unitIndex: 0, trackingStatus: "delivered", trackingHistory: [] }],
      },
    ],
  };
  applyCargoReturnedMark(order, 0, 0);
  assert.strictEqual(resolveUnitTrackingStatus(order.items[0], 0), "delivered");
});

check("open no_answer sibling item still blocks order", () => {
  const items = [
    { trackingStatus: "returned_to_seller", quantity: 1 },
    { trackingStatus: "delivered", quantity: 1 },
  ];
  const ok = items.every((item, index) =>
    isItemSettledForOrderDelivery(item, {
      unresolvedNoAnswerUnitIndexes: index === 0 ? new Set([0]) : new Set(),
    }),
  );
  assert.strictEqual(ok, false);
});

console.log("\nPassed", passed, "checks");
if (!process.exitCode) console.log("Verification PASSED");
