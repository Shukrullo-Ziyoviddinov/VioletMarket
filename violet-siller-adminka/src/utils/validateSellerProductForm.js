export function validateSellerProductForm(values) {
  const errors = [];

  if (!String(values?.categoryName || '').trim()) {
    errors.push("Bo'lim tanlanishi shart");
  }

  if (!String(values?.titleUz || '').trim() || !String(values?.titleRu || '').trim()) {
    errors.push('Sarlavha (UZ va RU) to\'ldirilishi shart');
  }

  if (!String(values?.price || '').trim()) {
    errors.push('Narx to\'ldirilishi shart');
  }

  if (!String(values?.masterCategoryId || '').trim()) {
    errors.push('Mahsulot kategoriyasi tanlanishi shart');
  }

  if (!String(values?.productType || '').trim()) {
    errors.push('Mahsulot turi tanlanishi shart');
  }

  if (!String(values?.countryCode || '').trim()) {
    errors.push('Mahsulot qaysi davlatniki ekanligi tanlanishi shart');
  }

  if (!String(values?.productCountry || '').trim()) {
    errors.push('Ishlab chiqarilgan davlat tanlanishi shart');
  }

  if (!String(values?.brandCategories || '').trim()) {
    errors.push('Brend tanlanishi shart');
  }

  if (!String(values?.countriesCategories || '').trim()) {
    errors.push('Davlat bo\'yicha kategoriya tanlanishi shart');
  }

  if (!String(values?.weight || '').trim()) {
    errors.push('Mahsulot og\'irligi (gramm) kiritilishi shart');
  }

  const colors = Array.isArray(values?.colors) ? values.colors : [];
  const mainImage = String(values?.mainImage || '').trim();

  if (colors.length === 0 && !mainImage) {
    errors.push('Asosiy rasm yuklanishi shart (yoki kamida bitta rang qo\'shing)');
  }

  const labelTypes = Array.isArray(values?.labelTypes) ? values.labelTypes : [];
  if (labelTypes.includes('chegirma') && !String(values?.chegirmaPercent || '').trim()) {
    errors.push('Chegirma belgisi tanlangan — foiz kiritilishi shart');
  }

  const discountUz = String(values?.discountUz || '').trim();
  const discountRu = String(values?.discountRu || '').trim();
  if ((discountUz && !discountRu) || (!discountUz && discountRu)) {
    errors.push('Chegirma matni ikkala tilda ham to\'ldirilishi kerak');
  }

  colors.forEach((color, index) => {
    const colorDiscountUz = String(color?.discountUz || '').trim();
    const colorDiscountRu = String(color?.discountRu || '').trim();
    if ((colorDiscountUz && !colorDiscountRu) || (!colorDiscountUz && colorDiscountRu)) {
      errors.push(`Rang #${index + 1}: chegirma matni ikkala tilda ham to'ldirilishi kerak`);
    }
  });

  return errors;
}
