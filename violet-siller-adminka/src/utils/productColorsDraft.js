import { isValidColorFilter } from './colorFilterPresets';
import {
  createSizeStockRow,
  createModelStockRow,
  createStorageStockRow,
  buildSizeStockObject,
  buildModelStockObject,
  buildStorageStockObject,
  buildProductStockPayload,
  getInitialProductStockFormFields,
  hasProductStockFormData,
  snapshotProductStock,
  restoreProductStockFromBackup,
} from './productStockDraft';

function createLocalId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export {
  createSizeStockRow,
  createModelStockRow,
  createStorageStockRow,
  getInitialProductStockFormFields,
};

export function colorHasVariantStockData(color) {
  const hasRows = (rows) =>
    (Array.isArray(rows) ? rows : []).some((row) => {
      const label = String(row?.label || '').trim();
      const quantity = Number(row?.quantity);
      return label && Number.isFinite(quantity);
    });

  return (
    hasRows(color?.sizeStockRows) ||
    hasRows(color?.modelStockRows) ||
    hasRows(color?.storageStockRows)
  );
}

export function createColorDraft() {
  return {
    localId: createLocalId('color'),
    nameUz: '',
    nameRu: '',
    colorFilter: '',
    quantity: '',
    sizeStockRows: [createSizeStockRow()],
    modelStockRows: [],
    storageStockRows: [],
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
    ...getInitialProductStockFormFields(),
  };
}

/**
 * Ranglar qo'shilganda tashqi thumbnails va ombor yashiriladi, lekin o'chirilmaydi.
 * Barcha ranglar olib tashlanganda oldingi ma'lumotlar qayta tiklanadi.
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

  let sizeStockRows = Array.isArray(values?.sizeStockRows) ? values.sizeStockRows : [];
  let modelStockRows = Array.isArray(values?.modelStockRows) ? values.modelStockRows : [];
  let storageStockRows = Array.isArray(values?.storageStockRows) ? values.storageStockRows : [];
  let productStockBackup = values?.productStockBackup ?? null;

  if (!prevHadColors && nextHasColors && currentThumbnails.length > 0) {
    productThumbnailsBackup = [...currentThumbnails];
  }

  if (!prevHadColors && nextHasColors && hasProductStockFormData(values)) {
    productStockBackup = snapshotProductStock(values);
  }

  if (prevHadColors && !nextHasColors) {
    if (productThumbnailsBackup.length > 0) {
      thumbnails = [...productThumbnailsBackup];
    }
    productThumbnailsBackup = [];

    const restoredStock = restoreProductStockFromBackup(productStockBackup);
    sizeStockRows = restoredStock.sizeStockRows;
    modelStockRows = restoredStock.modelStockRows;
    storageStockRows = restoredStock.storageStockRows;
    productStockBackup = restoredStock.productStockBackup;
  }

  return {
    ...values,
    colors: nextColors,
    thumbnails,
    productThumbnailsBackup,
    sizeStockRows,
    modelStockRows,
    storageStockRows,
    productStockBackup,
  };
}

function buildOptionalDiscount(discountUz, discountRu) {
  const uz = String(discountUz || '').trim();
  const ru = String(discountRu || '').trim();
  if (!uz || !ru) return undefined;
  return { uz, ru };
}

function buildColorPayload(color) {
  const nameUz = String(color?.nameUz || '').trim();
  const nameRu = String(color?.nameRu || '').trim();
  const colorFilter = String(color?.colorFilter || '').trim();
  const sizeStock = buildSizeStockObject(color?.sizeStockRows);
  const modelStock = buildModelStockObject(color?.modelStockRows);
  const storageStock = buildStorageStockObject(color?.storageStockRows);
  const hasVariantStock =
    Object.keys(sizeStock).length > 0 ||
    Object.keys(modelStock).length > 0 ||
    Object.keys(storageStock).length > 0;
  const colorQuantity = Number(color?.quantity);
  const hasColorQuantity = !hasVariantStock && Number.isFinite(colorQuantity);
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
    hasColorQuantity ||
    Object.keys(sizeStock).length > 0 ||
    Object.keys(modelStock).length > 0 ||
    Object.keys(storageStock).length > 0;

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

  if (Object.keys(storageStock).length > 0) {
    payload.storageStock = storageStock;
  }

  if (hasColorQuantity) {
    payload.quantity = Math.max(0, Math.floor(colorQuantity));
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

  const stockPayload = hasColors ? {} : buildProductStockPayload(values);

  return {
    mainImage,
    image: mainImage || undefined,
    thumbnails,
    colors,
    ...stockPayload,
  };
}
