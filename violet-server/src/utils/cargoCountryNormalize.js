/**
 * Cargo / logistica davlat kodlari — bitta kanonik shakl.
 * Siller seed: turkiya; logistica profile: turkey → mos kelishi shart.
 */

const CARGO_COUNTRY_ALIASES = {
  turkey: "turkiya",
  turkiya: "turkiya",
  china: "china",
  xitoy: "china",
  kitay: "china",
  usa: "usa",
  us: "usa",
  aqsh: "usa",
  korea: "korea",
  koreya: "korea",
  japan: "japan",
};

function normalizeCargoCountry(value) {
  const key = String(value || "")
    .trim()
    .toLowerCase();
  if (!key) return "";
  return CARGO_COUNTRY_ALIASES[key] || key;
}

/** Mongo filter: logistica davlati bilan mos sellerCountry qiymatlari */
function cargoCountryMatchValues(logisticaCountry) {
  const canonical = normalizeCargoCountry(logisticaCountry);
  if (!canonical) return [];

  const values = new Set([canonical]);
  for (const [alias, canon] of Object.entries(CARGO_COUNTRY_ALIASES)) {
    if (canon === canonical) values.add(alias);
  }
  return [...values];
}

function cargoCountriesMatch(a, b) {
  const left = normalizeCargoCountry(a);
  const right = normalizeCargoCountry(b);
  return Boolean(left) && left === right;
}

module.exports = {
  CARGO_COUNTRY_ALIASES,
  normalizeCargoCountry,
  cargoCountryMatchValues,
  cargoCountriesMatch,
};
