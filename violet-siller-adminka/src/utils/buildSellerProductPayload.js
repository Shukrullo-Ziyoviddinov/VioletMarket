import { buildProductDescriptionArray } from './productDescriptionDraft';
import { buildColorsPayload } from './productColorsDraft';
import { buildSizeChartPayload } from './sizeChartDraft';
import { buildRelatedGroupsPayload } from './relatedGroupsDraft';

function buildOptionalDiscount(discountUz, discountRu) {
  const uz = String(discountUz || '').trim();
  const ru = String(discountRu || '').trim();
  if (!uz && !ru) return undefined;
  return { uz, ru };
}

function hasDescriptionContent(description) {
  if (!Array.isArray(description) || description.length === 0) return false;
  const block = description[0];
  if (!block || typeof block !== 'object') return false;

  const hasInfo =
    String(block?.info?.uz || '').trim() || String(block?.info?.ru || '').trim();
  const hasMainFeatures =
    Array.isArray(block?.mainFeatures) && block.mainFeatures.length > 0;
  const hasTechnicalSpecs =
    Array.isArray(block?.technicalSpecs) && block.technicalSpecs.length > 0;
  const hasHeadings =
    String(block?.mainFeaturesHeading?.uz || '').trim() ||
    String(block?.mainFeaturesHeading?.ru || '').trim() ||
    String(block?.technicalHeading?.uz || '').trim() ||
    String(block?.technicalHeading?.ru || '').trim();

  return hasInfo || hasMainFeatures || hasTechnicalSpecs || hasHeadings;
}

export function buildSellerProductPayload(values) {
  const mediaPayload = buildColorsPayload(values);
  const description = buildProductDescriptionArray(values);
  const descriptionImages = (Array.isArray(values?.descriptionImages) ? values.descriptionImages : [])
    .map((path) => String(path || '').trim())
    .filter(Boolean);
  const sizeChart = buildSizeChartPayload(values);
  const relatedGroups = buildRelatedGroupsPayload(values);
  const countryCode = String(values?.countryCode || '').trim();
  const weightValue = String(values?.weight || '').trim();
  const discount = buildOptionalDiscount(values?.discountUz, values?.discountRu);

  const payload = {
    categoryName: String(values?.categoryName || '').trim(),
    title: {
      uz: String(values?.titleUz || '').trim(),
      ru: String(values?.titleRu || '').trim(),
    },
    price: String(values?.price || '').trim(),
    originalPrice: String(values?.originalPrice || '').trim() || undefined,
    discount,
    video: String(values?.video || '').trim() || undefined,
    masterCategoryId: values?.masterCategoryId ? Number(values.masterCategoryId) : undefined,
    category: String(values?.category || '').trim() || undefined,
    countryCodes: countryCode ? [countryCode] : [],
    productType: String(values?.productType || '').trim() || undefined,
    productCountry: String(values?.productCountry || '').trim() || undefined,
    countriesCategories:
      String(values?.countriesCategories || '').trim() ||
      String(values?.productCountry || '').trim() ||
      undefined,
    brandCategories: String(values?.brandCategories || '').trim() || undefined,
    labels: {
      types: Array.isArray(values?.labelTypes) ? values.labelTypes : [],
      chegirmaPercent: String(values?.chegirmaPercent || '').trim(),
    },
    relatedGroups,
    ...mediaPayload,
  };

  if (weightValue) {
    payload.weight = Number(weightValue);
  }

  if (hasDescriptionContent(description)) {
    payload.description = description;
  }

  if (descriptionImages.length > 0) {
    payload.descriptionImages = descriptionImages;
  }

  if (sizeChart) {
    payload.sizeChart = sizeChart;
  }

  return payload;
}
