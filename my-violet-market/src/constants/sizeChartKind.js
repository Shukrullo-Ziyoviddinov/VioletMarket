/**
 * O'lcham jadvali guruhi — product.json da sizeChart.typeSize va
 * guideImages[].typeSize (admin/CMS: bitta tanlov — tana / shim / oyoq kiyimi).
 *
 * Eski kalitlar (chartKind, kind) ProductDetail da vaqtincha o'qiladi.
 *
 * Tarjima: locales da productDetail.sizeChartKind.<qiymat>
 * Standart sxema: SIZE_CHART_DEFAULT_GUIDE_SRC
 */

export const TYPE_SIZE_VALUES = Object.freeze(['footwear', 'upper_body', 'pants']);

/** @deprecated TYPE_SIZE_VALUES dan foydalaning */
export const SIZE_CHART_KINDS = TYPE_SIZE_VALUES;

const VALUE_SET = new Set(TYPE_SIZE_VALUES);

export function isValidTypeSize(value) {
  return typeof value === 'string' && VALUE_SET.has(value);
}

/** @deprecated isValidTypeSize dan foydalaning */
export const isValidSizeChartKind = isValidTypeSize;

/** i18next: productDetail.sizeChartKind.<typeSize> */
export function typeSizeI18nKey(typeSize) {
  return `productDetail.sizeChartKind.${typeSize}`;
}

/** @deprecated typeSizeI18nKey dan foydalaning */
export const sizeChartKindI18nKey = typeSizeI18nKey;

/** Standart sxema rasmlari — guideImages[].src bo'sh bo'lsa shu yo'l */
export const SIZE_CHART_DEFAULT_GUIDE_SRC = Object.freeze({
  footwear: 'img/size-foot-guide.png',
  upper_body: 'img/size-body-guide.png',
  pants: 'img/size-pants-guide.png',
});

/**
 * guideImages uchun src: bo'sh bo'lsa typeSize (element yoki sizeChart) bo'yicha
 * standart rasm. Boshqa rasm kerak bo'lsa src ni to'ldiring.
 */
export function resolveSizeChartGuideSrc({
  explicitSrc,
  itemTypeSize,
  parentTypeSize,
}) {
  const trimmed = typeof explicitSrc === 'string' ? explicitSrc.trim() : '';
  if (trimmed) return trimmed;
  const k = isValidTypeSize(itemTypeSize)
    ? itemTypeSize
    : isValidTypeSize(parentTypeSize)
      ? parentTypeSize
      : null;
  return k ? SIZE_CHART_DEFAULT_GUIDE_SRC[k] : '';
}

/** Admin: radio/select — label uchun typeSizeI18nKey(value) */
export const TYPE_SIZE_OPTIONS = TYPE_SIZE_VALUES.map((value) => ({
  value,
  defaultGuideSrc: SIZE_CHART_DEFAULT_GUIDE_SRC[value],
}));

/** @deprecated TYPE_SIZE_OPTIONS dan foydalaning */
export const SIZE_CHART_KIND_OPTIONS = TYPE_SIZE_OPTIONS;
