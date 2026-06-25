export const SIZE_COLUMN_FIXED_LABEL = {
  uz: "O'lcham",
  ru: 'Размер',
};

export const TYPE_SIZE_OPTIONS = [
  { value: 'footwear', label: 'Oyoq kiyimi', subLabel: 'footwear' },
  { value: 'upper_body', label: 'Tana kiyimi', subLabel: 'upper_body' },
  { value: 'pants', label: 'Shim / pastki kiyim', subLabel: 'pants' },
];

const TYPE_SIZE_SET = new Set(TYPE_SIZE_OPTIONS.map((item) => item.value));

export function isValidTypeSize(value) {
  return TYPE_SIZE_SET.has(String(value || '').trim());
}

function createLocalId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createFixedSizeMeasureColumn() {
  return {
    localId: 'fixed-size-column',
    isFixedLabel: true,
    labelUz: SIZE_COLUMN_FIXED_LABEL.uz,
    labelRu: SIZE_COLUMN_FIXED_LABEL.ru,
    values: [''],
  };
}

export function createMeasureColumnRow() {
  return {
    localId: createLocalId('measure-col'),
    isFixedLabel: false,
    labelUz: '',
    labelRu: '',
    values: [''],
  };
}

export function createGuideImageRow(typeSize = '') {
  return {
    localId: createLocalId('guide-img'),
    typeSize: String(typeSize || '').trim(),
    titleUz: '',
    titleRu: '',
  };
}

export function getInitialSizeChartFormFields() {
  return {
    sizeChartTypeSize: '',
    sizeChartTitleUz: '',
    sizeChartTitleRu: '',
    sizeChartInstructionUz: '',
    sizeChartInstructionRu: '',
    sizeChartMeasureColumns: [createFixedSizeMeasureColumn()],
    sizeChartGuideImages: [createGuideImageRow()],
  };
}

function normalizeValuesList(values) {
  return (Array.isArray(values) ? values : [])
    .map((value) => String(value ?? '').trim())
    .filter(Boolean);
}

export function buildSizeChartPayload(values) {
  const typeSize = String(values?.sizeChartTypeSize || '').trim();
  if (!isValidTypeSize(typeSize)) {
    return null;
  }

  const measureColumns = (Array.isArray(values?.sizeChartMeasureColumns)
    ? values.sizeChartMeasureColumns
    : []
  )
    .map((column) => ({
      label: {
        uz: column.isFixedLabel
          ? SIZE_COLUMN_FIXED_LABEL.uz
          : String(column?.labelUz || '').trim(),
        ru: column.isFixedLabel
          ? SIZE_COLUMN_FIXED_LABEL.ru
          : String(column?.labelRu || '').trim(),
      },
      values: normalizeValuesList(column?.values),
    }))
    .filter((column) => column.values.length > 0);

  const guideImages = (Array.isArray(values?.sizeChartGuideImages) ? values.sizeChartGuideImages : [])
    .map((item) => {
      const itemTypeSize = isValidTypeSize(item?.typeSize) ? item.typeSize : typeSize;
      const titleUz = String(item?.titleUz || '').trim();
      const titleRu = String(item?.titleRu || '').trim();
      if (!titleUz && !titleRu) return null;

      return {
        typeSize: itemTypeSize,
        title: {
          uz: titleUz,
          ru: titleRu,
        },
      };
    })
    .filter(Boolean);

  const payload = {
    typeSize,
    title: {
      uz: String(values?.sizeChartTitleUz || '').trim(),
      ru: String(values?.sizeChartTitleRu || '').trim(),
    },
    instruction: {
      uz: String(values?.sizeChartInstructionUz || '').trim(),
      ru: String(values?.sizeChartInstructionRu || '').trim(),
    },
    measureColumns,
    guideImages,
  };

  const hasContent =
    payload.title.uz ||
    payload.title.ru ||
    payload.instruction.uz ||
    payload.instruction.ru ||
    measureColumns.length > 0 ||
    guideImages.length > 0;

  return hasContent ? payload : { typeSize };
}
