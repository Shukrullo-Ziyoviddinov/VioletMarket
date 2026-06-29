import {
  createSizeStockRow,
  createModelStockRow,
  createStorageStockRow,
} from './productStockDraft';
import { createColorDraft } from './productColorsDraft';
import { createMainFeatureRow, createTechnicalSpecRow } from './productDescriptionDraft';
import {
  createFixedSizeMeasureColumn,
  createGuideImageRow,
  createMeasureColumnRow,
  isValidTypeSize,
} from './sizeChartDraft';
import { createRelatedGroupDraft } from './relatedGroupsDraft';
import { CHEGIRMA_COLOR, CHEGIRMA_ICON } from './productLabelPresets';

function createLocalId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function mapStockMapToSizeRows(stockMap) {
  const entries = Object.entries(stockMap || {});
  if (entries.length === 0) return [createSizeStockRow()];
  return entries.map(([label, entry]) =>
    createSizeStockRow(label, entry?.quantity ?? ''),
  );
}

function mapStockMapToVariantRows(stockMap, createRow) {
  const entries = Object.entries(stockMap || {});
  if (entries.length === 0) return [];
  return entries.map(([label, entry]) =>
    createRow(label, entry?.quantity ?? '', entry?.price ?? '', entry?.originalPrice ?? ''),
  );
}

function extractLabelTypes(labels) {
  const list = Array.isArray(labels) ? labels : [];
  const types = [];
  let chegirmaPercent = '';

  for (const label of list) {
    const uz = String(label?.text?.uz || '').trim();
    const icon = String(label?.icon || '').trim();
    const color = String(label?.color || '').trim();

    if (icon === CHEGIRMA_ICON || color === CHEGIRMA_COLOR || /chegirma|скидка/i.test(uz)) {
      types.push('chegirma');
      const match = uz.match(/(\d+)\s*%/);
      if (match) chegirmaPercent = match[1];
      continue;
    }

    if (/original|оригинал/i.test(uz)) {
      types.push('original');
      continue;
    }

    if (/super narx|супер цена/i.test(uz)) {
      types.push('superNarx');
    }
  }

  return {
    labelTypes: [...new Set(types)],
    chegirmaPercent,
  };
}

function mapColorToDraft(color) {
  const draft = createColorDraft();
  return {
    ...draft,
    localId: createLocalId('color'),
    nameUz: String(color?.name?.uz || '').trim(),
    nameRu: String(color?.name?.ru || '').trim(),
    colorFilter: String(color?.colorFilter || '').trim(),
    quantity:
      color?.quantity != null && color?.quantity !== '' ? String(color.quantity) : '',
    sizeStockRows: mapStockMapToSizeRows(color?.sizeStock),
    modelStockRows: mapStockMapToVariantRows(color?.modelStock, createModelStockRow),
    storageStockRows: mapStockMapToVariantRows(color?.storageStock, createStorageStockRow),
    price: String(color?.price || '').trim(),
    originalPrice: String(color?.originalPrice || '').trim(),
    discountUz: String(color?.discount?.uz || '').trim(),
    discountRu: String(color?.discount?.ru || '').trim(),
    mainImage: String(color?.mainImage || '').trim(),
    thumbnails: (Array.isArray(color?.thumbnails) ? color.thumbnails : [])
      .map((path) => String(path || '').trim())
      .filter(Boolean),
  };
}

function mapDescriptionToFormFields(description) {
  const block = Array.isArray(description) ? description[0] : null;
  if (!block) {
    return {};
  }

  const mainFeatures = (Array.isArray(block?.mainFeatures) ? block.mainFeatures : []).map((row) => ({
    localId: createLocalId('mf'),
    titleUz: String(row?.title?.uz || '').trim(),
    titleRu: String(row?.title?.ru || '').trim(),
    textUz: String(row?.text?.uz || '').trim(),
    textRu: String(row?.text?.ru || '').trim(),
  }));

  const technicalSpecs = (Array.isArray(block?.technicalSpecs) ? block.technicalSpecs : []).map(
    (row) => ({
      localId: createLocalId('ts'),
      labelUz: String(row?.label?.uz || '').trim(),
      labelRu: String(row?.label?.ru || '').trim(),
      valueUz: String(row?.value?.uz || '').trim(),
      valueRu: String(row?.value?.ru || '').trim(),
    }),
  );

  return {
    descriptionInfoUz: String(block?.info?.uz || '').trim(),
    descriptionInfoRu: String(block?.info?.ru || '').trim(),
    mainFeaturesHeadingUz: String(block?.mainFeaturesHeading?.uz || '').trim(),
    mainFeaturesHeadingRu: String(block?.mainFeaturesHeading?.ru || '').trim(),
    mainFeatures: mainFeatures.length > 0 ? mainFeatures : [createMainFeatureRow()],
    technicalHeadingUz: String(block?.technicalHeading?.uz || '').trim(),
    technicalHeadingRu: String(block?.technicalHeading?.ru || '').trim(),
    technicalSpecs: technicalSpecs.length > 0 ? technicalSpecs : [createTechnicalSpecRow()],
  };
}

function mapSizeChartToFormFields(sizeChart) {
  if (!sizeChart || typeof sizeChart !== 'object') {
    return {};
  }

  const typeSize = isValidTypeSize(sizeChart?.typeSize) ? sizeChart.typeSize : '';
  const measureColumns = (Array.isArray(sizeChart?.measureColumns) ? sizeChart.measureColumns : [])
    .map((column, index) => {
      const labelUz = String(column?.label?.uz || '').trim();
      const labelRu = String(column?.label?.ru || '').trim();
      const values = Array.isArray(column?.values) ? column.values.map((v) => String(v ?? '')) : [''];
      const isFixed = index === 0 && labelUz === "O'lcham";

      if (isFixed) {
        return {
          ...createFixedSizeMeasureColumn(),
          values: values.length > 0 ? values : [''],
        };
      }

      return {
        ...createMeasureColumnRow(),
        labelUz,
        labelRu,
        values: values.length > 0 ? values : [''],
      };
    });

  const guideImages = (Array.isArray(sizeChart?.guideImages) ? sizeChart.guideImages : []).map(
    (item) => ({
      ...createGuideImageRow(item?.typeSize || typeSize),
      titleUz: String(item?.title?.uz || '').trim(),
      titleRu: String(item?.title?.ru || '').trim(),
      typeSize: isValidTypeSize(item?.typeSize) ? item.typeSize : typeSize,
    }),
  );

  return {
    sizeChartTypeSize: typeSize,
    sizeChartTitleUz: String(sizeChart?.title?.uz || '').trim(),
    sizeChartTitleRu: String(sizeChart?.title?.ru || '').trim(),
    sizeChartInstructionUz: String(sizeChart?.instruction?.uz || '').trim(),
    sizeChartInstructionRu: String(sizeChart?.instruction?.ru || '').trim(),
    sizeChartMeasureColumns:
      measureColumns.length > 0 ? measureColumns : [createFixedSizeMeasureColumn()],
    sizeChartGuideImages: guideImages.length > 0 ? guideImages : [createGuideImageRow(typeSize)],
  };
}

function mapRelatedGroupsToFormFields(relatedGroups) {
  const groups = Array.isArray(relatedGroups) ? relatedGroups : [];
  if (groups.length === 0) return { relatedGroups: [] };

  return {
    relatedGroups: groups.map((group) => ({
      ...createRelatedGroupDraft(),
      localId: createLocalId('related-group'),
      titleUz: String(group?.title?.uz || '').trim(),
      titleRu: String(group?.title?.ru || '').trim(),
      productIds: (Array.isArray(group?.productIds) ? group.productIds : [])
        .map(Number)
        .filter((id) => Number.isFinite(id)),
    })),
  };
}

export function mapSellerProductToFormValues(product) {
  if (!product || typeof product !== 'object') {
    return null;
  }

  const { labelTypes, chegirmaPercent } = extractLabelTypes(product.labels);
  const colors = (Array.isArray(product.colors) ? product.colors : []).map(mapColorToDraft);
  const countries = Array.isArray(product.countries) ? product.countries : [];

  return {
    categoryName: String(product.categoryName || '').trim(),
    titleUz: String(product?.title?.uz || '').trim(),
    titleRu: String(product?.title?.ru || '').trim(),
    price: String(product.price || '').trim(),
    originalPrice: String(product.originalPrice || '').trim(),
    discountUz: String(product?.discount?.uz || '').trim(),
    discountRu: String(product?.discount?.ru || '').trim(),
    video: String(product.video || '').trim(),
    masterCategoryId: product.masterCategoryId != null ? String(product.masterCategoryId) : '',
    category: String(product.category || '').trim(),
    countryCode: String(countries[0] || '').trim(),
    productType: String(product.productType || '').trim(),
    productCountry: String(product.productCountry || '').trim(),
    brandCategories: String(product.brandCategories || '').trim(),
    countriesCategories: String(product.countriesCategories || '').trim(),
    weight: product.weight != null ? String(product.weight) : '',
    labelTypes,
    chegirmaPercent,
    mainImage: String(product.mainImage || product.image || '').trim(),
    thumbnails: (Array.isArray(product.thumbnails) ? product.thumbnails : [])
      .map((path) => String(path || '').trim())
      .filter(Boolean),
    productThumbnailsBackup: [],
    colors,
    sizeStockRows: mapStockMapToSizeRows(product.sizeStock),
    modelStockRows: mapStockMapToVariantRows(product.modelStock, createModelStockRow),
    storageStockRows: mapStockMapToVariantRows(product.storageStock, createStorageStockRow),
    productStockBackup: null,
    descriptionImages: (Array.isArray(product.descriptionImages) ? product.descriptionImages : [])
      .map((path) => String(path || '').trim())
      .filter(Boolean),
    ...mapDescriptionToFormFields(product.description),
    ...mapSizeChartToFormFields(product.sizeChart),
    ...mapRelatedGroupsToFormFields(product.relatedGroups),
  };
}
