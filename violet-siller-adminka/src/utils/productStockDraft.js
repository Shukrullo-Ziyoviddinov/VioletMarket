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

export function createStorageStockRow(label = '', quantity = '', price = '', originalPrice = '') {
  return {
    localId: createLocalId('storage-stock'),
    label: String(label || ''),
    quantity: quantity === '' || quantity == null ? '' : String(quantity),
    price: String(price || ''),
    originalPrice: String(originalPrice || ''),
  };
}

export function getInitialProductStockFormFields() {
  return {
    sizeStockRows: [createSizeStockRow()],
    modelStockRows: [],
    storageStockRows: [],
    productStockBackup: null,
  };
}

function hasStockRows(rows) {
  return (Array.isArray(rows) ? rows : []).some((row) => {
    const label = String(row?.label || '').trim();
    const quantity = Number(row?.quantity);
    return label && Number.isFinite(quantity);
  });
}

export function hasProductStockFormData(values) {
  return (
    hasStockRows(values?.sizeStockRows) ||
    hasStockRows(values?.modelStockRows) ||
    hasStockRows(values?.storageStockRows)
  );
}

export function buildSizeStockObject(rows) {
  const result = {};

  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const label = String(row?.label || '').trim();
    const quantity = Number(row?.quantity);
    if (!label || !Number.isFinite(quantity)) return;
    result[label] = { quantity: Math.max(0, Math.floor(quantity)) };
  });

  return result;
}

export function buildLabeledStockObject(rows) {
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

export function buildModelStockObject(rows) {
  return buildLabeledStockObject(rows);
}

export function buildStorageStockObject(rows) {
  return buildLabeledStockObject(rows);
}

export function buildProductStockPayload(values) {
  const sizeStock = buildSizeStockObject(values?.sizeStockRows);
  const modelStock = buildModelStockObject(values?.modelStockRows);
  const storageStock = buildStorageStockObject(values?.storageStockRows);
  const payload = {};

  if (Object.keys(sizeStock).length > 0) payload.sizeStock = sizeStock;
  if (Object.keys(modelStock).length > 0) payload.modelStock = modelStock;
  if (Object.keys(storageStock).length > 0) payload.storageStock = storageStock;

  return payload;
}

function cloneStockRows(rows, fallbackRowFactory) {
  const list = Array.isArray(rows) ? rows : [];
  if (list.length === 0) {
    return fallbackRowFactory ? [fallbackRowFactory()] : [];
  }
  return list.map((row) => ({ ...row }));
}

export function snapshotProductStock(values) {
  return {
    sizeStockRows: cloneStockRows(values?.sizeStockRows, createSizeStockRow),
    modelStockRows: cloneStockRows(values?.modelStockRows),
    storageStockRows: cloneStockRows(values?.storageStockRows),
  };
}

export function restoreProductStockFromBackup(backup) {
  if (!backup) {
    return getInitialProductStockFormFields();
  }

  return {
    sizeStockRows:
      Array.isArray(backup.sizeStockRows) && backup.sizeStockRows.length > 0
        ? cloneStockRows(backup.sizeStockRows)
        : [createSizeStockRow()],
    modelStockRows: cloneStockRows(backup.modelStockRows),
    storageStockRows: cloneStockRows(backup.storageStockRows),
    productStockBackup: null,
  };
}
