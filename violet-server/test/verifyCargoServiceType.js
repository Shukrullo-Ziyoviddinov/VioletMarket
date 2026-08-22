/**
 * cargoServiceType resolve + grouping.
 * Run: node test/verifyCargoServiceType.js
 */
const assert = require("assert");
const {
  CARGO_SERVICE_TYPE,
  resolveCartCargoCountryKey,
  resolveCheckoutCargoServiceType,
  resolvePersistedCartCargoServiceType,
  buildCargoLaneGroupKey,
  buildCustomerTrackingGroupKey,
  buildDeliveryLastMileGroupKey,
  buildSellerFulfillmentGroupKey,
  resolveStoredCargoServiceType,
  resolveTrackingCargoServiceType,
  countCargoLanes,
  applyCargoLaneMongoFilter,
  resolveCargoLaneUnitCount,
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

check("UZB siller + xorij countries[] ham null (local zanjir)", () => {
  assert.strictEqual(
    resolveCheckoutCargoServiceType({
      sellerCountry: "uzb",
      cargoExpressPolicy: "unrestricted",
      itemCountries: ["usa"],
      selectedCargoOptions: { usa: "express" },
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

check("savat storedType express — map bo‘lmasa ham express", () => {
  assert.strictEqual(
    resolveCheckoutCargoServiceType({
      sellerCountry: "china",
      cargoExpressPolicy: "unrestricted",
      storedType: "express",
      requireSelection: true,
    }),
    CARGO_SERVICE_TYPE.EXPRESS,
  );
});

check("tanlov yo‘q + requireSelection → xato", () => {
  assert.throws(
    () =>
      resolveCheckoutCargoServiceType({
        sellerCountry: "china",
        cargoExpressPolicy: "unrestricted",
        requireSelection: true,
      }),
    (err) => err && err.code === "CARGO_SERVICE_REQUIRED",
  );
});

check("tanlov yo‘q + savatga yozish → standard", () => {
  assert.strictEqual(
    resolveCheckoutCargoServiceType({
      sellerCountry: "china",
      cargoExpressPolicy: "unrestricted",
    }),
    CARGO_SERVICE_TYPE.STANDARD,
  );
});

check("GET/stamp: tanlov yo‘q → null (Standard yozilmaydi)", () => {
  assert.strictEqual(
    resolvePersistedCartCargoServiceType({
      sellerCountry: "china",
      cargoExpressPolicy: "unrestricted",
    }),
    null,
  );
});

check("GET/stamp: user map express saqlanadi", () => {
  assert.strictEqual(
    resolvePersistedCartCargoServiceType({
      sellerCountry: "china",
      cargoExpressPolicy: "unrestricted",
      selectedCargoOptions: { china: "express" },
    }),
    CARGO_SERVICE_TYPE.EXPRESS,
  );
});

check("GET/stamp: item storedType express, map bo‘sh", () => {
  assert.strictEqual(
    resolvePersistedCartCargoServiceType({
      sellerCountry: "china",
      cargoExpressPolicy: "unrestricted",
      storedType: "express",
    }),
    CARGO_SERVICE_TYPE.EXPRESS,
  );
});

check("countries[] savat kalitidan oldin sellerCountry ishlatilmaydi", () => {
  assert.strictEqual(
    resolveCartCargoCountryKey({
      sellerCountry: "china",
      itemCountries: ["usa"],
    }),
    "usa",
  );
  assert.strictEqual(
    resolveCheckoutCargoServiceType({
      sellerCountry: "china",
      cargoExpressPolicy: "unrestricted",
      itemCountries: ["usa"],
      selectedCargoOptions: { usa: "express", china: "standard" },
    }),
    CARGO_SERVICE_TYPE.EXPRESS,
  );
});

check("countries[] bo‘sh bo‘lsa sellerCountry fallback", () => {
  assert.strictEqual(
    resolveCartCargoCountryKey({
      sellerCountry: "china",
      itemCountries: [],
    }),
    "china",
  );
  assert.strictEqual(
    resolveCheckoutCargoServiceType({
      sellerCountry: "china",
      cargoExpressPolicy: "unrestricted",
      itemCountries: [],
      selectedCargoOptions: { china: "express" },
    }),
    CARGO_SERVICE_TYPE.EXPRESS,
  );
});

check("faqat uzb countries[] → null (siller china bo‘lsa ham)", () => {
  assert.strictEqual(
    resolveCheckoutCargoServiceType({
      sellerCountry: "china",
      cargoExpressPolicy: "unrestricted",
      itemCountries: ["uzb"],
      selectedCargoOptions: { china: "express" },
    }),
    null,
  );
});

check("uzb + xorij countries[] → xorij savat tanlovi", () => {
  assert.strictEqual(
    resolveCheckoutCargoServiceType({
      sellerCountry: "china",
      cargoExpressPolicy: "unrestricted",
      itemCountries: ["uzb", "usa"],
      selectedCargoOptions: { usa: "express", china: "standard" },
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

check("mijoz tracking: eski yozuv = Standard, UZB lane yo‘q", () => {
  assert.strictEqual(resolveTrackingCargoServiceType("foreign", null), "standard");
  assert.strictEqual(resolveTrackingCargoServiceType("foreign", ""), "standard");
  assert.strictEqual(
    resolveTrackingCargoServiceType("foreign", "standard"),
    "standard",
  );
  assert.strictEqual(resolveTrackingCargoServiceType("foreign", "express"), "express");
  assert.strictEqual(resolveTrackingCargoServiceType("local", null), null);
  assert.strictEqual(resolveTrackingCargoServiceType("local", "express"), null);
  assert.strictEqual(
    buildCustomerTrackingGroupKey(10, "s1", "foreign", null),
    "10:s1:standard",
  );
  assert.strictEqual(
    buildCustomerTrackingGroupKey(10, "s1", "foreign", "standard"),
    "10:s1:standard",
  );
  assert.strictEqual(
    buildCustomerTrackingGroupKey(10, "s1", "local", null),
    "10:s1",
  );
});

check("resolveShipmentListGroupKey: default qabul, split Yuklarim", () => {
  const row = { orderId: 10, sellerId: "s1", cargoServiceType: "express" };
  assert.strictEqual(
    require("@volet/cargo-service-rules").resolveShipmentListGroupKey(row),
    "10:s1",
  );
  assert.strictEqual(
    require("@volet/cargo-service-rules").resolveShipmentListGroupKey(row, {
      splitByCargoService: true,
    }),
    "10:s1:express",
  );
});

check("shared legacy: yo‘q maydon → standard", () => {
  assert.strictEqual(
    require("@volet/cargo-service-rules").resolveStoredCargoServiceType(null),
    CARGO_SERVICE_TYPE.STANDARD,
  );
});

check("shared standard_only policy", () => {
  const rules = require("@volet/cargo-service-rules");
  assert.strictEqual(
    rules.isStandardOnlyCargoPolicy(rules.CARGO_EXPRESS_POLICY.STANDARD_ONLY),
    true,
  );
  assert.strictEqual(rules.isStandardOnlyCargoPolicy(null), false);
});

check("delivery last-mile: xorij lane, UZB orderId", () => {
  assert.strictEqual(
    buildDeliveryLastMileGroupKey(10, "s1", "express"),
    "10:s1:express",
  );
  assert.strictEqual(
    buildDeliveryLastMileGroupKey(10, "s1", "standard"),
    "10:s1:standard",
  );
  assert.strictEqual(buildDeliveryLastMileGroupKey(10, "s1", null), "order-10");
});

check("tarix snapshot: cargoServiceType API", () => {
  const {
    toPublicHistoryItem,
  } = require("../src/services/cargoShipments/cargoLogisticaHistoryService");
  const item = toPublicHistoryItem({
    _id: "h1",
    kind: "handed_over",
    shipmentId: "s1",
    requestCode: "REQ-001",
    cargoServiceType: "express",
    amount: 1000,
    at: new Date(),
  });
  assert.strictEqual(item.cargoServiceType, "express");
});

check("lane filter base $or ni saqlaydi — spread qilmang", () => {
  const base = {
    orderId: 1,
    sellerId: "s1",
    $or: [{ status: "pending" }, { logisticaId: "L1" }],
  };
  const merged = applyCargoLaneMongoFilter(base, { cargoServiceType: "standard" });
  assert.ok(Array.isArray(merged.$and));
  assert.strictEqual(merged.$and.length, 2);
  assert.deepStrictEqual(merged.$and[0].$or, base.$or);
  assert.ok(merged.$and[1].$or.some((row) => row.cargoServiceType === "standard"));

  const spread = {
    ...base,
    ...applyCargoLaneMongoFilter({}, { cargoServiceType: "standard" }),
  };
  assert.ok(!JSON.stringify(spread.$or || []).includes("pending"));
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

check("countCargoLanes productCount 0 → kamida 1", () => {
  assert.strictEqual(resolveCargoLaneUnitCount({ productCount: 0 }), 1);
  assert.deepStrictEqual(
    countCargoLanes([
      { cargoServiceType: "express", productCount: 0 },
      { cargoServiceType: "standard" },
    ]),
    { standard: 1, express: 1 },
  );
});

check("countCargoLanes products.length / quantity", () => {
  assert.strictEqual(
    resolveCargoLaneUnitCount({
      productCount: 0,
      products: [{ quantity: 2 }, { quantity: 1 }],
    }),
    3,
  );
  assert.deepStrictEqual(
    countCargoLanes([
      {
        cargoServiceType: "express",
        productCount: 0,
        products: [{}, {}],
      },
    ]),
    { standard: 0, express: 2 },
  );
});

console.log("\nPassed", passed, "checks");
if (!process.exitCode) console.log("Verification PASSED");
