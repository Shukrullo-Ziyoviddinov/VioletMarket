import React, { useMemo, useState } from 'react';
import DropdownPicker from '../DropdownPicker/DropdownPicker';

function formatFilterLabel(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function FilterDropdownField({
  fieldKey,
  openKey,
  onOpenKeyChange,
  label,
  hint,
  required = false,
  value,
  options,
  placeholder,
  emptyText,
  onSelect,
}) {
  return (
    <div className="add-product-form__field">
      <DropdownPicker
        label={label}
        hint={hint}
        required={required}
        mode="single"
        value={value}
        options={options}
        placeholder={placeholder}
        emptyText={emptyText}
        isOpen={openKey === fieldKey}
        onToggle={(open) => onOpenKeyChange(open ? fieldKey : '')}
        onSelect={onSelect}
      />
    </div>
  );
}

export default function AddProductClassificationFields({
  values,
  productTypes,
  filterValues,
  onChange,
}) {
  const [openKey, setOpenKey] = useState('');

  const productTypeOptions = useMemo(
    () =>
      (Array.isArray(productTypes) ? productTypes : []).map((row) => ({
        value: row.code,
        label: row.title || row.code,
        subLabel: row.group || '',
      })),
    [productTypes],
  );

  const countryFilterOptions = useMemo(
    () =>
      (Array.isArray(filterValues) ? filterValues : [])
        .filter((item) => item.type === 'country')
        .map((item) => ({
          value: item.filterValue,
          label: formatFilterLabel(item.filterValue),
        })),
    [filterValues],
  );

  const brandFilterOptions = useMemo(
    () =>
      (Array.isArray(filterValues) ? filterValues : [])
        .filter((item) => item.type === 'brand')
        .map((item) => ({
          value: item.filterValue,
          label: formatFilterLabel(item.filterValue),
        })),
    [filterValues],
  );

  const setField = (key) => (nextValue) => {
    onChange({ ...values, [key]: nextValue });
  };

  return (
    <section className="add-product-form__card">
      <h3 className="add-product-form__card-title">Mahsulot klassifikatsiyasi</h3>

      <FilterDropdownField
        fieldKey="productType"
        openKey={openKey}
        onOpenKeyChange={setOpenKey}
        label="Mahsulot turi"
        hint="Mahsulot qaysi turga kirishini tanlang. Ro'yxat admin paneldagi «Mahsulot turlari» bo'limidan olinadi."
        required
        value={values.productType}
        options={productTypeOptions}
        placeholder="Mahsulot turini tanlang"
        emptyText="Mahsulot turlari topilmadi"
        onSelect={setField('productType')}
      />

      <FilterDropdownField
        fieldKey="productCountry"
        openKey={openKey}
        onOpenKeyChange={setOpenKey}
        label="Ishlab chiqarilgan davlat (Made in)"
        hint="Mahsulot qaysi davlatda ishlab chiqarilganini bildiradi. Faqat bitta davlat tanlanadi."
        required
        value={values.productCountry}
        options={countryFilterOptions}
        placeholder="Davlatni tanlang"
        emptyText="Davlatlar topilmadi"
        onSelect={setField('productCountry')}
      />

      <FilterDropdownField
        fieldKey="brandCategories"
        openKey={openKey}
        onOpenKeyChange={setOpenKey}
        label="Brend"
        hint="Mahsulot qaysi brendga tegishli ekanini tanlang. Ro'yxat admin paneldagi filter qiymatlaridan olinadi."
        required
        value={values.brandCategories}
        options={brandFilterOptions}
        placeholder="Brendni tanlang"
        emptyText="Brendlar topilmadi"
        onSelect={setField('brandCategories')}
      />

      <FilterDropdownField
        fieldKey="countriesCategories"
        openKey={openKey}
        onOpenKeyChange={setOpenKey}
        label="Davlat bo'yicha kategoriya"
        hint="Mahsulot qaysi davlat kategoriyasiga mos kelishini tanlang. Katalog filtri uchun ishlatiladi."
        required
        value={values.countriesCategories}
        options={countryFilterOptions}
        placeholder="Kategoriyani tanlang"
        emptyText="Kategoriyalar topilmadi"
        onSelect={setField('countriesCategories')}
      />
    </section>
  );
}
