/**
 * Guruh Sotuvchiga qaytarish: default — barcha siblinglar.
 * Run: node test/verifyCargoGroupReturn.js
 */
const assert = require("assert");
const mongoose = require("mongoose");
const {
  normalizeReturnSelections,
  normalizeSelectedShipmentIds,
} = require("../src/services/cargoShipments/cargoShipmentLogisticaService");

const primaryId = new mongoose.Types.ObjectId().toString();
const siblingA = new mongoose.Types.ObjectId().toString();
const siblingB = new mongoose.Types.ObjectId().toString();

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

check("tanlov yo‘q + allowedIds → butun guruh", () => {
  const allowed = new Set([primaryId, siblingA, siblingB]);
  const ids = normalizeSelectedShipmentIds(primaryId, {}, allowed);
  assert.strictEqual(ids.length, 3);
  assert.ok(ids.includes(primaryId));
  assert.ok(ids.includes(siblingA));
  assert.ok(ids.includes(siblingB));
});

check("tanlov yo‘q + allowedIds yo‘q → faqat primary", () => {
  const ids = normalizeSelectedShipmentIds(primaryId, {});
  assert.deepStrictEqual(ids, [primaryId]);
});

check("normalizeReturnSelections: default guruh", () => {
  const allowed = new Set([primaryId, siblingA]);
  const rows = normalizeReturnSelections(primaryId, {}, allowed);
  assert.strictEqual(rows.length, 2);
  assert.ok(rows.every((row) => row.unitIndex == null));
  assert.ok(rows.some((row) => row.shipmentId === siblingA));
});

check("explicit selections saqlanadi", () => {
  const rows = normalizeReturnSelections(
    primaryId,
    {
      selections: [{ shipmentId: siblingA, unitIndex: 1 }],
    },
    new Set([primaryId, siblingA]),
  );
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0].shipmentId, siblingA);
  assert.strictEqual(rows[0].unitIndex, 1);
});

check("shipmentIds berilsa — shu set", () => {
  const rows = normalizeReturnSelections(
    primaryId,
    { shipmentIds: [siblingB] },
    new Set([primaryId, siblingA, siblingB]),
  );
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0].shipmentId, siblingB);
});

console.log("\nPassed", passed, "checks");
if (!process.exitCode) console.log("Verification PASSED");
