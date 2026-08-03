/**
 * Cargo unit-return helpers (no DB).
 * Run: node test/verifyCargoUnitReturn.js
 */
const assert = require("assert");
const h = require("../src/services/cargoShipments/cargoShipmentUnitReturn");

function makeShipment(qty = 2) {
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

check("unit amount uses price not lineTotal", () => {
  const amount = h.resolveCargoUnitAmount(
    { price: 50000, lineTotal: 100000, quantity: 2 },
    2,
  );
  assert.strictEqual(amount, 50000);
});

check("partial return keeps shipment accepted", () => {
  const shipment = makeShipment(2);
  h.setProductReturnStatus(shipment, 0, "return_request_pending");
  h.recomputeShipmentStatusFromProducts(shipment);
  assert.strictEqual(shipment.status, "accepted");
  assert.strictEqual(h.listActiveProductUnitIndexes(shipment).length, 1);
});

check("all units pending -> return_request_pending", () => {
  const shipment = makeShipment(2);
  h.setProductReturnStatus(shipment, 0, "return_request_pending");
  h.setProductReturnStatus(shipment, 1, "return_request_pending");
  h.recomputeShipmentStatusFromProducts(shipment);
  assert.strictEqual(shipment.status, "return_request_pending");
});

check("all returned -> returned_to_seller", () => {
  const shipment = makeShipment(2);
  h.setProductReturnStatus(shipment, 0, "returned");
  h.setProductReturnStatus(shipment, 1, "returned");
  h.recomputeShipmentStatusFromProducts(shipment);
  assert.strictEqual(shipment.status, "returned_to_seller");
});

check("normalize defaults to first active unit", () => {
  const shipment = makeShipment(2);
  h.setProductReturnStatus(shipment, 0, "returned");
  assert.deepStrictEqual(h.normalizeCargoUnitIndexes(null, shipment), [1]);
});

console.log("\nPassed", passed, "checks");
if (!process.exitCode) console.log("Verification PASSED");
