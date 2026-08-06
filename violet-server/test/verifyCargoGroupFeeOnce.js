/**
 * Guruh Clientga yuborish: fee bir marta; sibling advance-only; To‘landi fan-out.
 * Run: node test/verifyCargoGroupFeeOnce.js
 */
const assert = require("assert");
const {
  canLogisticaMarkPaid,
  isCargoFeeBearer,
  isGroupNonFeeWarehouseSibling,
  isCargoFeeRequestReady,
} = require("../src/productManagement/foreign/foreignCargoFeePayment");
const {
  resolveOptionalItemWeightKg,
} = require("../src/services/cargoShipments/cargoShipmentProcessActions");

/** Mirrors applyUzWarehouseArrival attachFee true/false (no DB). */
function simulateArrive(shipment, payload, { attachFee }) {
  const row = { ...shipment };
  if (attachFee) {
    const itemWeight = resolveOptionalItemWeightKg(payload, row._id);
    row.weightKg =
      itemWeight != null ? itemWeight : Number(payload.weightKg);
    row.cargoDeliveryFee = Math.round(Number(payload.cargoDeliveryFee));
    row.uzArrivalComment = String(payload.comment || "");
    row.uzArrivedAt = new Date();
    row.processStep = "toshkent_omborida";
    row.cargoFeePaymentRequired = true;
    row.status = "accepted";
    return row;
  }
  const itemWeight = resolveOptionalItemWeightKg(payload, row._id);
  if (itemWeight != null) {
    row.weightKg = itemWeight;
  }
  row.cargoDeliveryFee = 0;
  row.cargoFeePaymentRequired = false;
  row.uzArrivedAt = new Date();
  row.processStep = "toshkent_omborida";
  row.status = "accepted";
  return row;
}

/** Mirrors fan-out: non-bearer siblings get paidAt, no fee. */
function simulateFanOut(bearer, siblings) {
  if (!bearer.paidAt || !isCargoFeeBearer(bearer)) return siblings;
  return siblings.map((row) => {
    if (row.paidAt) return row;
    if (String(row.processStep) !== "toshkent_omborida") return row;
    if (isCargoFeeBearer(row)) return row;
    return { ...row, paidAt: bearer.paidAt };
  });
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

check("fee faqat primaryda; sibling advance-only", () => {
  const payload = {
    weightKg: 3,
    cargoDeliveryFee: 100000,
    comment: "guruh",
  };
  const primary = simulateArrive(
    { _id: "a", status: "accepted", processStep: "bojxonada" },
    payload,
    { attachFee: true },
  );
  const sibling = simulateArrive(
    { _id: "b", status: "accepted", processStep: "bojxonada" },
    payload,
    { attachFee: false },
  );

  assert.strictEqual(primary.cargoDeliveryFee, 100000);
  assert.strictEqual(primary.cargoFeePaymentRequired, true);
  assert.strictEqual(isCargoFeeBearer(primary), true);
  assert.strictEqual(isCargoFeeRequestReady(primary), true);

  assert.strictEqual(sibling.cargoDeliveryFee, 0);
  assert.strictEqual(sibling.cargoFeePaymentRequired, false);
  assert.strictEqual(isCargoFeeBearer(sibling), false);
  assert.strictEqual(isCargoFeeRequestReady(sibling), false);
  assert.strictEqual(isGroupNonFeeWarehouseSibling(sibling), true);
});

check("siblingda canLogisticaMarkPaid = false", () => {
  const sibling = {
    status: "accepted",
    processStep: "toshkent_omborida",
    uzArrivedAt: new Date(),
    cargoDeliveryFee: 0,
    cargoFeePaymentRequired: false,
    paidAt: null,
  };
  assert.strictEqual(canLogisticaMarkPaid(sibling), false);
});

check("fee-bearer: admin tasdiqsiz To‘landi yo‘q; tasdiq bilan OK", () => {
  const bearer = {
    status: "accepted",
    processStep: "toshkent_omborida",
    uzArrivedAt: new Date(),
    cargoDeliveryFee: 100000,
    cargoFeePaymentRequired: true,
    adminCargoFeeConfirmedAt: null,
    paidAt: null,
  };
  assert.strictEqual(canLogisticaMarkPaid(bearer), false);
  bearer.adminCargoFeeConfirmedAt = new Date();
  assert.strictEqual(canLogisticaMarkPaid(bearer), true);
});

check("legacy required=false + fee>0 → To‘landi ochiq", () => {
  const legacy = {
    status: "accepted",
    processStep: "toshkent_omborida",
    uzArrivedAt: new Date(),
    cargoDeliveryFee: 50000,
    cargoFeePaymentRequired: false,
    paidAt: null,
  };
  assert.strictEqual(isGroupNonFeeWarehouseSibling(legacy), false);
  assert.strictEqual(canLogisticaMarkPaid(legacy), true);
});

check("fan-out: sibling paidAt oladi, fee qoladi 0", () => {
  const bearer = {
    _id: "a",
    cargoFeePaymentRequired: true,
    cargoDeliveryFee: 100000,
    paidAt: new Date("2026-01-01"),
  };
  const siblings = [
    {
      _id: "b",
      processStep: "toshkent_omborida",
      uzArrivedAt: new Date(),
      cargoFeePaymentRequired: false,
      cargoDeliveryFee: 0,
      paidAt: null,
    },
  ];
  const after = simulateFanOut(bearer, siblings);
  assert.ok(after[0].paidAt);
  assert.strictEqual(after[0].cargoDeliveryFee, 0);
  assert.strictEqual(Number(after[0].paidAt), Number(bearer.paidAt));
});

check("itemWeights: har mahsulot alohida kg; umumiy payload.weightKg", () => {
  const payload = {
    weightKg: 3,
    cargoDeliveryFee: 100000,
    itemWeights: [
      { shipmentId: "a", weightKg: 1.8 },
      { shipmentId: "b", weightKg: 1.2 },
    ],
  };
  const primary = simulateArrive(
    { _id: "a", status: "accepted", processStep: "bojxonada" },
    payload,
    { attachFee: true },
  );
  const sibling = simulateArrive(
    { _id: "b", status: "accepted", processStep: "bojxonada" },
    payload,
    { attachFee: false },
  );
  assert.strictEqual(primary.weightKg, 1.8);
  assert.strictEqual(primary.cargoDeliveryFee, 100000);
  assert.strictEqual(sibling.weightKg, 1.2);
  assert.strictEqual(sibling.cargoDeliveryFee, 0);
  assert.strictEqual(
    Math.round((primary.weightKg + sibling.weightKg) * 1000) / 1000,
    payload.weightKg,
  );
});

check("resolveOptionalItemWeightKg yo‘q id → null", () => {
  assert.strictEqual(
    resolveOptionalItemWeightKg({ itemWeights: [{ shipmentId: "x", weightKg: 1 }] }, "y"),
    null,
  );
});

const {
  groupLogisticaShipmentCards,
} = require("../src/services/cargoShipments/cargoShipmentLogisticaService");

check("list card primary = fee-bearer (eng yangi sibling emas)", () => {
  const grouped = groupLogisticaShipmentCards([
    {
      id: "new-sibling",
      orderId: 1,
      sellerId: "s1",
      groupKey: "1:s1",
      acceptedAt: "2026-06-02T00:00:00.000Z",
      productCount: 1,
      weightKg: 0,
      cargoFeePaymentRequired: false,
      requestCode: "B",
    },
    {
      id: "fee-bearer",
      orderId: 1,
      sellerId: "s1",
      groupKey: "1:s1",
      acceptedAt: "2026-06-01T00:00:00.000Z",
      productCount: 1,
      weightKg: 3,
      cargoFeePaymentRequired: true,
      requestCode: "A",
    },
  ]);
  assert.strictEqual(grouped.length, 1);
  assert.strictEqual(grouped[0].id, "fee-bearer");
  assert.strictEqual(grouped[0].cargoFeePaymentRequired, true);
  assert.strictEqual(grouped[0].isGroup, true);
  assert.deepStrictEqual(
    [...grouped[0].siblingIds].sort(),
    ["fee-bearer", "new-sibling"].sort(),
  );
});

console.log("\nPassed", passed, "checks");
if (!process.exitCode) console.log("Verification PASSED");
