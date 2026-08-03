/**
 * Round-3 settle regressiya (terminal return / delivered sibling / order-level).
 *
 * Senariylar:
 *  A) qty=2: return/defective + Sotildi → item/order settled
 *  B) qty=2: ochiq no_answer + Sotildi → item/order NOT settled
 *  C) avval Sotildi, keyin qaytarish → item delivered
 *  D) multi-item: A terminal returned + B delivered → order OK
 *  E) re_handoff / unavailable / cargo regressiya
 *
 * Run: node src/scripts/verifyRound3Regression.js
 */
const assert = require("assert");
const {
  ensureItemUnits,
  getItemUnit,
  isClosedUnitStatus,
  resolveUnitTrackingStatus,
  areAllItemUnitsSettledForDelivery,
  isItemSettledForOrderDelivery,
  markItemUnitDelivered,
  recomputeItemTrackingStatusFromUnits,
} = require("../productManagement/orderItemUnitTracking");
const {
  normalizeOrderTrackingStatus,
} = require("../productManagement/orderTracking");
const {
  listOpenUnitIndexesForCargo,
} = require("../services/cargoShipments/cargoShipmentSellerService");
const {
  applyItemPipelineStatus,
} = require("../productManagement/orderItemUnitPipelineSync");

function applyReHandoffTracking(item, unitIndex) {
  const now = new Date();
  ensureItemUnits(item, now);
  const unit = getItemUnit(item, unitIndex);
  if (unit && normalizeOrderTrackingStatus(unit.trackingStatus) !== "handed_to_courier") {
    unit.trackingStatus = "handed_to_courier";
    if (!Array.isArray(unit.trackingHistory)) unit.trackingHistory = [];
    unit.trackingHistory.push({ status: "handed_to_courier", at: now });
  }
  item.trackingStatus = "handed_to_courier";
}

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
    const assignStatus = String(statusByUnit.get(i) || "");
    if (assignStatus === "returned" || assignStatus === "delivered") continue;
    const unitStatus = resolveUnitTrackingStatus(item, i);
    if (unitStatus === "delivered") continue;
    if (isClosedUnitStatus(unitStatus)) continue;
    allSatisfied = false;
    break;
  }

  if (allSatisfied) {
    for (let i = 0; i < unitCount; i += 1) {
      if (String(statusByUnit.get(i) || "") !== "returned") continue;
      const unit = getItemUnit(item, i);
      if (!unit) continue;
      const st = resolveUnitTrackingStatus(item, i);
      if (
        st === "delivered" ||
        st === "returned_to_seller" ||
        st === "unavailable" ||
        st === "cancelled"
      ) {
        continue;
      }
      unit.trackingStatus = "returned_to_seller";
    }
    recomputeItemTrackingStatusFromUnits(item);
  }
  return { allSatisfied };
}

function expandCourierPoolUnits(item) {
  if (normalizeOrderTrackingStatus(item.trackingStatus) !== "handed_to_courier") {
    return [];
  }
  const qty = Math.max(1, Number(item.quantity) || 1);
  const open = [];
  for (let i = 0; i < qty; i += 1) {
    if (isClosedUnitStatus(resolveUnitTrackingStatus(item, i))) continue;
    open.push(i);
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

// ── A) terminal return + deliver ────────────────────────────────────
check("A1 return sibling + deliver → item units settled", () => {
  const item = {
    quantity: 2,
    trackingStatus: "handed_to_courier",
    units: [
      { unitIndex: 0, trackingStatus: "returned_to_seller", trackingHistory: [] },
      { unitIndex: 1, trackingStatus: "handed_to_courier", trackingHistory: [] },
    ],
  };
  markItemUnitDelivered(item, 1, new Date());
  assert.strictEqual(
    areAllItemUnitsSettledForDelivery(item, new Set([1]), {
      unresolvedNoAnswerUnitIndexes: new Set(),
    }),
    true,
  );
});

check("A2 multi-item: terminal returned + delivered → order settle", () => {
  const items = [
    { trackingStatus: "returned_to_seller", quantity: 1 },
    { trackingStatus: "delivered", quantity: 1 },
  ];
  const ok = items.every((item, index) =>
    isItemSettledForOrderDelivery(item, {
      unresolvedNoAnswerUnitIndexes: new Set(),
    }),
  );
  assert.strictEqual(ok, true);
});

// ── B) open no_answer blocks ────────────────────────────────────────
check("B1 open no_answer + deliver sibling → NOT settled", () => {
  const item = {
    quantity: 2,
    trackingStatus: "handed_to_courier",
    units: [
      { unitIndex: 0, trackingStatus: "returned_to_seller", trackingHistory: [] },
      { unitIndex: 1, trackingStatus: "handed_to_courier", trackingHistory: [] },
    ],
  };
  assert.strictEqual(
    areAllItemUnitsSettledForDelivery(item, new Set([1]), {
      unresolvedNoAnswerUnitIndexes: new Set([0]),
    }),
    false,
  );
});

check("B2 multi-item open no_answer blocks order", () => {
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

// ── C) deliver then return ──────────────────────────────────────────
check("C1 deliver then return → item delivered via recompute", () => {
  const item = {
    quantity: 2,
    trackingStatus: "handed_to_courier",
    trackingHistory: [],
    units: [
      { unitIndex: 0, trackingStatus: "delivered", trackingHistory: [] },
      { unitIndex: 1, trackingStatus: "handed_to_courier", trackingHistory: [] },
    ],
  };
  const result = applyMarkReturned(item, 1, {
    0: "delivered",
    1: "returned",
  });
  assert.strictEqual(result.allSatisfied, true);
  assert.strictEqual(item.trackingStatus, "delivered");
  assert.strictEqual(
    isItemSettledForOrderDelivery(item, {
      unresolvedNoAnswerUnitIndexes: new Set(),
    }),
    true,
  );
});

// ── D) default safety without options ───────────────────────────────
check("D1 returned_to_seller without options still blocks order settle", () => {
  assert.strictEqual(
    isItemSettledForOrderDelivery({ trackingStatus: "returned_to_seller" }),
    false,
  );
});

// ── E) regressiya ───────────────────────────────────────────────────
check("E1 reHandoff still opens unit for pool", () => {
  const item = {
    quantity: 1,
    trackingStatus: "returned_to_seller",
    units: [
      { unitIndex: 0, trackingStatus: "returned_to_seller", trackingHistory: [] },
    ],
  };
  applyReHandoffTracking(item, 0);
  assert.deepStrictEqual(expandCourierPoolUnits(item), [0]);
});

check("E2 unavailable + pipeline + cargo open only unit1", () => {
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
  assert.deepStrictEqual(listOpenUnitIndexesForCargo(item), [1]);
});

check("E3 qty=1 return → returned_to_seller item settles with empty unresolved", () => {
  const item = {
    quantity: 1,
    trackingStatus: "handed_to_courier",
    units: [
      { unitIndex: 0, trackingStatus: "handed_to_courier", trackingHistory: [] },
    ],
  };
  applyMarkReturned(item, 0, { 0: "returned" });
  assert.strictEqual(item.trackingStatus, "returned_to_seller");
  assert.strictEqual(
    isItemSettledForOrderDelivery(item, {
      unresolvedNoAnswerUnitIndexes: new Set(),
    }),
    true,
  );
});

console.log("\nPassed", passed, "checks");
if (!process.exitCode) console.log("Verification PASSED");
