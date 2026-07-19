function cleanText(value) {
  return String(value || "").trim();
}

function normalizeCoords(coords) {
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const lat = Number(coords[0]);
  const lng = Number(coords[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lat, lng];
}

function normalizeDeliveryAddress(raw) {
  if (!raw || typeof raw !== "object") return null;

  const city = cleanText(raw.city || raw.locality || raw.province);
  const district = cleanText(
    raw.district || raw.tuman || raw.area || raw.districtName,
  );
  const addressLine = cleanText(raw.addressLine || raw.formatted || raw.line);
  const coords = normalizeCoords(raw.coords);

  if (!city && !district && !addressLine && !coords) return null;

  return {
    city,
    district,
    addressLine,
    ...(coords ? { coords } : {}),
  };
}

module.exports = {
  normalizeDeliveryAddress,
  normalizeCoords,
  cleanText,
};
