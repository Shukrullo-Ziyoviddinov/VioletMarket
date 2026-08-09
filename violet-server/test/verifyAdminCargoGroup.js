/**
 * Asosiy admin Logistica: orderId+sellerId → bitta kartochka.
 * Run: node test/verifyAdminCargoGroup.js
 */
const assert = require("assert");
const {
  groupLogisticaShipmentCards,
} = require("../src/services/cargoShipments/cargoShipmentLogisticaService");
const {
  buildFulfillmentGroupKey,
  enrichAdminGroupedCards,
} = require("../src/services/adminCargoShipments/adminCargoShipmentsService");

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

check("buildFulfillmentGroupKey orderId:sellerId", () => {
  assert.strictEqual(buildFulfillmentGroupKey(10, "sellerA"), "10:sellerA");
  assert.strictEqual(buildFulfillmentGroupKey(0, "sellerA"), "");
});

check("bir vaqt (bir order) + bir siller → 1 kartochka", () => {
  const cards = [
    {
      id: "a",
      orderId: 100,
      sellerId: "s1",
      groupKey: "100:s1",
      requestCode: "R1",
      productTitle: "Telefon",
      productCount: 1,
      weightKg: 0.4,
      cargoDeliveryFee: 50000,
      cargoFeePaymentRequired: true,
      acceptedAt: "2026-06-01T10:00:00.000Z",
    },
    {
      id: "b",
      orderId: 100,
      sellerId: "s1",
      groupKey: "100:s1",
      requestCode: "R2",
      productTitle: "Quloqchin",
      productCount: 1,
      weightKg: 0.2,
      cargoDeliveryFee: 0,
      cargoFeePaymentRequired: false,
      acceptedAt: "2026-06-01T10:00:00.000Z",
    },
  ];
  const byId = new Map(cards.map((c) => [c.id, c]));
  const grouped = enrichAdminGroupedCards(
    groupLogisticaShipmentCards(cards),
    byId,
  );
  assert.strictEqual(grouped.length, 1);
  assert.strictEqual(grouped[0].isGroup, true);
  assert.strictEqual(grouped[0].id, "a");
  assert.strictEqual(grouped[0].productCount, 2);
  assert.ok(String(grouped[0].requestCode).includes("R1"));
  assert.ok(String(grouped[0].productTitle).includes("Telefon"));
});

check("boshqa siller → alohida kartochka", () => {
  const cards = [
    {
      id: "a",
      orderId: 100,
      sellerId: "s1",
      groupKey: "100:s1",
      productCount: 1,
      weightKg: 1,
      acceptedAt: "2026-06-01T10:00:00.000Z",
    },
    {
      id: "b",
      orderId: 100,
      sellerId: "s2",
      groupKey: "100:s2",
      productCount: 1,
      weightKg: 1,
      acceptedAt: "2026-06-01T10:00:00.000Z",
    },
  ];
  const grouped = groupLogisticaShipmentCards(cards);
  assert.strictEqual(grouped.length, 2);
});

check("boshqa order (boshqa vaqt/checkout) → alohida", () => {
  const cards = [
    {
      id: "a",
      orderId: 100,
      sellerId: "s1",
      groupKey: "100:s1",
      productCount: 1,
      weightKg: 1,
      acceptedAt: "2026-06-01T10:00:00.000Z",
    },
    {
      id: "b",
      orderId: 101,
      sellerId: "s1",
      groupKey: "101:s1",
      productCount: 1,
      weightKg: 1,
      acceptedAt: "2026-06-02T10:00:00.000Z",
    },
  ];
  const grouped = groupLogisticaShipmentCards(cards);
  assert.strictEqual(grouped.length, 2);
});

console.log("\nPassed", passed, "checks");
if (!process.exitCode) console.log("Verification PASSED");
