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

  let city = "";
  let district = "";

  const cityMatch = line.match(
    /\b(Toshkent|Тошкент|Tashkent|Samarqand|Самарканд|Samarkand|Buxoro|Бухоро|Bukhara|Andijon|Андижан|Andijan|Namangan|Наманган|Farg['ʻ’`]?ona|Фергана|Fergana|Nukus|Нукус|Xorazm|Хорезм|Navoiy|Навои)\b/i,
  );
  if (cityMatch) city = cityMatch[1];

  const districtMatch =
    line.match(
      /([A-Za-zА-Яа-яЁёЎўҚқҒғҲҳʻ''`\-\s]{3,}?)\s*(tumani|tumani|тумани|district|р-н|район)/i,
    ) || line.match(/\b(Chilonzor|Yunusobod|Mirzo\s*Ulug['ʻ’`]?bek|Yakkasaroy|Yashnobod|Sergeli|Uchtepa|Olmazor|Bektemir|Mirobod|Shayxontohur|Чиланзар|Юнусабад)\b/i);

  if (districtMatch) {
    district = cleanText(districtMatch[1]);
  }

  if (city && /^toshkent|тошкент|tashkent$/i.test(city)) {
    city = "Toshkent";
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

function normalizeDeliveryAddress(raw) {
  const data = coerceRawAddress(raw);
  if (!data) return null;

  const parsed = parseCityDistrictFromLine(
    data.addressLine || data.formatted || data.line || "",
  );

  const city = cleanText(
    data.city || data.locality || data.province || parsed.city,
  );
  const district = cleanText(
    data.district ||
      data.tuman ||
      data.districtName ||
      data.area ||
      parsed.district,
  );
  const addressLine = cleanText(
    data.addressLine || data.formatted || data.line,
  );
  const coords = normalizeCoords(data.coords || data.location || data.position);

  if (!city && !district && !addressLine && !coords) return null;

  const placeType = cleanText(data.placeType || data.homeType);
  const entrance = cleanText(data.entrance || data.podъезд || data.yolak);
  const floor = cleanText(data.floor || data.qavat);
  const domofon = cleanText(data.domofon || data.intercom);
  const courierNote = cleanText(data.courierNote || data.note);

  return {
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

module.exports = {
  normalizeDeliveryAddress,
  normalizeCoords,
  cleanText,
  parseCityDistrictFromLine,
};
