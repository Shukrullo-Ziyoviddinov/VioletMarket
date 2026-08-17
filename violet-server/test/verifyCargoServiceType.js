/**
 * cargoServiceType resolve + grouping.
 * Run: node test/verifyCargoServiceType.js
 */
const assert = require("assert");
const {
  CARGO_SERVICE_TYPE,
  resolveCheckoutCargoServiceType,
  buildCargoLaneGroupKey,
  buildSellerFulfillmentGroupKey,
  resolveStoredCargoServiceType,
  countCargoLanes,
} = require("../src/utils/cargoServiceType");
const {
  groupLogisticaShipmentCards,
} = require("../src/services/cargoShipments/cargoShipmentLogisticaService");

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

check("UZB siller → cargoServiceType null", () => {
  assert.strictEqual(
    resolveCheckoutCargoServiceType({
      sellerCountry: "uzb",
      cargoExpressPolicy: "unrestricted",
      selectedCargoOptions: { china: "express" },
    }),
    null,
  );
});

check("standard_only → har doim standard", () => {
  assert.strictEqual(
    resolveCheckoutCargoServiceType({
      sellerCountry: "china",
      cargoExpressPolicy: "standard_only",
      selectedCargoOptions: { china: "express" },
    }),
    CARGO_SERVICE_TYPE.STANDARD,
  );
});

check("unrestricted + express tanlov → express", () => {
  assert.strictEqual(
    resolveCheckoutCargoServiceType({
      sellerCountry: "china",
      cargoExpressPolicy: "unrestricted",
      selectedCargoOptions: { china: "express" },
    }),
    CARGO_SERVICE_TYPE.EXPRESS,
  );
});

check("xitoy alias tanlov mos keladi", () => {
  assert.strictEqual(
    resolveCheckoutCargoServiceType({
      sellerCountry: "china",
      cargoExpressPolicy: null,
      selectedCargoOptions: { xitoy: "express" },
    }),
    CARGO_SERVICE_TYPE.EXPRESS,
  );
});

check("lane key seller keydan farq qiladi", () => {
  assert.strictEqual(buildSellerFulfillmentGroupKey(10, "s1"), "10:s1");
  assert.strictEqual(buildCargoLaneGroupKey(10, "s1", "express"), "10:s1:express");
  assert.strictEqual(buildCargoLaneGroupKey(10, "s1", null), "10:s1:standard");
  assert.strictEqual(resolveStoredCargoServiceType(null), "standard");
});

const mixedCards = [
  {
    id: "a",
    orderId: 100,
    sellerId: "s1",
    cargoServiceType: "standard",
    productCount: 2,
    weightKg: 1,
    requestCode: "R1",
    acceptedAt: "2026-06-01T10:00:00.000Z",
  },
  {
    id: "b",
    orderId: 100,
    sellerId: "s1",
    cargoServiceType: "express",
    productCount: 3,
    weightKg: 1,
    requestCode: "R2",
    cargoFeePaymentRequired: true,
    acceptedAt: "2026-06-01T10:00:00.000Z",
  },
];

check("qabul sahifasi: mixed tarif ham 1 kartochka", () => {
  const grouped = groupLogisticaShipmentCards(mixedCards);
  assert.strictEqual(grouped.length, 1);
  assert.strictEqual(grouped[0].productCount, 5);
  assert.strictEqual(grouped[0].cargoServiceType, null);
  assert.deepStrictEqual(grouped[0].cargoLaneCounts, {
    standard: 2,
    express: 3,
  });
});

check("qabuldan keyin: standard va express alohida", () => {
  const grouped = groupLogisticaShipmentCards(mixedCards, {
    splitByCargoService: true,
  });
  assert.strictEqual(grouped.length, 2);
  const byType = Object.fromEntries(
    grouped.map((row) => [row.cargoServiceType, row.productCount]),
  );
  assert.strictEqual(byType.standard, 2);
  assert.strictEqual(byType.express, 3);
});

check("countCargoLanes", () => {
  assert.deepStrictEqual(countCargoLanes(mixedCards), {
    standard: 2,
    express: 3,
  });
});

console.log("\nPassed", passed, "checks");
if (!process.exitCode) console.log("Verification PASSED");
