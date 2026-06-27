import { isValidColorFilter } from './colorFilterPresets';

function createLocalId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createSizeStockRow(label = '', quantity = '') {
  return {
    localId: createLocalId('size-stock'),
    label: String(label || ''),
    quantity: quantity === '' || quantity == null ? '' : String(quantity),
  };
}

export function createModelStockRow(label = '', quantity = '', price = '', originalPrice = '') {
  return {
    localId: createLocalId('model-stock'),
    label: String(label || ''),
    quantity: quantity === '' || quantity == null ? '' : String(quantity),
    price: String(price || ''),
    originalPrice: String(originalPrice || ''),
  };
}

export function createColorDraft() {
  return {
    localId: createLocalId('color'),
    nameUz: '',
    nameRu: '',
    colorFilter: '',
    sizeStockRows: [createSizeStockRow()],
    modelStockRows: [],
    price: '',
    originalPrice: '',
    discountUz: '',
    discountRu: '',
    mainImage: '',
    thumbnails: [],
  };
}

export function getInitialColorsFormFields() {
  return {
    mainImage: '',
    thumbnails: [],
    productThumbnailsBackup: [],
    colors: [],
  };
}

/**
 * Ranglar qo'shilganda tashqi thumbnails yashiriladi, lekin o'chirilmaydi.
 * Barcha ranglar olib tashlanganda oldingi thumbnails qayta tiklanadi.
 */
export function applyColorsChange(values, nextColors) {
  const prevColors = Array.isArray(values?.colors) ? values.colors : [];
  const prevHadColors = prevColors.length > 0;
  const nextHasColors = nextColors.length > 0;

  const currentThumbnails = Array.isArray(values?.thumbnails) ? values.thumbnails : [];
  let thumbnails = currentThumbnails;
  let productThumbnailsBackup = Array.isArray(values?.productThumbnailsBackup)
    ? values.productThumbnailsBackup
    : [];

  if (!prevHadColors && nextHasColors && currentThumbnails.length > 0) {
    productThumbnailsBackup = [...currentThumbnails];
  }

  if (prevHadColors && !nextHasColors) {
    if (productThumbnailsBackup.length > 0) {
      thumbnails = [...productThumbnailsBackup];
    }
    productThumbnailsBackup = [];
  }

  return {
    ...values,
    colors: nextColors,
    thumbnails,
    productThumbnailsBackup,
  };
}

function buildSizeStockObject(rows) {
  const result = {};

  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const label = String(row?.label || '').trim();
    const quantity = Number(row?.quantity);
    if (!label || !Number.isFinite(quantity)) return;
    result[label] = { quantity: Math.max(0, Math.floor(quantity)) };
  });

  return result;
}

function buildModelStockObject(rows) {
  const result = {};

  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const label = String(row?.label || '').trim();
    const quantity = Number(row?.quantity);
    if (!label || !Number.isFinite(quantity)) return;

    const entry = { quantity: Math.max(0, Math.floor(quantity)) };
    const price = String(row?.price || '').trim();
    const originalPrice = String(row?.originalPrice || '').trim();
    if (price) entry.price = price;
    if (originalPrice) entry.originalPrice = originalPrice;
    result[label] = entry;
  });

  return result;
}

function buildOptionalDiscount(discountUz, discountRu) {
  const uz = String(discountUz || '').trim();
  const ru = String(discountRu || '').trim();
  if (!uz && !ru) return undefined;
  return { uz, ru };
}

function buildColorPayload(color) {
  const nameUz = String(color?.nameUz || '').trim();
  const nameRu = String(color?.nameRu || '').trim();
  const colorFilter = String(color?.colorFilter || '').trim();
  const sizeStock = buildSizeStockObject(color?.sizeStockRows);
  const modelStock = buildModelStockObject(color?.modelStockRows);
  const price = String(color?.price || '').trim();
  const originalPrice = String(color?.originalPrice || '').trim();
  const mainImage = String(color?.mainImage || '').trim();
  const thumbnails = (Array.isArray(color?.thumbnails) ? color.thumbnails : [])
    .map((path) => String(path || '').trim())
    .filter(Boolean);
  const discount = buildOptionalDiscount(color?.discountUz, color?.discountRu);

  const hasContent =
    nameUz ||
    nameRu ||
    colorFilter ||
    price ||
    originalPrice ||
    mainImage ||
    thumbnails.length > 0 ||
    Object.keys(sizeStock).length > 0 ||
    Object.keys(modelStock).length > 0;

  if (!hasContent) return null;

  const payload = {
    name: { uz: nameUz, ru: nameRu },
    colorFilter: isValidColorFilter(colorFilter) ? colorFilter : colorFilter,
  };

  if (Object.keys(sizeStock).length > 0) {
    payload.sizeStock = sizeStock;
  }

  if (Object.keys(modelStock).length > 0) {
    payload.modelStock = modelStock;
  }

  if (price) payload.price = price;
  if (originalPrice) payload.originalPrice = originalPrice;
  if (discount) payload.discount = discount;
  if (mainImage) payload.mainImage = mainImage;
  if (thumbnails.length > 0) payload.thumbnails = thumbnails;

  return payload;
}

export function buildColorsPayload(values) {
  const colors = (Array.isArray(values?.colors) ? values.colors : [])
    .map(buildColorPayload)
    .filter(Boolean);

  const mainImage = String(values?.mainImage || '').trim();
  const hasColors = colors.length > 0;
  const thumbnails = hasColors
    ? []
    : (Array.isArray(values?.thumbnails) ? values.thumbnails : [])
        .map((path) => String(path || '').trim())
        .filter(Boolean);

  return {
    mainImage,
    image: mainImage || undefined,
    thumbnails,
    colors,
  };
}
