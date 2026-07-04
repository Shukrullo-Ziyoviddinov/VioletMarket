function normalizeDisplayName(displayName) {
  if (!displayName || typeof displayName !== 'object') {
    return { uz: '', en: '', zh: '' };
  }

  return {
    uz: String(displayName.uz || '').trim(),
    en: String(displayName.en || '').trim(),
    zh: String(displayName.zh || '').trim(),
  };
}

export function getProductTypeDisplayLabel(row, language = 'uz') {
  const displayName = normalizeDisplayName(row?.displayName);
  const lang = ['uz', 'en', 'zh'].includes(String(language || '').trim())
    ? String(language).trim()
    : 'uz';

  return (
    displayName[lang]
    || displayName.uz
    || String(row?.title || '').trim()
    || String(row?.code || '').trim()
  );
}

export function getMasterCategoryDisplayLabel(row, language = 'uz') {
  const displayName = normalizeDisplayName(row?.displayName);
  const name = row?.name || {};
  const lang = ['uz', 'en', 'zh'].includes(String(language || '').trim())
    ? String(language).trim()
    : 'uz';

  return (
    displayName[lang]
    || displayName.uz
    || String(name?.uz || '').trim()
    || String(row?.category || '').trim()
  );
}

export function getMasterCategoryDisplayLabelFromStat(item, language = 'uz') {
  const displayName = normalizeDisplayName(item?.displayName);
  const lang = ['uz', 'en', 'zh'].includes(String(language || '').trim())
    ? String(language).trim()
    : 'uz';

  return displayName[lang] || displayName.uz || String(item?.category || '').trim();
}
