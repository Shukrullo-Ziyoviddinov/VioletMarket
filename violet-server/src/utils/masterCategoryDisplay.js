function clean(value) {
  return String(value || "").trim();
}

function normalizeSellerUiDisplayName(rawDisplayName, fallbackUz = "") {
  const uz = clean(rawDisplayName?.uz) || clean(fallbackUz);
  const en = clean(rawDisplayName?.en) || uz;
  const zh = clean(rawDisplayName?.zh) || uz;
  return { uz, en, zh };
}

function normalizeMasterCategoryDisplayName(rawDisplayName, name = {}) {
  return normalizeSellerUiDisplayName(rawDisplayName, name?.uz);
}

function normalizeProductTypeDisplayName(rawDisplayName, title = "") {
  return normalizeSellerUiDisplayName(rawDisplayName, title);
}

function pickMasterCategoryDisplayLabel(displayName, name, lang = "uz") {
  const normalized = normalizeMasterCategoryDisplayName(displayName, name);
  const key = ["uz", "en", "zh"].includes(String(lang || "").trim()) ? String(lang).trim() : "uz";
  return normalized[key] || normalized.uz || clean(name?.uz);
}

function pickProductTypeDisplayLabel(displayName, title, lang = "uz") {
  const normalized = normalizeProductTypeDisplayName(displayName, title);
  const key = ["uz", "en", "zh"].includes(String(lang || "").trim()) ? String(lang || "").trim() : "uz";
  return normalized[key] || normalized.uz || clean(title);
}

module.exports = {
  normalizeSellerUiDisplayName,
  normalizeMasterCategoryDisplayName,
  normalizeProductTypeDisplayName,
  pickMasterCategoryDisplayLabel,
  pickProductTypeDisplayLabel,
};
