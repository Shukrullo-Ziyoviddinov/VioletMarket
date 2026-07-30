const { DeliveryAccount } = require("../../models/deliveryAccount");
const {
  canonicalizeDeliveryRegion,
  detectDeliveryRegionFromText,
  resolveLocalityMapping,
} = require("../../constants/deliveryRegions");
const {
  normalizeDeliveryAddress,
} = require("../../utils/normalizeDeliveryAddress");
const { HttpError } = require("../../utils/httpError");

function resolveCourierRegion(delivery) {
  return canonicalizeDeliveryRegion(delivery?.region);
}

async function getActiveCourierWithRegion(deliveryId) {
  const delivery = await DeliveryAccount.findById(deliveryId).lean();
  if (!delivery || String(delivery.status) !== "active") {
    throw new HttpError(
      403,
      "Kuryer hisobi faol emas",
      "DELIVERY_INACTIVE",
    );
  }

  const region = resolveCourierRegion(delivery);
  if (!region) {
    throw new HttpError(
      409,
      "Buyurtmalar tanlash uchun mos region tanlang",
      "DELIVERY_REGION_REQUIRED",
    );
  }

  return { delivery, region };
}

function resolveOrderDeliveryRegion(order) {
  const raw = order?.deliveryAddress;
  if (!raw) return "";
  const address = normalizeDeliveryAddress(raw);
  if (!address) return "";

  if (address.region) {
    return canonicalizeDeliveryRegion(address.region) || address.region;
  }

  return (
    canonicalizeDeliveryRegion(address.city) ||
    resolveLocalityMapping(address.city)?.region ||
    resolveLocalityMapping(address.district)?.region ||
    detectDeliveryRegionFromText(address.city, {
      allowShortLocalities: false,
    }) ||
    detectDeliveryRegionFromText(address.addressLine, {
      allowShortLocalities: false,
    }) ||
    ""
  );
}

function resolveOrderAddressFields(order) {
  const normalized = normalizeDeliveryAddress(order?.deliveryAddress);
  const region = resolveOrderDeliveryRegion(order);
  return {
    region,
    city: normalized?.city || region || "",
    district: normalized?.district || "Noma’lum tuman",
    addressLine: normalized?.addressLine || "",
    coords: Array.isArray(normalized?.coords) ? normalized.coords : null,
  };
}

function assertOrderMatchesCourierRegion(order, courierRegion) {
  const orderRegion = resolveOrderDeliveryRegion(order);
  if (!orderRegion) {
    throw new HttpError(
      409,
      "Buyurtma regionini aniqlab bo‘lmadi",
      "ORDER_REGION_UNRESOLVED",
    );
  }

  if (orderRegion !== courierRegion) {
    throw new HttpError(
      403,
      "Bu buyurtma siz tanlagan regionga tegishli emas",
      "ORDER_OUTSIDE_COURIER_REGION",
    );
  }

  return orderRegion;
}

module.exports = {
  getActiveCourierWithRegion,
  resolveCourierRegion,
  resolveOrderDeliveryRegion,
  resolveOrderAddressFields,
  assertOrderMatchesCourierRegion,
};
