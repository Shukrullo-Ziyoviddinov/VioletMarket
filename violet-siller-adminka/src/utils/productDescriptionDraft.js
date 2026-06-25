export const PRODUCT_ABOUT_TITLE = {
  uz: 'Mahsulot haqida',
  ru: 'О товаре',
};

export function createMainFeatureRow() {
  return {
    localId: `mf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    titleUz: '',
    titleRu: '',
    textUz: '',
    textRu: '',
  };
}

export function createTechnicalSpecRow() {
  return {
    localId: `ts-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    labelUz: '',
    labelRu: '',
    valueUz: '',
    valueRu: '',
  };
}

export function getInitialDescriptionFormFields() {
  return {
    descriptionInfoUz: '',
    descriptionInfoRu: '',
    mainFeaturesHeadingUz: '',
    mainFeaturesHeadingRu: '',
    mainFeatures: [createMainFeatureRow()],
    technicalHeadingUz: '',
    technicalHeadingRu: '',
    technicalSpecs: [createTechnicalSpecRow()],
  };
}

function hasI18nContent(pair) {
  return Boolean(String(pair?.uz || '').trim() || String(pair?.ru || '').trim());
}

export function buildProductDescriptionArray(values) {
  const mainFeatures = (Array.isArray(values?.mainFeatures) ? values.mainFeatures : [])
    .map((row) => ({
      title: {
        uz: String(row?.titleUz || '').trim(),
        ru: String(row?.titleRu || '').trim(),
      },
      text: {
        uz: String(row?.textUz || '').trim(),
        ru: String(row?.textRu || '').trim(),
      },
    }))
    .filter((row) => hasI18nContent(row.title) || hasI18nContent(row.text));

  const technicalSpecs = (Array.isArray(values?.technicalSpecs) ? values.technicalSpecs : [])
    .map((row) => ({
      label: {
        uz: String(row?.labelUz || '').trim(),
        ru: String(row?.labelRu || '').trim(),
      },
      value: {
        uz: String(row?.valueUz || '').trim(),
        ru: String(row?.valueRu || '').trim(),
      },
    }))
    .filter((row) => hasI18nContent(row.label) || hasI18nContent(row.value));

  return [
    {
      description: { ...PRODUCT_ABOUT_TITLE },
      info: {
        uz: String(values?.descriptionInfoUz || '').trim(),
        ru: String(values?.descriptionInfoRu || '').trim(),
      },
      mainFeaturesHeading: {
        uz: String(values?.mainFeaturesHeadingUz || '').trim(),
        ru: String(values?.mainFeaturesHeadingRu || '').trim(),
      },
      mainFeatures,
      technicalHeading: {
        uz: String(values?.technicalHeadingUz || '').trim(),
        ru: String(values?.technicalHeadingRu || '').trim(),
      },
      technicalSpecs,
    },
  ];
}
