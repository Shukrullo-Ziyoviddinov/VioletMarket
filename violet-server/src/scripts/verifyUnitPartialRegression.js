/**
 * Unit-level fix — to‘liq regressiya (DB yo‘q).
 *
 * Senariylar:
 *  A) qty=1 — eski oqim
 *  B) 2 dona: 1 unavailable → confirm/collect/handoff → faqat 1 kuryer/cargo
 *  C) partial → cancel → ombor faqat 1 dona
 *  D) Ajdaniya qaytarish (qty=1 + partial)
 *  E) Logistica dona qaytarish
 *
 * Run: node src/scripts/verifyUnitPartialRegression.js
 */
const assert = require("assert");
const {
  applyItemPipelineStatus,
  cancelOpenItemUnits,
  countOpenItemUnits,
} = require("../productManagement/orderItemUnitPipelineSync");
const {
  ensureItemUnits,
  getItemUnit,
  isClosedUnitStatus,
  recomputeItemTrackingStatusFromUnits,
  resolveUnitTrackingStatus,
} = require("../productManagement/orderItemUnitTracking");
const {
  listOpenUnitIndexesForCargo,
} = require("../services/cargoShipments/cargoShipmentSellerService");
const cargoReturn = require("../services/cargoShipments/cargoShipmentUnitReturn");
const {
  assignmentUnitKey,
  isReacceptableAssignmentStatus,
  isTakenAssignmentStatus,
} = require("../unitLifecycle/assignmentPoolRules");

function expandCourierPoolUnits(item) {
  const unitCount = Math.max(1, Number(item.quantity) || 1);
  const open = [];
  for (let unitIndex = 0; unitIndex < unitCount; unitIndex += 1) {
    if (isClosedUnitStatus(resolveUnitTrackingStatus(item, unitIndex))) continue;
    open.push(unitIndex);
  }
  return open;
}

/** Mirrors markOrderItemReturnedToSeller satisfaction (no DB). */
function wouldMarkItemReturnedToSeller(item, assignmentUnitIndex, assignmentStatuses) {
  const at = new Date();
  ensureItemUnits(item, at);
  const thisUnit = getItemUnit(item, assignmentUnitIndex);
  if (thisUnit && resolveUnitTrackingStatus(item, assignmentUnitIndex) !== "returned_to_seller") {
    thisUnit.trackingStatus = "returned_to_seller";
    if (!Array.isArray(thisUnit.trackingHistory)) thisUnit.trackingHistory = [];
    thisUnit.trackingHistory.push({ status: "returned_to_seller", at });
  }
  const unitCount = Math.max(1, Number(item.quantity) || 1);
  const statusByUnit = new Map(
    Object.entries(assignmentStatuses || {}).map(([k, v]) => [Number(k), String(v)]),
  );
  statusByUnit.set(Number(assignmentUnitIndex) || 0, "returned");
  for (let i = 0; i < unitCount; i += 1) {
    const assignStatus = String(statusByUnit.get(i) || "");
    if (assignStatus === "returned" || assignStatus === "delivered") continue;
    const unitStatus = resolveUnitTrackingStatus(item, i);
    if (unitStatus === "delivered") continue;
    if (isClosedUnitStatus(unitStatus)) continue;
    return false;
  }
  recomputeItemTrackingStatusFromUnits(item);
  return true;
}

function makeQty1() {
  return {
    quantity: 1,
    trackingStatus: "accepted",
    trackingHistory: [{ status: "accepted", at: new Date() }],
  };
}

function makePartialUnavailable() {
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

function makeCargoShipment(qty = 2) {
  const products = [];
  for (let unitIndex = 0; unitIndex < qty; unitIndex += 1) {
    products.push({
      productId: 10,
      quantity: 1,
      unitIndex,
      returnStatus: "active",
      weightKg: 1,
    });
  }
  return {
    status: "accepted",
    acceptedAt: new Date(),
    logisticaId: "x",
    products,
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

// ── A) qty=1 eski oqim ──────────────────────────────────────────────
check("A1 qty=1 pipeline confirm→collect→handoff", () => {
  const item = makeQty1();
  applyItemPipelineStatus(item, "seller_confirmed", new Date());
  applyItemPipelineStatus(item, "collected", new Date());
  applyItemPipelineStatus(item, "handed_to_courier", new Date());
  assert.strictEqual(item.trackingStatus, "handed_to_courier");
  assert.strictEqual(resolveUnitTrackingStatus(item, 0), "handed_to_courier");
  assert.deepStrictEqual(expandCourierPoolUnits(item), [0]);
});

check("A2 qty=1 cargo open units = [0]", () => {
  const item = makeQty1();
  applyItemPipelineStatus(item, "seller_confirmed", new Date());
  applyItemPipelineStatus(item, "collected", new Date());
  assert.deepStrictEqual(listOpenUnitIndexesForCargo(item), [0]);
});

check("A3 qty=1 cancel releases 1", () => {
  const item = makeQty1();
  applyItemPipelineStatus(item, "seller_confirmed", new Date());
  assert.strictEqual(countOpenItemUnits(item), 1);
  const result = cancelOpenItemUnits(item, new Date());
  assert.strictEqual(result.cancelledCount, 1);
  assert.strictEqual(item.trackingStatus, "cancelled");
});

check("A4 qty=1 Ajdaniya return marks item", () => {
  const item = makeQty1();
  applyItemPipelineStatus(item, "handed_to_courier", new Date());
  assert.strictEqual(wouldMarkItemReturnedToSeller(item, 0, { 0: "return_to_seller" }), true);
  assert.strictEqual(item.trackingStatus, "returned_to_seller");
});

check("A5 qty=1 pool keys + reaccept rules unchanged", () => {
  assert.strictEqual(assignmentUnitKey(10, 0, 0), "10:0:0");
  assert.strictEqual(isTakenAssignmentStatus("returned"), true);
  assert.strictEqual(isReacceptableAssignmentStatus("cancelled"), true);
  assert.strictEqual(isReacceptableAssignmentStatus("returned"), false);
});

// ── B) partial unavailable → pipeline → 1 courier/cargo ─────────────
check("B1 partial: confirm/collect/handoff keeps unavailable", () => {
  const item = makePartialUnavailable();
  applyItemPipelineStatus(item, "seller_confirmed", new Date());
  applyItemPipelineStatus(item, "collected", new Date());
  applyItemPipelineStatus(item, "handed_to_courier", new Date());
  assert.strictEqual(resolveUnitTrackingStatus(item, 0), "unavailable");
  assert.strictEqual(resolveUnitTrackingStatus(item, 1), "handed_to_courier");
  assert.strictEqual(item.trackingStatus, "handed_to_courier");
});

check("B2 partial: courier pool only open unit", () => {
  const item = makePartialUnavailable();
  applyItemPipelineStatus(item, "handed_to_courier", new Date());
  assert.deepStrictEqual(expandCourierPoolUnits(item), [1]);
});

check("B3 partial: cargo products only open unitIndex", () => {
  const item = makePartialUnavailable();
  applyItemPipelineStatus(item, "collected", new Date());
  assert.deepStrictEqual(listOpenUnitIndexesForCargo(item), [1]);
});

// ── C) partial → cancel → ombor 1 ───────────────────────────────────
check("C1 partial cancel: release count = 1, unavailable untouched", () => {
  const item = makePartialUnavailable();
  applyItemPipelineStatus(item, "seller_confirmed", new Date());
  assert.strictEqual(countOpenItemUnits(item), 1);
  const result = cancelOpenItemUnits(item, new Date());
  assert.strictEqual(result.cancelledCount, 1);
  assert.strictEqual(resolveUnitTrackingStatus(item, 0), "unavailable");
  assert.strictEqual(resolveUnitTrackingStatus(item, 1), "cancelled");
  // mix closed without return → unavailable preferred over cancelled
  assert.strictEqual(item.trackingStatus, "unavailable");
});

// ── D) Ajdaniya qty=1 + partial ─────────────────────────────────────
check("D1 partial Ajdaniya: closed sibling satisfied → mark returned_to_seller", () => {
  const item = makePartialUnavailable();
  applyItemPipelineStatus(item, "handed_to_courier", new Date());
  assert.strictEqual(
    wouldMarkItemReturnedToSeller(item, 1, { 1: "return_to_seller" }),
    true,
  );
  assert.strictEqual(resolveUnitTrackingStatus(item, 0), "unavailable");
  assert.strictEqual(resolveUnitTrackingStatus(item, 1), "returned_to_seller");
  assert.strictEqual(item.trackingStatus, "returned_to_seller");
});

check("D2 two open units: one returned does not mark item", () => {
  const item = {
    quantity: 2,
    trackingStatus: "handed_to_courier",
    trackingHistory: [],
    units: [
      { unitIndex: 0, trackingStatus: "handed_to_courier", trackingHistory: [] },
      { unitIndex: 1, trackingStatus: "handed_to_courier", trackingHistory: [] },
    ],
  };
  assert.strictEqual(
    wouldMarkItemReturnedToSeller(item, 0, {
      0: "return_to_seller",
      1: "out_for_delivery",
    }),
    false,
  );
  assert.strictEqual(resolveUnitTrackingStatus(item, 0), "returned_to_seller");
  assert.strictEqual(item.trackingStatus, "handed_to_courier");
});

check("D3 reactivate path: returned assignment is taken until deleted", () => {
  // re_handoff/reactivate deletes assignment → then unit reappears in pool
  assert.strictEqual(isTakenAssignmentStatus("returned"), true);
  assert.strictEqual(assignmentUnitKey(99, 0, 1), "99:0:1");
});

// ── E) Logistica dona qaytarish ─────────────────────────────────────
check("E1 logistica partial return keeps shipment accepted", () => {
  const shipment = makeCargoShipment(2);
  cargoReturn.setProductReturnStatus(shipment, 0, "return_request_pending");
  cargoReturn.recomputeShipmentStatusFromProducts(shipment);
  assert.strictEqual(shipment.status, "accepted");
  assert.deepStrictEqual(cargoReturn.listActiveProductUnitIndexes(shipment), [1]);
});

check("E2 logistica amount per unit (price, not lineTotal)", () => {
  assert.strictEqual(
    cargoReturn.resolveCargoUnitAmount(
      { price: 50000, lineTotal: 100000, quantity: 2 },
      2,
    ),
    50000,
  );
});

check("E3 logistica all returned → returned_to_seller", () => {
  const shipment = makeCargoShipment(2);
  cargoReturn.setProductReturnStatus(shipment, 0, "returned");
  cargoReturn.setProductReturnStatus(shipment, 1, "returned");
  cargoReturn.recomputeShipmentStatusFromProducts(shipment);
  assert.strictEqual(shipment.status, "returned_to_seller");
});

check("E4 cargo submit skipped unit not in products — normalize picks active", () => {
  // Simulate submit that only shipped open unitIndex 1
  const shipment = {
    status: "accepted",
    products: [
      {
        productId: 10,
        quantity: 1,
        unitIndex: 1,
        returnStatus: "active",
        weightKg: 1,
      },
    ],
  };
  assert.deepStrictEqual(cargoReturn.normalizeCargoUnitIndexes(null, shipment), [1]);
  assert.deepStrictEqual(cargoReturn.listActiveProductUnitIndexes(shipment), [1]);
});

console.log("\nPassed", passed, "checks");
if (!process.exitCode) console.log("Verification PASSED");
