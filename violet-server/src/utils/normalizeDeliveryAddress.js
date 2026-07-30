const {
  canonicalizeDeliveryRegion,
  detectDeliveryRegionFromText,
  detectDistrictHintFromText,
  resolveLocalityMapping,
} = require("../constants/deliveryRegions");
const { HttpError } = require("./httpError");

function cleanText(value) {
  return String(value || "").trim();
}

function normalizeCoords(coords) {
  if (!coords) return null;

  if (Array.isArray(coords) && coords.length >= 2) {
    const lat = Number(coords[0]);
    const lng = Number(coords[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return [lat, lng];
  }

  if (typeof coords === "object") {
    const lat = Number(coords.lat ?? coords.latitude);
    const lng = Number(coords.lng ?? coords.lon ?? coords.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return [lat, lng];
  }

  return null;
}

function parseCityDistrictFromLine(addressLine) {
  const line = cleanText(addressLine);
  if (!line) return { city: "", district: "" };

  // Region tokens only here — locality short-token scan disabled for free text.
  const city = detectDeliveryRegionFromText(line, {
    allowShortLocalities: false,
  });

  let district = "";
  const districtMatch =
    line.match(
      /([A-Za-zА-Яа-яЁёЎўҚқҒғҲҳʻ''`\-\s]{3,}?)\s*(tumani|тумани|district|р-н|район)/i,
    ) ||
    line.match(
      /\b(Chilonzor|Yunusobod|Mirzo\s*Ulug['ʻ’`]?bek|Yakkasaroy|Yashnobod|Sergeli|Uchtepa|Olmazor|Bektemir|Mirobod|Shayxontohur|Shahrisabz|Yakkabog['ʻ’`]?|Qarshi|Чиланзар|Юнусабад|Шахрисабз|Карши)\b/i,
    );

  if (districtMatch) {
    district = cleanText(districtMatch[1]);
  }

  if (!district) {
    district = detectDistrictHintFromText(line, {
      allowShortLocalities: false,
    });
  }

  return { city, district };
}

function coerceRawAddress(raw) {
  if (!raw) return null;

  if (typeof raw === "string") {
    const text = raw.trim();
    if (!text) return null;
    if (text.startsWith("{") || text.startsWith("[")) {
      try {
        return coerceRawAddress(JSON.parse(text));
      } catch {
        return { addressLine: text };
      }
    }
    return { addressLine: text };
  }

  if (typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw;
}

function resolveCanonicalRegion({
  rawRegion,
  rawCity,
  rawDistrict,
  addressLine,
  existingRegion,
}) {
  const structuredRegion =
    canonicalizeDeliveryRegion(existingRegion) ||
    canonicalizeDeliveryRegion(rawRegion) ||
    detectDeliveryRegionFromText(rawRegion, { allowShortLocalities: false });

  const cityLocality = resolveLocalityMapping(rawCity);
  const districtLocality = resolveLocalityMapping(rawDistrict);
  const cityAsRegion = canonicalizeDeliveryRegion(rawCity);

  // Structured province/region always wins over ambiguous city="Toshkent".
  if (structuredRegion) return structuredRegion;
  if (cityLocality?.region) return cityLocality.region;
  if (districtLocality?.region) return districtLocality.region;
  if (cityAsRegion) return cityAsRegion;

  return (
    detectDeliveryRegionFromText(addressLine, { allowShortLocalities: false }) ||
    ""
  );
}

function resolveDisplayCity({
  region,
  rawCity,
  cityLocality,
  districtLocality,
}) {
  if (cityLocality?.district) return cityLocality.district;
  if (rawCity && !canonicalizeDeliveryRegion(rawCity)) return rawCity;
  if (districtLocality?.district) return districtLocality.district;
  // Region-only addresses (e.g. Toshkent city) keep region as display city.
  return region || "";
}

function normalizeDeliveryAddress(raw) {
  const data = coerceRawAddress(raw);
  if (!data) return null;

  const addressLine = cleanText(
    data.addressLine || data.formatted || data.line,
  );
  const parsed = parseCityDistrictFromLine(addressLine);

  const rawCity = cleanText(data.city || data.locality || data.area || "");
  const rawRegion = cleanText(
    data.region || data.province || data.state || data.administrativeArea,
  );
  let district = cleanText(
    data.district ||
      data.tuman ||
      data.districtName ||
      parsed.district,
  );

  const cityLocality = resolveLocalityMapping(rawCity);
  const districtLocality = resolveLocalityMapping(district);

  const region = resolveCanonicalRegion({
    rawRegion,
    rawCity,
    rawDistrict: district,
    addressLine,
    existingRegion: data.region,
  });

  if (!district && cityLocality?.district) {
    district = cityLocality.district;
  }
  if (!district) {
    district = detectDistrictHintFromText(addressLine, {
      allowShortLocalities: false,
    });
  }

  const city = resolveDisplayCity({
    region,
    rawCity,
    cityLocality,
    districtLocality,
  });

  const coords = normalizeCoords(data.coords || data.location || data.position);

  if (!region && !city && !district && !addressLine && !coords) return null;

  const placeType = cleanText(data.placeType || data.homeType);
  const entrance = cleanText(data.entrance || data.podъезд || data.yolak);
  const floor = cleanText(data.floor || data.qavat);
  const domofon = cleanText(data.domofon || data.intercom);
  const courierNote = cleanText(data.courierNote || data.note);

  return {
    region: region || "",
    city,
    district,
    addressLine,
    placeType,
    entrance,
    floor,
    domofon,
    courierNote,
    ...(coords ? { coords } : {}),
  };
}

function requireDeliveryRegionAddress(raw, message) {
  const normalized = normalizeDeliveryAddress(raw);
  if (!normalized) {
    throw new HttpError(
      400,
      message || "Yetkazib berish manzili yuborilmadi",
      "DELIVERY_ADDRESS_REQUIRED",
    );
  }
  if (!normalized.region) {
    throw new HttpError(
      400,
      "Manzil viloyatini aniqlab bo‘lmadi. Region/viloyatni aniq saqlang",
      "DELIVERY_REGION_UNRESOLVED",
    );
  }
  return normalized;
}

module.exports = {
  normalizeDeliveryAddress,
  requireDeliveryRegionAddress,
  normalizeCoords,
  cleanText,
  parseCityDistrictFromLine,
};
