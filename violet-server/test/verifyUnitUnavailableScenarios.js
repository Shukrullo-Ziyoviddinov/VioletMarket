/**
 * Manual verification: unit unavailable scenarios (no DB).
 * Run: node test/verifyUnitUnavailableScenarios.js
 */
const assert = require("assert");
const h = require("../src/productManagement/orderItemUnitTracking");

function makeItem(qty, status = "accepted") {
  return {
    quantity: qty,
    price: 100000,
    lineTotal: 100000 * qty,
    trackingStatus: status,
    trackingHistory: [{ status, at: new Date() }],
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

check("A different products: itemA unavailable, itemB stays accepted", () => {
  const itemA = makeItem(1);
  const itemB = makeItem(1);
  h.ensureItemUnits(itemA);
  h.ensureItemUnits(itemB);

  assert.deepStrictEqual(h.resolveTargetUnitIndexes(itemA, [0]), [0]);

  const unitA = h.getItemUnit(itemA, 0);
  unitA.trackingStatus = "unavailable";
  unitA.trackingHistory.push({ status: "unavailable", at: new Date() });
  h.recomputeItemTrackingStatusFromUnits(itemA);

  assert.strictEqual(itemA.trackingStatus, "unavailable");
  assert.strictEqual(itemB.trackingStatus, "accepted");
  assert.strictEqual(h.resolveUnitTrackingStatus(itemB, 0), "accepted");
});

check("B same product qty2: only unit0 -> aggregate accepted", () => {
  const item = makeItem(2);
  h.ensureItemUnits(item);
  assert.strictEqual(item.units.length, 2);

  assert.deepStrictEqual(h.resolveTargetUnitIndexes(item, [0]), [0]);

  const unit = h.getItemUnit(item, 0);
  unit.trackingStatus = "unavailable";
  unit.trackingHistory.push({ status: "unavailable", at: new Date() });
  h.recomputeItemTrackingStatusFromUnits(item);

  assert.strictEqual(h.resolveUnitTrackingStatus(item, 0), "unavailable");
  assert.strictEqual(h.resolveUnitTrackingStatus(item, 1), "accepted");
  assert.strictEqual(item.trackingStatus, "accepted");
});

check("C same product qty2: both units -> aggregate unavailable", () => {
  const item = makeItem(2);
  const targets = h.resolveTargetUnitIndexes(item, [0, 1]);
  assert.deepStrictEqual(targets, [0, 1]);
  h.ensureItemUnits(item);
  for (const unitIndex of targets) {
    const unit = h.getItemUnit(item, unitIndex);
    unit.trackingStatus = "unavailable";
    unit.trackingHistory.push({ status: "unavailable", at: new Date() });
  }
  h.recomputeItemTrackingStatusFromUnits(item);
  assert.strictEqual(item.trackingStatus, "unavailable");
});

check("D legacy: no unitIndexes = all units", () => {
  const item = makeItem(2);
  assert.deepStrictEqual(h.resolveTargetUnitIndexes(item, undefined), [0, 1]);
  assert.deepStrictEqual(h.resolveTargetUnitIndexes(item, null), [0, 1]);
});

check("E invalid unitIndexes filtered", () => {
  const item = makeItem(2);
  assert.deepStrictEqual(h.resolveTargetUnitIndexes(item, [5, -1]), []);
  assert.deepStrictEqual(h.normalizeUnitIndexes([0, 0, 1], 2), [0, 1]);
});

check("F UI groups units by itemIndex for API", () => {
  const selected = [
    { itemIndex: 0, unitIndex: 0 },
    { itemIndex: 0, unitIndex: 1 },
    { itemIndex: 2, unitIndex: 0 },
  ];
  const byItemIndex = new Map();
  for (const unit of selected) {
    if (!byItemIndex.has(unit.itemIndex)) byItemIndex.set(unit.itemIndex, []);
    byItemIndex.get(unit.itemIndex).push(unit.unitIndex);
  }
  assert.deepStrictEqual([...byItemIndex.get(0)], [0, 1]);
  assert.deepStrictEqual([...byItemIndex.get(2)], [0]);
  assert.strictEqual(byItemIndex.size, 2);
});

check("G legacy cards without units[] use item status", () => {
  const item = {
    quantity: 2,
    trackingStatus: "seller_confirmed",
    trackingHistory: [],
  };
  assert.strictEqual(h.resolveUnitTrackingStatus(item, 0), "seller_confirmed");
  assert.strictEqual(h.resolveUnitTrackingStatus(item, 1), "seller_confirmed");
});

check("H refund amount is per-unit price not lineTotal", () => {
  const item = makeItem(2);
  const unitPrice = Math.max(0, Number(item.price) || 0);
  const lineTotal = Math.max(0, Number(item.lineTotal) || 0);
  const amount = Math.max(
    0,
    unitPrice || (item.quantity > 0 ? Math.round(lineTotal / item.quantity) : 0),
  );
  assert.strictEqual(amount, 100000);
  assert.notStrictEqual(amount, item.lineTotal);
});

check("I selecting only unit1 of qty2", () => {
  const item = makeItem(2);
  h.ensureItemUnits(item);
  const unit = h.getItemUnit(item, 1);
  unit.trackingStatus = "unavailable";
  unit.trackingHistory.push({ status: "unavailable", at: new Date() });
  h.recomputeItemTrackingStatusFromUnits(item);
  assert.strictEqual(h.resolveUnitTrackingStatus(item, 0), "accepted");
  assert.strictEqual(h.resolveUnitTrackingStatus(item, 1), "unavailable");
  assert.strictEqual(item.trackingStatus, "accepted");
});

console.log("\nPassed", passed, "checks");
if (process.exitCode) {
  console.error("Verification FAILED");
} else {
  console.log("Verification PASSED");
}
