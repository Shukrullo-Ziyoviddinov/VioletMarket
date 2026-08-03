/**
 * Qayta aktiv oxirida order settle + Sotildi crash heal mantiq.
 * Run: node src/scripts/verifyReactivateAndSoldCrash.js
 */
const assert = require("assert");
const {
  isItemSettledForOrderDelivery,
} = require("../productManagement/orderItemUnitTracking");

/**
 * reactivateNoAnswerOrder oxiridagi settle qarori (DB siz).
 * Unit returned_to_seller qoladi; unresolved no_answer yopilgach settle OK.
 */
function shouldSettleAfterReactivate(order, unresolvedByItem) {
  if (String(order.status) === "delivered") return false;
  const items = Array.isArray(order.items) ? order.items : [];
  if (!items.length) return false;
  return items.every((item, itemIndex) =>
    isItemSettledForOrderDelivery(item, {
      unresolvedNoAnswerUnitIndexes: unresolvedByItem[itemIndex] || new Set(),
    }),
  );
}

/**
 * healNoAnswerResolvedIfUnitDelivered sharti.
 */
function shouldHealSoldCrash({ reasonType, resolvedAt, unitStatus }) {
  if (resolvedAt) return false;
  if (String(reasonType) !== "no_answer") return false;
  return String(unitStatus) === "delivered";
}

/**
 * Qayta aktiv / qayta kuryer — sotilgan crash holatida rad.
 */
function shouldRejectReactivateOrReHandoff({ reasonType, resolvedAt, unitStatus }) {
  return shouldHealSoldCrash({ reasonType, resolvedAt, unitStatus });
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

check("reactivate yopilgach: returned item + empty unresolved → settle", () => {
  const order = {
    status: "handed_to_courier",
    items: [{ trackingStatus: "returned_to_seller", quantity: 1 }],
  };
  assert.strictEqual(
    shouldSettleAfterReactivate(order, [new Set()]),
    true,
  );
});

check("reactivate oldin: ochiq no_answer → settle yo‘q", () => {
  const order = {
    status: "handed_to_courier",
    items: [{ trackingStatus: "returned_to_seller", quantity: 1 }],
  };
  assert.strictEqual(
    shouldSettleAfterReactivate(order, [new Set([0])]),
    false,
  );
});

check("reactivate: boshqa item ochiq → settle yo‘q", () => {
  const order = {
    status: "handed_to_courier",
    items: [
      { trackingStatus: "returned_to_seller", quantity: 1 },
      { trackingStatus: "handed_to_courier", quantity: 1 },
    ],
  };
  assert.strictEqual(
    shouldSettleAfterReactivate(order, [new Set(), new Set()]),
    false,
  );
});

check("reactivate: sibling delivered + terminal returned → settle", () => {
  const order = {
    status: "returned",
    items: [
      { trackingStatus: "returned_to_seller", quantity: 1 },
      { trackingStatus: "delivered", quantity: 1 },
    ],
  };
  assert.strictEqual(
    shouldSettleAfterReactivate(order, [new Set(), new Set()]),
    true,
  );
});

check("already delivered order → settle qayta emas", () => {
  const order = {
    status: "delivered",
    items: [{ trackingStatus: "returned_to_seller", quantity: 1 }],
  };
  assert.strictEqual(
    shouldSettleAfterReactivate(order, [new Set()]),
    false,
  );
});

check("Sotildi crash heal: unit delivered + unresolved → heal", () => {
  assert.strictEqual(
    shouldHealSoldCrash({
      reasonType: "no_answer",
      resolvedAt: null,
      unitStatus: "delivered",
    }),
    true,
  );
});

check("heal yo‘q: hali returned_to_seller", () => {
  assert.strictEqual(
    shouldHealSoldCrash({
      reasonType: "no_answer",
      resolvedAt: null,
      unitStatus: "returned_to_seller",
    }),
    false,
  );
});

check("heal yo‘q: allaqachon resolved", () => {
  assert.strictEqual(
    shouldHealSoldCrash({
      reasonType: "no_answer",
      resolvedAt: new Date(),
      unitStatus: "delivered",
    }),
    false,
  );
});

check("heal yo‘q: return reason (no_answer emas)", () => {
  assert.strictEqual(
    shouldHealSoldCrash({
      reasonType: "return",
      resolvedAt: null,
      unitStatus: "delivered",
    }),
    false,
  );
});

check("reactivate/re_handoff rad: sold crash", () => {
  assert.strictEqual(
    shouldRejectReactivateOrReHandoff({
      reasonType: "no_answer",
      resolvedAt: null,
      unitStatus: "delivered",
    }),
    true,
  );
});

check("reactivate ruxsat: oddiy no_answer", () => {
  assert.strictEqual(
    shouldRejectReactivateOrReHandoff({
      reasonType: "no_answer",
      resolvedAt: null,
      unitStatus: "returned_to_seller",
    }),
    false,
  );
});

check("reactivate crash: stockReleased bo‘lsa qayta release yo‘q", () => {
  const shouldReleaseOnReactivate = (stockReleased) => !Boolean(stockReleased);
  assert.strictEqual(shouldReleaseOnReactivate(false), true);
  assert.strictEqual(shouldReleaseOnReactivate(true), false);
});

console.log("\nPassed", passed, "checks");
if (!process.exitCode) console.log("Verification PASSED");
