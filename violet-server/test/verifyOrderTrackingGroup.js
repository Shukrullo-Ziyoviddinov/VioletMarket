/**
 * Buyurtmalarim: orderId+sellerId → bitta blok; fee faqat bearer.
 * Run: node test/verifyOrderTrackingGroup.js
 */
const assert = require("assert");
const {
  groupInProgressTrackingItems,
  fulfillmentGroupKey,
} = require("../src/services/userOrderTracking/userOrderTrackingService");

function item({
  orderId,
  itemIndex,
  sellerId,
  feeRequired = false,
  ready = false,
  fee = 0,
  stepsCompleted = 0,
}) {
  const steps = [
    { status: "accepted", state: stepsCompleted > 0 ? "completed" : "current" },
    { status: "seller_confirmed", state: stepsCompleted > 1 ? "completed" : stepsCompleted === 1 ? "current" : "upcoming" },
    { status: "collected", state: stepsCompleted > 2 ? "completed" : stepsCompleted === 2 ? "current" : "upcoming" },
  ];
  return {
    id: `${orderId}-${itemIndex}`,
    itemIndex,
    orderId,
    orderCode: `#${String(orderId).padStart(4, "0")}`,
    groupKey: fulfillmentGroupKey(orderId, sellerId),
    productId: 10 + itemIndex,
    title: { uz: `Mahsulot ${itemIndex}`, ru: `Товар ${itemIndex}` },
    imageUrl: "/img/x.png",
    price: 1000,
    originalPrice: 1000,
    quantity: 1,
    lineTotal: 1000,
    color: "",
    size: "",
    storage: "",
    model: "",
    seller: { id: sellerId, name: { uz: "Siller", ru: "Siller" }, country: "china" },
    pipelineMode: "foreign",
    paymentMethod: "payme",
    orderedAt: "2026-01-01T00:00:00.000Z",
    trackingStatus: "accepted",
    steps,
    cargoShipmentId: feeRequired ? `ship-${orderId}-${itemIndex}` : `ship-${orderId}-${itemIndex}-x`,
    cargoFeePayment: feeRequired
      ? {
          ready,
          paymentRequired: true,
          weightKg: 3,
          cargoDeliveryFee: fee,
          canCustomerPay: ready,
        }
      : {
          ready: false,
          paymentRequired: false,
          weightKg: 0,
          cargoDeliveryFee: 0,
          canCustomerPay: false,
        },
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

check("bir checkout + bir siller → bitta kartochka (2 mahsulot)", () => {
  const grouped = groupInProgressTrackingItems([
    item({ orderId: 1, itemIndex: 0, sellerId: "s1", feeRequired: true, ready: true, fee: 100000 }),
    item({ orderId: 1, itemIndex: 1, sellerId: "s1", feeRequired: false }),
  ]);
  assert.strictEqual(grouped.length, 1);
  assert.strictEqual(grouped[0].isGroup, true);
  assert.strictEqual(grouped[0].products.length, 2);
  assert.strictEqual(grouped[0].lineTotal, 2000);
  assert.strictEqual(grouped[0].cargoShipmentId, "ship-1-0");
  assert.strictEqual(grouped[0].cargoFeePayment.cargoDeliveryFee, 100000);
  assert.strictEqual(grouped[0].cargoFeePayment.ready, true);
});

check("boshqa siller → alohida blok", () => {
  const grouped = groupInProgressTrackingItems([
    item({ orderId: 1, itemIndex: 0, sellerId: "s1", feeRequired: true, ready: true, fee: 50000 }),
    item({ orderId: 1, itemIndex: 1, sellerId: "s2", feeRequired: true, ready: true, fee: 70000 }),
  ]);
  assert.strictEqual(grouped.length, 2);
  assert.ok(grouped.every((row) => row.products.length === 1));
});

check("keyingi checkout (boshqa orderId) → alohida", () => {
  const grouped = groupInProgressTrackingItems([
    item({ orderId: 1, itemIndex: 0, sellerId: "s1", feeRequired: true, fee: 10000 }),
    item({ orderId: 2, itemIndex: 0, sellerId: "s1", feeRequired: true, fee: 20000 }),
  ]);
  assert.strictEqual(grouped.length, 2);
  assert.strictEqual(grouped[0].orderId + grouped[1].orderId, 3);
});

check("fee faqat paymentRequired bearer dan", () => {
  const grouped = groupInProgressTrackingItems([
    item({ orderId: 5, itemIndex: 0, sellerId: "s1", feeRequired: false }),
    item({
      orderId: 5,
      itemIndex: 1,
      sellerId: "s1",
      feeRequired: true,
      ready: true,
      fee: 99999,
    }),
  ]);
  assert.strictEqual(grouped[0].cargoFeePayment.cargoDeliveryFee, 99999);
  assert.strictEqual(grouped[0].cargoShipmentId, "ship-5-1");
});

check("fulfillmentGroupKey barqaror", () => {
  assert.strictEqual(fulfillmentGroupKey(12, "abc"), "12:abc");
});

console.log("\nPassed", passed, "checks");
if (!process.exitCode) console.log("Verification PASSED");
