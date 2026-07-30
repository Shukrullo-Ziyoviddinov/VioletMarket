/**
 * Kuryer ish hududi (viloyat) — standart nomlar.
 * Buyurtmadagi region maydoni shu nomlarga keltiriladi.
 */
const DELIVERY_REGIONS = [
  "Toshkent",
  "Toshkent viloyati",
  "Andijon",
  "Buxoro",
  "Farg'ona",
  "Jizzax",
  "Namangan",
  "Navoiy",
  "Qashqadaryo",
  "Samarqand",
  "Sirdaryo",
  "Surxondaryo",
  "Xorazm",
  "Qoraqalpog'iston",
];

/** Faqat viloyat nomlari / yozuv variantlari. */
const REGION_ALIASES = {
  toshkent: "Toshkent",
  tashkent: "Toshkent",
  тошкент: "Toshkent",
  "toshkent shahri": "Toshkent",
  "toshkent city": "Toshkent",
  "город ташкент": "Toshkent",

  "toshkent viloyati": "Toshkent viloyati",
  "tashkent region": "Toshkent viloyati",
  "toshkent oblasti": "Toshkent viloyati",
  "тошкент вилояти": "Toshkent viloyati",
  "ташкентская область": "Toshkent viloyati",
  "toshkentskaya oblast": "Toshkent viloyati",

  andijon: "Andijon",
  andijan: "Andijon",
  андижан: "Andijon",
  "андижанская область": "Andijon",

  buxoro: "Buxoro",
  bukhara: "Buxoro",
  бухоро: "Buxoro",
  "бухарская область": "Buxoro",

  "farg'ona": "Farg'ona",
  fargona: "Farg'ona",
  fergana: "Farg'ona",
  фергана: "Farg'ona",
  "ферганская область": "Farg'ona",

  jizzax: "Jizzax",
  jizzakh: "Jizzax",
  джизак: "Jizzax",
  "джизакская область": "Jizzax",

  namangan: "Namangan",
  намаган: "Namangan",
  наманган: "Namangan",
  "наманганская область": "Namangan",

  navoiy: "Navoiy",
  navoi: "Navoiy",
  навои: "Navoiy",
  "навоийская область": "Navoiy",

  qashqadaryo: "Qashqadaryo",
  qashkadaryo: "Qashqadaryo",
  kashkadarya: "Qashqadaryo",
  қашқадарё: "Qashqadaryo",
  "кашкадарьинская область": "Qashqadaryo",

  samarqand: "Samarqand",
  samarkand: "Samarqand",
  самарканд: "Samarqand",
  "самаркандская область": "Samarqand",

  sirdaryo: "Sirdaryo",
  syrdarya: "Sirdaryo",
  сырдарья: "Sirdaryo",
  "сырдарьинская область": "Sirdaryo",

  surxondaryo: "Surxondaryo",
  surkhandarya: "Surxondaryo",
  сурхандарья: "Surxondaryo",
  "сурхандарьинская область": "Surxondaryo",

  xorazm: "Xorazm",
  khorezm: "Xorazm",
  хорезм: "Xorazm",
  "хорезмская область": "Xorazm",

  "qoraqalpog'iston": "Qoraqalpog'iston",
  qoraqalpogiston: "Qoraqalpog'iston",
  karakalpakstan: "Qoraqalpog'iston",
  каракалпакстан: "Qoraqalpog'iston",
  "республика каракалпакстан": "Qoraqalpog'iston",
};

/**
 * Shahar/tuman → viloyat (filter uchun).
 * Bu nomlar REGION emas — district sifatida saqlanishi mumkin.
 */
const LOCALITY_TO_REGION = {
  nurafshon: { region: "Toshkent viloyati", district: "Nurafshon" },
  angren: { region: "Toshkent viloyati", district: "Angren" },
  chirchiq: { region: "Toshkent viloyati", district: "Chirchiq" },
  чирчик: { region: "Toshkent viloyati", district: "Chirchiq" },
  bekobod: { region: "Toshkent viloyati", district: "Bekobod" },
  olmaliq: { region: "Toshkent viloyati", district: "Olmaliq" },
  ohangaron: { region: "Toshkent viloyati", district: "Ohangaron" },
  "yangiyo'l": { region: "Toshkent viloyati", district: "Yangiyo'l" },
  yangiyol: { region: "Toshkent viloyati", district: "Yangiyo'l" },
  gazalkent: { region: "Toshkent viloyati", district: "Gazalkent" },
  piskent: { region: "Toshkent viloyati", district: "Piskent" },
  "bo'ka": { region: "Toshkent viloyati", district: "Bo'ka" },
  boka: { region: "Toshkent viloyati", district: "Bo'ka" },
  parkent: { region: "Toshkent viloyati", district: "Parkent" },
  kibray: { region: "Toshkent viloyati", district: "Kibray" },
  zangiota: { region: "Toshkent viloyati", district: "Zangiota" },

  asaka: { region: "Andijon", district: "Asaka" },
  shahrixon: { region: "Andijon", district: "Shahrixon" },
  xonobod: { region: "Andijon", district: "Xonobod" },
  мархамат: { region: "Andijon", district: "Marhamat" },
  marhamat: { region: "Andijon", district: "Marhamat" },

  kogon: { region: "Buxoro", district: "Kogon" },
  "g'ijduvon": { region: "Buxoro", district: "G'ijduvon" },
  gijduvon: { region: "Buxoro", district: "G'ijduvon" },
  vobkent: { region: "Buxoro", district: "Vobkent" },
  romitan: { region: "Buxoro", district: "Romitan" },
  "qorako'l": { region: "Buxoro", district: "Qorako'l" },
  qorakol: { region: "Buxoro", district: "Qorako'l" },

  "qo'qon": { region: "Farg'ona", district: "Qo'qon" },
  qoqon: { region: "Farg'ona", district: "Qo'qon" },
  kokand: { region: "Farg'ona", district: "Qo'qon" },
  "marg'ilon": { region: "Farg'ona", district: "Marg'ilon" },
  margilon: { region: "Farg'ona", district: "Marg'ilon" },
  quvasoy: { region: "Farg'ona", district: "Quvasoy" },
  rishton: { region: "Farg'ona", district: "Rishton" },
  quva: { region: "Farg'ona", district: "Quva" },

  "g'allaorol": { region: "Jizzax", district: "G'allaorol" },
  gallaorol: { region: "Jizzax", district: "G'allaorol" },
  zomin: { region: "Jizzax", district: "Zomin" },
  dostlik: { region: "Jizzax", district: "Do'stlik" },
  "do'stlik": { region: "Jizzax", district: "Do'stlik" },
  paxtakor: { region: "Jizzax", district: "Paxtakor" },

  chust: { region: "Namangan", district: "Chust" },
  chortoq: { region: "Namangan", district: "Chortoq" },
  kosonsoy: { region: "Namangan", district: "Kosonsoy" },
  pop: { region: "Namangan", district: "Pop" },
  "uchqo'rg'on": { region: "Namangan", district: "Uchqo'rg'on" },
  uchqorgon: { region: "Namangan", district: "Uchqo'rg'on" },

  zarafshon: { region: "Navoiy", district: "Zarafshon" },
  karmana: { region: "Navoiy", district: "Karmana" },
  nurota: { region: "Navoiy", district: "Nurota" },
  uchquduq: { region: "Navoiy", district: "Uchquduq" },
  qiziltepa: { region: "Navoiy", district: "Qiziltepa" },

  qarshi: { region: "Qashqadaryo", district: "Qarshi" },
  карши: { region: "Qashqadaryo", district: "Qarshi" },
  shahrisabz: { region: "Qashqadaryo", district: "Shahrisabz" },
  shakhrisabz: { region: "Qashqadaryo", district: "Shahrisabz" },
  шахрисабз: { region: "Qashqadaryo", district: "Shahrisabz" },
  "yakkabog'": { region: "Qashqadaryo", district: "Yakkabog'" },
  yakkabog: { region: "Qashqadaryo", district: "Yakkabog'" },
  kitob: { region: "Qashqadaryo", district: "Kitob" },
  koson: { region: "Qashqadaryo", district: "Koson" },
  muborak: { region: "Qashqadaryo", district: "Muborak" },
  "g'uzor": { region: "Qashqadaryo", district: "G'uzor" },
  guzor: { region: "Qashqadaryo", district: "G'uzor" },
  chiroqchi: { region: "Qashqadaryo", district: "Chiroqchi" },

  "kattaqo'rg'on": { region: "Samarqand", district: "Kattaqo'rg'on" },
  kattaqorgon: { region: "Samarqand", district: "Kattaqo'rg'on" },
  urgut: { region: "Samarqand", district: "Urgut" },
  bulungur: { region: "Samarqand", district: "Bulung'ur" },
  jomboy: { region: "Samarqand", district: "Jomboy" },
  ishtixon: { region: "Samarqand", district: "Ishtixon" },

  guliston: { region: "Sirdaryo", district: "Guliston" },
  yangiyer: { region: "Sirdaryo", district: "Yangiyer" },
  shirin: { region: "Sirdaryo", district: "Shirin" },
  xovos: { region: "Sirdaryo", district: "Xovos" },

  termiz: { region: "Surxondaryo", district: "Termiz" },
  термиз: { region: "Surxondaryo", district: "Termiz" },
  denov: { region: "Surxondaryo", district: "Denov" },
  boysun: { region: "Surxondaryo", district: "Boysun" },
  sherobod: { region: "Surxondaryo", district: "Sherobod" },
  "sho'rchi": { region: "Surxondaryo", district: "Sho'rchi" },
  shorchi: { region: "Surxondaryo", district: "Sho'rchi" },

  urganch: { region: "Xorazm", district: "Urganch" },
  urgench: { region: "Xorazm", district: "Urganch" },
  ургенч: { region: "Xorazm", district: "Urganch" },
  xiva: { region: "Xorazm", district: "Xiva" },
  khiva: { region: "Xorazm", district: "Xiva" },
  hazorasp: { region: "Xorazm", district: "Hazorasp" },
  gurlan: { region: "Xorazm", district: "Gurlan" },
  shovot: { region: "Xorazm", district: "Shovot" },

  nukus: { region: "Qoraqalpog'iston", district: "Nukus" },
  нукус: { region: "Qoraqalpog'iston", district: "Nukus" },
  "xo'jayli": { region: "Qoraqalpog'iston", district: "Xo'jayli" },
  xojayli: { region: "Qoraqalpog'iston", district: "Xo'jayli" },
  taxiatosh: { region: "Qoraqalpog'iston", district: "Taxiatosh" },
  "to'rtko'l": { region: "Qoraqalpog'iston", district: "To'rtko'l" },
  tortkol: { region: "Qoraqalpog'iston", district: "To'rtko'l" },
  beruniy: { region: "Qoraqalpog'iston", district: "Beruniy" },
  "qo'ng'irot": { region: "Qoraqalpog'iston", district: "Qo'ng'irot" },
  qongirot: { region: "Qoraqalpog'iston", district: "Qo'ng'irot" },
};

/** Erkin address matnida noto‘g‘ri match berishi mumkin bo‘lgan qisqa locality kalitlar. */
const SHORT_LOCALITY_KEYS = new Set(
  Object.keys(LOCALITY_TO_REGION).filter((key) => key.length <= 4),
);

function normalizeRegionKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[ʻ’'`]/g, "'")
    .replace(/\s+/g, " ");
}

function canonicalizeDeliveryRegion(value) {
  const key = normalizeRegionKey(value);
  if (!key) return "";

  if (REGION_ALIASES[key]) return REGION_ALIASES[key];

  const direct = DELIVERY_REGIONS.find(
    (region) => normalizeRegionKey(region) === key,
  );
  if (direct) return direct;

  return "";
}

function resolveLocalityMapping(value) {
  const key = normalizeRegionKey(value);
  if (!key) return null;
  return LOCALITY_TO_REGION[key] || null;
}

function findBoundedPhraseIndex(text, phrase, fromIndex = 0) {
  if (!text || !phrase) return -1;
  let index = text.indexOf(phrase, fromIndex);
  const wordCharacter = /[\p{L}\p{N}]/u;

  while (index !== -1) {
    const before = index > 0 ? text[index - 1] : "";
    const afterIndex = index + phrase.length;
    const after = afterIndex < text.length ? text[afterIndex] : "";
    if (
      (!before || !wordCharacter.test(before)) &&
      (!after || !wordCharacter.test(after))
    ) {
      return index;
    }
    index = text.indexOf(phrase, index + 1);
  }

  return -1;
}

function containsNormalizedPhrase(text, phrase) {
  return findBoundedPhraseIndex(text, phrase) !== -1;
}

function isStreetContextMatch(text, index, phraseLength) {
  const after = text.slice(index + phraseLength).trimStart();
  return /^(ko'?cha|kucha|улица|ул\.|street|str\.)/u.test(after);
}

function detectDeliveryRegionFromText(text, options = {}) {
  const allowShortLocalities = options.allowShortLocalities !== false;
  const raw = String(text || "").trim();
  if (!raw) return "";

  const direct = canonicalizeDeliveryRegion(raw);
  if (direct) return direct;

  const locality = resolveLocalityMapping(raw);
  if (locality?.region) return locality.region;

  const lower = normalizeRegionKey(raw);
  const aliasEntries = Object.entries(REGION_ALIASES).sort(
    (a, b) => b[0].length - a[0].length,
  );

  for (const [alias, region] of aliasEntries) {
    let index = findBoundedPhraseIndex(lower, alias);
    while (index !== -1) {
      if (!isStreetContextMatch(lower, index, alias.length)) {
        return region;
      }
      index = findBoundedPhraseIndex(lower, alias, index + 1);
    }
  }

  const regionsByLength = [...DELIVERY_REGIONS].sort(
    (a, b) => normalizeRegionKey(b).length - normalizeRegionKey(a).length,
  );
  for (const region of regionsByLength) {
    const phrase = normalizeRegionKey(region);
    let index = findBoundedPhraseIndex(lower, phrase);
    while (index !== -1) {
      if (!isStreetContextMatch(lower, index, phrase.length)) {
        return region;
      }
      index = findBoundedPhraseIndex(lower, phrase, index + 1);
    }
  }

  const localityEntries = Object.entries(LOCALITY_TO_REGION).sort(
    (a, b) => b[0].length - a[0].length,
  );
  for (const [alias, mapping] of localityEntries) {
    if (!allowShortLocalities && SHORT_LOCALITY_KEYS.has(alias)) continue;
    if (containsNormalizedPhrase(lower, alias)) return mapping.region;
  }

  return "";
}

function detectDistrictHintFromText(text, options = {}) {
  const allowShortLocalities = options.allowShortLocalities !== false;
  const raw = String(text || "").trim();
  if (!raw) return "";

  const exact = resolveLocalityMapping(raw);
  if (exact?.district) return exact.district;

  const lower = normalizeRegionKey(raw);
  const localityEntries = Object.entries(LOCALITY_TO_REGION).sort(
    (a, b) => b[0].length - a[0].length,
  );
  for (const [alias, mapping] of localityEntries) {
    if (!allowShortLocalities && SHORT_LOCALITY_KEYS.has(alias)) continue;
    if (containsNormalizedPhrase(lower, alias)) return mapping.district;
  }

  return "";
}

function assertDeliveryRegion(value) {
  const region = canonicalizeDeliveryRegion(value);
  if (!region || !DELIVERY_REGIONS.includes(region)) {
    return null;
  }
  return region;
}

module.exports = {
  DELIVERY_REGIONS,
  canonicalizeDeliveryRegion,
  detectDeliveryRegionFromText,
  detectDistrictHintFromText,
  resolveLocalityMapping,
  assertDeliveryRegion,
  normalizeRegionKey,
};
