/**
 * Round-2 fix regressiya (re_handoff / deliver / partial return save / sold sync).
 *
 * Senariylar:
 *  A) qty=1 no_answer → Qayta kuryerga → pool OK
 *  B) qty=1 Qayta aktiv (tracking tegilmaydi — regressiya yo‘q)
 *  C) 2 dona: 1 unavailable → Sotildi → item delivered
 *  D) 2 ochiq → Ajdaniya 1 qaytarish → units[] saqlangan, item handed
 *  E) Sold sync skip + cargo/unavailable regressiya
 *
 * Run: node src/scripts/verifyRound2Regression.js
 */
const assert = require("assert");
const {
  ensureItemUnits,
  getItemUnit,
  isClosedUnitStatus,
  isUnitExcludedFromSoldSync,
  areAllItemUnitsSettledForDelivery,
  isItemSettledForOrderDelivery,
  markItemUnitDelivered,
  resolveUnitTrackingStatus,
  isUnitSkippedForCustomerDelivery,
} = require("../productManagement/orderItemUnitTracking");
const {
  normalizeOrderTrackingStatus,
} = require("../productManagement/orderTracking");
const {
  listOpenUnitIndexesForCargo,
} = require("../services/cargoShipments/cargoShipmentSellerService");
const cargoReturn = require("../services/cargoShipments/cargoShipmentUnitReturn");
const {
  applyItemPipelineStatus,
  countOpenItemUnits,
} = require("../productManagement/orderItemUnitPipelineSync");

function expandCourierPoolUnits(item) {
  if (normalizeOrderTrackingStatus(item.trackingStatus) !== "handed_to_courier") {
    return [];
  }
  const unitCount = Math.max(1, Number(item.quantity) || 1);
  const open = [];
  for (let i = 0; i < unitCount; i += 1) {
    if (isClosedUnitStatus(resolveUnitTrackingStatus(item, i))) continue;
    open.push(i);
  }
  return open;
}

/** Mirrors reHandoffNoAnswerOrder tracking (no DB). */
function applyReHandoffTracking(item, unitIndex) {
  const now = new Date();
  ensureItemUnits(item, now);
  const unit = getItemUnit(item, unitIndex);
  if (unit) {
    const prev = normalizeOrderTrackingStatus(unit.trackingStatus);
    if (prev !== "handed_to_courier") {
      unit.trackingStatus = "handed_to_courier";
      if (!Array.isArray(unit.trackingHistory)) unit.trackingHistory = [];
      unit.trackingHistory.push({ status: "handed_to_courier", at: now });
    }
  }
  item.trackingStatus = "handed_to_courier";
  if (!Array.isArray(item.trackingHistory)) item.trackingHistory = [];
  const last = item.trackingHistory[item.trackingHistory.length - 1];
  if (String(last?.status || "") !== "handed_to_courier") {
    item.trackingHistory.push({ status: "handed_to_courier", at: now });
  }
}

/** Mirrors markOrderItemReturnedToSeller (no DB). */
function applyMarkReturned(item, assignmentUnitIndex, assignmentStatuses) {
  const at = new Date();
  ensureItemUnits(item, at);
  const thisUnit = getItemUnit(item, assignmentUnitIndex);
  if (
    thisUnit &&
    resolveUnitTrackingStatus(item, assignmentUnitIndex) !== "returned_to_seller"
  ) {
    thisUnit.trackingStatus = "returned_to_seller";
    if (!Array.isArray(thisUnit.trackingHistory)) thisUnit.trackingHistory = [];
    thisUnit.trackingHistory.push({ status: "returned_to_seller", at });
  }
  const unitCount = Math.max(1, Number(item.quantity) || 1);
  const statusByUnit = new Map(
    Object.entries(assignmentStatuses || {}).map(([k, v]) => [Number(k), String(v)]),
  );
  statusByUnit.set(Number(assignmentUnitIndex) || 0, "returned");
  let allSatisfied = true;
  for (let i = 0; i < unitCount; i += 1) {
    if (String(statusByUnit.get(i) || "") === "returned") continue;
    if (isClosedUnitStatus(resolveUnitTrackingStatus(item, i))) continue;
    allSatisfied = false;
    break;
  }
  if (allSatisfied && String(item.trackingStatus || "") !== "returned_to_seller") {
    item.trackingStatus = "returned_to_seller";
  }
  return { allSatisfied, shouldSave: true };
}

function listSoldSyncIndexes(item) {
  const qty = Math.max(0, Math.floor(Number(item.quantity) || 0));
  const out = [];
  for (let i = 0; i < qty; i += 1) {
    if (isUnitExcludedFromSoldSync(item, i)) continue;
    out.push(i);
  }
  return out;
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

// ── A) re_handoff ───────────────────────────────────────────────────
check("A1 qty=1 return then reHandoff → pool [0]", () => {
  const item = {
    quantity: 1,
    trackingStatus: "returned_to_seller",
    trackingHistory: [],
    units: [
      { unitIndex: 0, trackingStatus: "returned_to_seller", trackingHistory: [] },
    ],
  };
  // bug reproduction: item-only flip
  item.trackingStatus = "handed_to_courier";
  assert.deepStrictEqual(expandCourierPoolUnits(item), []);

  applyReHandoffTracking(item, 0);
  assert.deepStrictEqual(expandCourierPoolUnits(item), [0]);
  assert.strictEqual(isClosedUnitStatus(resolveUnitTrackingStatus(item, 0)), false);
});

check("A2 partial unavailable + reHandoff unit1 → pool [1]", () => {
  const item = {
    quantity: 2,
    trackingStatus: "returned_to_seller",
    trackingHistory: [],
    units: [
      { unitIndex: 0, trackingStatus: "unavailable", trackingHistory: [] },
      {
        unitIndex: 1,
        trackingStatus: "returned_to_seller",
        trackingHistory: [],
      },
    ],
  };
  applyReHandoffTracking(item, 1);
  assert.strictEqual(resolveUnitTrackingStatus(item, 0), "unavailable");
  assert.deepStrictEqual(expandCourierPoolUnits(item), [1]);
});

// ── B) Qayta aktiv — tracking ochilmaydi (ombor alohida) ─────────────
check("B1 reactivate does not require unit reopen for pool", () => {
  // Qayta aktiv: assignment o‘chadi, ombor +1; kuryer poolga chiqishi shart emas
  const item = {
    quantity: 1,
    trackingStatus: "returned_to_seller",
    units: [
      { unitIndex: 0, trackingStatus: "returned_to_seller", trackingHistory: [] },
    ],
  };
  assert.strictEqual(isClosedUnitStatus(resolveUnitTrackingStatus(item, 0)), true);
  assert.deepStrictEqual(expandCourierPoolUnits(item), []);
});

// ── C) Sotildi + unavailable ────────────────────────────────────────
check("C1 unavailable + deliver remaining → item/order settled", () => {
  const item = {
    quantity: 2,
    trackingStatus: "handed_to_courier",
    trackingHistory: [],
    units: [
      { unitIndex: 0, trackingStatus: "unavailable", trackingHistory: [] },
      { unitIndex: 1, trackingStatus: "handed_to_courier", trackingHistory: [] },
    ],
  };
  markItemUnitDelivered(item, 1, new Date());
  assert.strictEqual(resolveUnitTrackingStatus(item, 0), "unavailable");
  assert.strictEqual(resolveUnitTrackingStatus(item, 1), "delivered");
  assert.strictEqual(areAllItemUnitsSettledForDelivery(item, new Set([1])), true);
  item.trackingStatus = "delivered";
  assert.strictEqual(isItemSettledForOrderDelivery(item), true);
  assert.strictEqual(isItemSettledForOrderDelivery({ trackingStatus: "unavailable" }), true);
});

check("C2 returned_to_seller sibling still blocks item delivered", () => {
  const item = {
    quantity: 2,
    trackingStatus: "handed_to_courier",
    units: [
      { unitIndex: 0, trackingStatus: "returned_to_seller", trackingHistory: [] },
      { unitIndex: 1, trackingStatus: "handed_to_courier", trackingHistory: [] },
    ],
  };
  assert.strictEqual(areAllItemUnitsSettledForDelivery(item, new Set([1])), false);
  assert.strictEqual(isUnitSkippedForCustomerDelivery("returned_to_seller"), false);
});

// ── D) Partial Ajdaniya save ────────────────────────────────────────
check("D1 two open: return one → unit saved, item stays handed", () => {
  const item = {
    quantity: 2,
    trackingStatus: "handed_to_courier",
    trackingHistory: [],
    units: [
      { unitIndex: 0, trackingStatus: "handed_to_courier", trackingHistory: [] },
      { unitIndex: 1, trackingStatus: "handed_to_courier", trackingHistory: [] },
    ],
  };
  const result = applyMarkReturned(item, 0, {
    0: "returned",
    1: "out_for_delivery",
  });
  assert.strictEqual(result.allSatisfied, false);
  assert.strictEqual(result.shouldSave, true);
  assert.strictEqual(resolveUnitTrackingStatus(item, 0), "returned_to_seller");
  assert.strictEqual(item.trackingStatus, "handed_to_courier");
  assert.deepStrictEqual(expandCourierPoolUnits(item), [1]);
});

check("D2 unavailable + return last → item returned_to_seller", () => {
  const item = {
    quantity: 2,
    trackingStatus: "handed_to_courier",
    trackingHistory: [],
    units: [
      { unitIndex: 0, trackingStatus: "unavailable", trackingHistory: [] },
      { unitIndex: 1, trackingStatus: "handed_to_courier", trackingHistory: [] },
    ],
  };
  const result = applyMarkReturned(item, 1, { 1: "returned" });
  assert.strictEqual(result.allSatisfied, true);
  assert.strictEqual(item.trackingStatus, "returned_to_seller");
});

// ── E) Sold sync + cargo / mavjud emas regressiya ────────────────────
check("E1 sold sync skips closed, keeps delivered", () => {
  const item = {
    quantity: 2,
    trackingStatus: "delivered",
    units: [
      { unitIndex: 0, trackingStatus: "unavailable" },
      { unitIndex: 1, trackingStatus: "delivered" },
    ],
  };
  assert.deepStrictEqual(listSoldSyncIndexes(item), [1]);
});

check("E2 legacy delivered still syncs all units", () => {
  assert.deepStrictEqual(
    listSoldSyncIndexes({ quantity: 2, trackingStatus: "delivered" }),
    [0, 1],
  );
});

check("E3 cargo + pipeline after partial unavailable", () => {
  const item = {
    quantity: 2,
    trackingStatus: "accepted",
    trackingHistory: [],
    units: [
      { unitIndex: 0, trackingStatus: "unavailable", trackingHistory: [] },
      { unitIndex: 1, trackingStatus: "accepted", trackingHistory: [] },
    ],
  };
  applyItemPipelineStatus(item, "collected", new Date());
  assert.strictEqual(countOpenItemUnits(item), 1);
  assert.deepStrictEqual(listOpenUnitIndexesForCargo(item), [1]);
});

check("E4 logistica unit return still OK", () => {
  const shipment = {
    status: "accepted",
    products: [
      { unitIndex: 0, returnStatus: "active", quantity: 1 },
      { unitIndex: 1, returnStatus: "active", quantity: 1 },
    ],
  };
  cargoReturn.setProductReturnStatus(shipment, 0, "returned");
  cargoReturn.recomputeShipmentStatusFromProducts(shipment);
  assert.strictEqual(shipment.status, "accepted");
  assert.deepStrictEqual(cargoReturn.listActiveProductUnitIndexes(shipment), [1]);
});

console.log("\nPassed", passed, "checks");
if (!process.exitCode) console.log("Verification PASSED");
