/**
 * Region normalizatsiya / siyosat regressiya testlari.
 * Ishlatish: node src/scripts/testDeliveryRegions.js
 */
const assert = require("assert");
const {
  DELIVERY_REGIONS,
  canonicalizeDeliveryRegion,
  detectDeliveryRegionFromText,
} = require("../constants/deliveryRegions");
const {
  normalizeDeliveryAddress,
  requireDeliveryRegionAddress,
} = require("../utils/normalizeDeliveryAddress");
const {
  resolveOrderDeliveryRegion,
} = require("../services/deliveryOrders/deliveryRegionPolicy");

function check(name, fn) {
  try {
    fn();
    console.log("PASS:", name);
  } catch (error) {
    console.error("FAIL:", name);
    throw error;
  }
}

check("all 14 regions canonicalize", () => {
  for (const region of DELIVERY_REGIONS) {
    assert.strictEqual(canonicalizeDeliveryRegion(region), region);
  }
});

check("Toshkent vs Toshkent viloyati longest-first", () => {
  assert.strictEqual(
    detectDeliveryRegionFromText("Toshkent viloyati, Chirchiq"),
    "Toshkent viloyati",
  );
  assert.strictEqual(
    detectDeliveryRegionFromText("ташкентская область"),
    "Toshkent viloyati",
  );
  assert.strictEqual(detectDeliveryRegionFromText("Toshkent shahri"), "Toshkent");
});

check("street name does not steal Navoiy region", () => {
  assert.strictEqual(
    detectDeliveryRegionFromText("Navoiy ko'chasi, Toshkent"),
    "Toshkent",
  );
  assert.strictEqual(
    detectDeliveryRegionFromText("Navoiy ko'chasi, Chilonzor tumani"),
    "",
  );
});

check("short locality not matched in free text", () => {
  assert.strictEqual(
    detectDeliveryRegionFromText("Kitob do'koni, Toshkent"),
    "Toshkent",
  );
});

check("exact short locality still maps", () => {
  assert.strictEqual(detectDeliveryRegionFromText("Pop"), "Namangan");
  assert.strictEqual(detectDeliveryRegionFromText("Quva"), "Farg'ona");
});

check("province wins over ambiguous Toshkent city", () => {
  const normalized = normalizeDeliveryAddress({
    city: "Toshkent",
    province: "Toshkent viloyati",
    district: "Chirchiq",
    addressLine: "Chirchiq",
    coords: [41.46, 69.58],
  });
  assert.strictEqual(normalized.region, "Toshkent viloyati");
  assert.strictEqual(normalized.district, "Chirchiq");
});

check("locality map fills region", () => {
  const normalized = normalizeDeliveryAddress({
    city: "Angren",
    addressLine: "Angren",
    coords: [41.0, 70.0],
  });
  assert.strictEqual(normalized.region, "Toshkent viloyati");
  assert.strictEqual(normalized.city, "Angren");
});

check("requireDeliveryRegionAddress rejects unresolved", () => {
  let threw = false;
  try {
    requireDeliveryRegionAddress({
      addressLine: "random street 12",
      coords: [10, 10],
    });
  } catch (error) {
    threw = true;
    assert.strictEqual(error.code, "DELIVERY_REGION_UNRESOLVED");
  }
  assert.strictEqual(threw, true);
});

check("list/accept policy uses region field", () => {
  const order = {
    deliveryAddress: {
      region: "Samarqand",
      city: "Urgut",
      district: "Urgut",
      addressLine: "Urgut",
    },
  };
  assert.strictEqual(resolveOrderDeliveryRegion(order), "Samarqand");
});

check("legacy city-only still resolves", () => {
  const order = {
    deliveryAddress: {
      city: "Samarqand",
      district: "Urgut",
      addressLine: "Urgut tumani",
    },
  };
  assert.strictEqual(resolveOrderDeliveryRegion(order), "Samarqand");
});

console.log("\nAll delivery region regression checks passed");
