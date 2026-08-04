function isBlank(value) {
  return String(value ?? '').trim() === '';
}

function hasQuantityValue(raw) {
  const text = String(raw ?? '').trim();
  if (!text) return false;
  return Number.isFinite(Number(text));
}

function collectIncompleteStockRowErrors(rows, t, quantityMissingKey, labelMissingKey, extraParams = {}) {
  const errors = [];
  const list = Array.isArray(rows) ? rows : [];

  list.forEach((row, index) => {
    const label = String(row?.label || '').trim();
    const hasLabel = Boolean(label);
    const hasQuantity = hasQuantityValue(row?.quantity);

    if (!hasLabel && !hasQuantity) return;

    if (hasLabel && !hasQuantity) {
      errors.push(
        t(quantityMissingKey, {
          ...extraParams,
          index: index + 1,
          label,
        }),
      );
      return;
    }

    if (!hasLabel && hasQuantity) {
      errors.push(
        t(labelMissingKey, {
          ...extraParams,
          index: index + 1,
        }),
      );
    }
  });

  return errors;
}

function collectStockConsistencyErrors(values, t) {
  const errors = [];
  const colors = Array.isArray(values?.colors) ? values.colors : [];

  if (colors.length === 0) {
    errors.push(
      ...collectIncompleteStockRowErrors(
        values?.sizeStockRows,
        t,
        'addProduct.validation.sizeQuantityMissing',
        'addProduct.validation.sizeLabelMissing',
      ),
    );
    errors.push(
      ...collectIncompleteStockRowErrors(
        values?.modelStockRows,
        t,
        'addProduct.validation.modelQuantityMissing',
        'addProduct.validation.modelLabelMissing',
      ),
    );
    errors.push(
      ...collectIncompleteStockRowErrors(
        values?.storageStockRows,
        t,
        'addProduct.validation.storageQuantityMissing',
        'addProduct.validation.storageLabelMissing',
      ),
    );
    return errors;
  }

  colors.forEach((color, colorIndex) => {
    const colorName =
      String(color?.nameUz || '').trim() ||
      String(color?.nameRu || '').trim() ||
      `#${colorIndex + 1}`;

    errors.push(
      ...collectIncompleteStockRowErrors(
        color?.sizeStockRows,
        t,
        'addProduct.validation.colorSizeQuantityMissing',
        'addProduct.validation.colorSizeLabelMissing',
        { colorName, colorIndex: colorIndex + 1 },
      ),
    );
    errors.push(
      ...collectIncompleteStockRowErrors(
        color?.modelStockRows,
        t,
        'addProduct.validation.colorModelQuantityMissing',
        'addProduct.validation.colorModelLabelMissing',
        { colorName, colorIndex: colorIndex + 1 },
      ),
    );
    errors.push(
      ...collectIncompleteStockRowErrors(
        color?.storageStockRows,
        t,
        'addProduct.validation.colorStorageQuantityMissing',
        'addProduct.validation.colorStorageLabelMissing',
        { colorName, colorIndex: colorIndex + 1 },
      ),
    );
  });

  return errors;
}

function validateCreateRequiredFields(values, t) {
  const errors = [];

  if (isBlank(values?.categoryName)) {
    errors.push(t('addProduct.validation.sectionRequired'));
  }

  if (isBlank(values?.titleUz) || isBlank(values?.titleRu)) {
    errors.push(t('addProduct.validation.titleRequired'));
  }

  if (isBlank(values?.price)) {
    errors.push(t('addProduct.validation.priceRequired'));
  }

  const hasMasterCategory =
    !isBlank(values?.masterCategoryId) || !isBlank(values?.category);
  if (!hasMasterCategory) {
    errors.push(t('addProduct.validation.masterCategoryRequired'));
  }

  if (isBlank(values?.productType)) {
    errors.push(t('addProduct.validation.productTypeRequired'));
  }

  if (isBlank(values?.countryCode)) {
    errors.push(t('addProduct.validation.countryCodeRequired'));
  }

  if (isBlank(values?.productCountry)) {
    errors.push(t('addProduct.validation.productCountryRequired'));
  }

  if (isBlank(values?.brandCategories)) {
    errors.push(t('addProduct.validation.brandRequired'));
  }

  if (isBlank(values?.countriesCategories)) {
    errors.push(t('addProduct.validation.countriesCategoryRequired'));
  }

  if (isBlank(values?.weight)) {
    errors.push(t('addProduct.validation.weightRequired'));
  }

  const colors = Array.isArray(values?.colors) ? values.colors : [];
  const mainImage = String(values?.mainImage || '').trim();
  if (colors.length === 0 && !mainImage) {
    errors.push(t('addProduct.validation.mainImageRequired'));
  }

  return errors;
}

export function validateSellerProductForm(values, t, options = {}) {
  const isEditMode = Boolean(options?.isEditMode);
  const errors = [];

  if (!isEditMode) {
    errors.push(...validateCreateRequiredFields(values, t));
  }

  const labelTypes = Array.isArray(values?.labelTypes) ? values.labelTypes : [];
  if (labelTypes.includes('chegirma') && isBlank(values?.chegirmaPercent)) {
    errors.push(t('addProduct.validation.chegirmaPercentRequired'));
  }

  const discountUz = String(values?.discountUz || '').trim();
  const discountRu = String(values?.discountRu || '').trim();
  if ((discountUz && !discountRu) || (!discountUz && discountRu)) {
    errors.push(t('addProduct.validation.discountBothLanguages'));
  }

  const colors = Array.isArray(values?.colors) ? values.colors : [];
  colors.forEach((color, index) => {
    const colorDiscountUz = String(color?.discountUz || '').trim();
    const colorDiscountRu = String(color?.discountRu || '').trim();
    if ((colorDiscountUz && !colorDiscountRu) || (!colorDiscountUz && colorDiscountRu)) {
      errors.push(t('addProduct.validation.colorDiscountBothLanguages', { index: index + 1 }));
    }
  });

  errors.push(...collectStockConsistencyErrors(values, t));

  return errors;
}
