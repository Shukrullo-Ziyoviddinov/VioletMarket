/**
 * Buyurtmalarim guruhlash: seller bloki orderId:sellerId; xorij lane alohida kartochka.
 * Fee faqat bearer; har mahsulot o‘z kg/comment.
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
  weightKg = 0,
  comment = "",
  photo = "",
  stepsCompleted = 0,
}) {
  const steps = [
    { status: "accepted", state: stepsCompleted > 0 ? "completed" : "current" },
    {
      status: "seller_confirmed",
      state:
        stepsCompleted > 1
          ? "completed"
          : stepsCompleted === 1
            ? "current"
            : "upcoming",
    },
    {
      status: "collected",
      state:
        stepsCompleted > 2
          ? "completed"
          : stepsCompleted === 2
            ? "current"
            : "upcoming",
    },
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
    cargoShipmentId: `ship-${orderId}-${itemIndex}`,
    cargoFeePayment: feeRequired
      ? {
          ready,
          paymentRequired: true,
          weightKg,
          cargoDeliveryFee: fee,
          canCustomerPay: ready,
          uzArrivalComment: comment,
          uzArrivalPhotoUrl: photo,
        }
      : {
          ready: false,
          paymentRequired: false,
          weightKg,
          cargoDeliveryFee: 0,
          canCustomerPay: false,
          uzArrivalComment: comment,
          uzArrivalPhotoUrl: photo,
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

check("bir seller guruhi (bir lane) → bitta kartochka (2 mahsulot)", () => {
  const grouped = groupInProgressTrackingItems([
    item({
      orderId: 1,
      itemIndex: 0,
      sellerId: "s1",
      feeRequired: true,
      ready: true,
      fee: 100000,
      weightKg: 1.8,
      comment: "Guruh izoh",
      photo: "/img/a.jpg",
    }),
    item({
      orderId: 1,
      itemIndex: 1,
      sellerId: "s1",
      feeRequired: false,
      weightKg: 1.2,
    }),
  ]);
  assert.strictEqual(grouped.length, 1);
  assert.strictEqual(grouped[0].isGroup, true);
  assert.strictEqual(grouped[0].products.length, 2);
  assert.strictEqual(grouped[0].lineTotal, 2000);
  assert.strictEqual(grouped[0].cargoShipmentId, "ship-1-0");
  assert.strictEqual(grouped[0].cargoFeePayment.cargoDeliveryFee, 100000);
  assert.strictEqual(grouped[0].cargoFeePayment.ready, true);
});

check("har mahsulot o‘z kg; umumiy = yig‘indi; fee bitta", () => {
  const grouped = groupInProgressTrackingItems([
    item({
      orderId: 1,
      itemIndex: 0,
      sellerId: "s1",
      feeRequired: true,
      ready: true,
      fee: 100000,
      weightKg: 1.8,
      comment: "Bearer izoh",
      photo: "/img/bearer.jpg",
    }),
    item({
      orderId: 1,
      itemIndex: 1,
      sellerId: "s1",
      feeRequired: false,
      weightKg: 1.2,
      comment: "",
      photo: "",
    }),
  ]);
  const card = grouped[0];
  assert.strictEqual(card.products[0].weightKg, 1.8);
  assert.strictEqual(card.products[1].weightKg, 1.2);
  assert.strictEqual(card.cargoFeePayment.weightKg, 3);
  assert.strictEqual(card.cargoFeePayment.cargoDeliveryFee, 100000);
  assert.strictEqual(card.cargoFeePayment.uzArrivalComment, "Bearer izoh");
  assert.strictEqual(card.cargoFeePayment.uzArrivalPhotoUrl, "/img/bearer.jpg");
  // Siblingga bearer comment ko‘chirilmagan
  assert.strictEqual(card.products[1].uzArrivalComment, "");
  assert.strictEqual(card.products[1].uzArrivalPhotoUrl, "");
  assert.strictEqual(card.products[0].uzArrivalComment, "Bearer izoh");
});

check("boshqa siller → alohida blok", () => {
  const grouped = groupInProgressTrackingItems([
    item({
      orderId: 1,
      itemIndex: 0,
      sellerId: "s1",
      feeRequired: true,
      ready: true,
      fee: 50000,
      weightKg: 1,
    }),
    item({
      orderId: 1,
      itemIndex: 1,
      sellerId: "s2",
      feeRequired: true,
      ready: true,
      fee: 70000,
      weightKg: 2,
    }),
  ]);
  assert.strictEqual(grouped.length, 2);
  assert.ok(grouped.every((row) => row.products.length === 1));
});

check("keyingi checkout (boshqa orderId) → alohida", () => {
  const grouped = groupInProgressTrackingItems([
    item({
      orderId: 1,
      itemIndex: 0,
      sellerId: "s1",
      feeRequired: true,
      fee: 10000,
      weightKg: 1,
    }),
    item({
      orderId: 2,
      itemIndex: 0,
      sellerId: "s1",
      feeRequired: true,
      fee: 20000,
      weightKg: 1,
    }),
  ]);
  assert.strictEqual(grouped.length, 2);
  assert.strictEqual(grouped[0].orderId + grouped[1].orderId, 3);
});

check("fee faqat paymentRequired bearer dan", () => {
  const grouped = groupInProgressTrackingItems([
    item({ orderId: 5, itemIndex: 0, sellerId: "s1", feeRequired: false, weightKg: 0.5 }),
    item({
      orderId: 5,
      itemIndex: 1,
      sellerId: "s1",
      feeRequired: true,
      ready: true,
      fee: 99999,
      weightKg: 2.5,
    }),
  ]);
  assert.strictEqual(grouped[0].cargoFeePayment.cargoDeliveryFee, 99999);
  assert.strictEqual(grouped[0].cargoShipmentId, "ship-5-1");
  assert.strictEqual(grouped[0].cargoFeePayment.weightKg, 3);
});

check("foreign standard + express → 2 kartochka", () => {
  const base = item({ orderId: 8, itemIndex: 0, sellerId: "s1" });
  const grouped = groupInProgressTrackingItems([
    {
      ...base,
      id: "8-0",
      itemIndex: 0,
      cargoServiceType: "standard",
      groupKey: "8:s1:standard",
    },
    {
      ...item({ orderId: 8, itemIndex: 1, sellerId: "s1" }),
      id: "8-1",
      itemIndex: 1,
      cargoServiceType: "express",
      groupKey: "8:s1:express",
    },
  ]);
  assert.strictEqual(grouped.length, 2);
  assert.ok(grouped.some((row) => row.cargoServiceType === "standard"));
  assert.ok(grouped.some((row) => row.cargoServiceType === "express"));
});

check("fulfillmentGroupKey barqaror", () => {
  assert.strictEqual(fulfillmentGroupKey(12, "abc"), "12:abc");
});

console.log("\nPassed", passed, "checks");
if (!process.exitCode) console.log("Verification PASSED");
