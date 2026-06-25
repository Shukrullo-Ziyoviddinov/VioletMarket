import React, { useMemo, useState } from 'react';
import DropdownPicker from '../DropdownPicker/DropdownPicker';
import './AddProductClassificationFields.css';

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
  className = '',
}) {
  return (
    <div className={`add-product-form__field add-product-classification__field ${className}`.trim()}>
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
  masterCategories,
  productTypes,
  filterValues,
  shippingCountries,
  onChange,
}) {
  const [openKey, setOpenKey] = useState('');

  const masterCategoryOptions = useMemo(
    () =>
      (Array.isArray(masterCategories) ? masterCategories : []).map((row) => ({
        value: String(row.id),
        label: row?.name?.uz || String(row.id),
        subLabel: row?.name?.ru || '',
      })),
    [masterCategories],
  );

  const productTypeOptions = useMemo(
    () =>
      (Array.isArray(productTypes) ? productTypes : []).map((row) => ({
        value: row.code,
        label: row.title || row.code,
        subLabel: row.group || '',
      })),
    [productTypes],
  );

  const shippingCountryOptions = useMemo(
    () =>
      (Array.isArray(shippingCountries) ? shippingCountries : []).map((row) => ({
        value: row.code,
        label: row?.name?.uz || row.code,
        subLabel: row?.name?.ru || '',
      })),
    [shippingCountries],
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

  const handleMasterCategorySelect = (selectedId) => {
    const matched = (Array.isArray(masterCategories) ? masterCategories : []).find(
      (item) => String(item.id) === String(selectedId),
    );

    onChange({
      ...values,
      masterCategoryId: String(selectedId),
      category: matched?.name?.uz || '',
    });
  };

  return (
    <section className="add-product-form__card add-product-classification">
      <h3 className="add-product-form__card-title">Mahsulot kategoriyasi va klassifikatsiyasi</h3>

      <div className="add-product-classification__row add-product-classification__row--3">
        <FilterDropdownField
          fieldKey="masterCategoryId"
          openKey={openKey}
          onOpenKeyChange={setOpenKey}
          label="Mahsulot kategoriyasi"
          hint="Mahsulot qaysi asosiy kategoriyaga tegishli ekanini tanlang."
          required
          value={values.masterCategoryId}
          options={masterCategoryOptions}
          placeholder="Kategoriyani tanlang"
          emptyText="Kategoriyalar topilmadi"
          onSelect={handleMasterCategorySelect}
          className="add-product-classification__field--compact"
        />

        <FilterDropdownField
          fieldKey="productType"
          openKey={openKey}
          onOpenKeyChange={setOpenKey}
          label="Mahsulot turi"
          hint="Mahsulot qaysi turga kirishini tanlang."
          required
          value={values.productType}
          options={productTypeOptions}
          placeholder="Mahsulot turini tanlang"
          emptyText="Mahsulot turlari topilmadi"
          onSelect={setField('productType')}
          className="add-product-classification__field--compact"
        />

        <FilterDropdownField
          fieldKey="countryCode"
          openKey={openKey}
          onOpenKeyChange={setOpenKey}
          label="Mahsulot qaysi davlatniki?"
          hint="Mahsulot qaysi davlatga tegishli va qaysi davlatdan mijozgacha yuborilishini bildiradi."
          required
          value={values.countryCode}
          options={shippingCountryOptions}
          placeholder="Davlatni tanlang"
          emptyText="Davlatlar topilmadi"
          onSelect={setField('countryCode')}
          className="add-product-classification__field--compact"
        />
      </div>

      <div className="add-product-classification__row add-product-classification__row--3">
        <FilterDropdownField
          fieldKey="productCountry"
          openKey={openKey}
          onOpenKeyChange={setOpenKey}
          label="Ishlab chiqarilgan davlat (Made in)"
          hint="Mahsulot qaysi davlatda ishlab chiqarilganini bildiradi."
          required
          value={values.productCountry}
          options={countryFilterOptions}
          placeholder="Davlatni tanlang"
          emptyText="Davlatlar topilmadi"
          onSelect={setField('productCountry')}
          className="add-product-classification__field--compact"
        />

        <FilterDropdownField
          fieldKey="brandCategories"
          openKey={openKey}
          onOpenKeyChange={setOpenKey}
          label="Brend"
          hint="Mahsulot qaysi brendga tegishli ekanini tanlang."
          required
          value={values.brandCategories}
          options={brandFilterOptions}
          placeholder="Brendni tanlang"
          emptyText="Brendlar topilmadi"
          onSelect={setField('brandCategories')}
          className="add-product-classification__field--compact"
        />

        <FilterDropdownField
          fieldKey="countriesCategories"
          openKey={openKey}
          onOpenKeyChange={setOpenKey}
          label="Davlat bo'yicha kategoriya"
          hint="Mahsulot qaysi davlat kategoriyasiga mos kelishini tanlang."
          required
          value={values.countriesCategories}
          options={countryFilterOptions}
          placeholder="Kategoriyani tanlang"
          emptyText="Kategoriyalar topilmadi"
          onSelect={setField('countriesCategories')}
          className="add-product-classification__field--compact"
        />
      </div>
    </section>
  );
}
