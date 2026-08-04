export function validateSellerProductForm(values, t) {
  const errors = [];

  if (!String(values?.categoryName || '').trim()) {
    errors.push(t('addProduct.validation.sectionRequired'));
  }

  if (!String(values?.titleUz || '').trim() || !String(values?.titleRu || '').trim()) {
    errors.push(t('addProduct.validation.titleRequired'));
  }

  if (!String(values?.price || '').trim()) {
    errors.push(t('addProduct.validation.priceRequired'));
  }

  const hasMasterCategory =
    String(values?.masterCategoryId ?? '').trim() !== '' ||
    String(values?.category ?? '').trim() !== '';
  if (!hasMasterCategory) {
    errors.push(t('addProduct.validation.masterCategoryRequired'));
  }

  if (!String(values?.productType || '').trim()) {
    errors.push(t('addProduct.validation.productTypeRequired'));
  }

  if (!String(values?.countryCode || '').trim()) {
    errors.push(t('addProduct.validation.countryCodeRequired'));
  }

  if (!String(values?.productCountry || '').trim()) {
    errors.push(t('addProduct.validation.productCountryRequired'));
  }

  if (!String(values?.brandCategories || '').trim()) {
    errors.push(t('addProduct.validation.brandRequired'));
  }

  if (!String(values?.countriesCategories || '').trim()) {
    errors.push(t('addProduct.validation.countriesCategoryRequired'));
  }

  if (!String(values?.weight || '').trim()) {
    errors.push(t('addProduct.validation.weightRequired'));
  }

  const colors = Array.isArray(values?.colors) ? values.colors : [];
  const mainImage = String(values?.mainImage || '').trim();

  if (colors.length === 0 && !mainImage) {
    errors.push(t('addProduct.validation.mainImageRequired'));
  }

  const labelTypes = Array.isArray(values?.labelTypes) ? values.labelTypes : [];
  if (labelTypes.includes('chegirma') && !String(values?.chegirmaPercent || '').trim()) {
    errors.push(t('addProduct.validation.chegirmaPercentRequired'));
  }

  const discountUz = String(values?.discountUz || '').trim();
  const discountRu = String(values?.discountRu || '').trim();
  if ((discountUz && !discountRu) || (!discountUz && discountRu)) {
    errors.push(t('addProduct.validation.discountBothLanguages'));
  }

  colors.forEach((color, index) => {
    const colorDiscountUz = String(color?.discountUz || '').trim();
    const colorDiscountRu = String(color?.discountRu || '').trim();
    if ((colorDiscountUz && !colorDiscountRu) || (!colorDiscountUz && colorDiscountRu)) {
      errors.push(t('addProduct.validation.colorDiscountBothLanguages', { index: index + 1 }));
    }
  });

  return errors;
}
