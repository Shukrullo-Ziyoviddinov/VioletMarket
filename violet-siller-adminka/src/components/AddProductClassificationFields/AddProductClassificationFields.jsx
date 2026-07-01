import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      <h3 className="add-product-form__card-title">{t('addProduct.classification.title')}</h3>

      <div className="add-product-classification__row add-product-classification__row--3">
        <FilterDropdownField
          fieldKey="masterCategoryId"
          openKey={openKey}
          onOpenKeyChange={setOpenKey}
          label={t('addProduct.classification.masterCategoryLabel')}
          hint={t('addProduct.classification.masterCategoryHint')}
          required
          value={values.masterCategoryId}
          options={masterCategoryOptions}
          placeholder={t('addProduct.classification.masterCategoryPlaceholder')}
          emptyText={t('addProduct.classification.masterCategoryEmpty')}
          onSelect={handleMasterCategorySelect}
          className="add-product-classification__field--compact"
        />

        <FilterDropdownField
          fieldKey="productType"
          openKey={openKey}
          onOpenKeyChange={setOpenKey}
          label={t('addProduct.classification.productTypeLabel')}
          hint={t('addProduct.classification.productTypeHint')}
          required
          value={values.productType}
          options={productTypeOptions}
          placeholder={t('addProduct.classification.productTypePlaceholder')}
          emptyText={t('addProduct.classification.productTypeEmpty')}
          onSelect={setField('productType')}
          className="add-product-classification__field--compact"
        />

        <FilterDropdownField
          fieldKey="countryCode"
          openKey={openKey}
          onOpenKeyChange={setOpenKey}
          label={t('addProduct.classification.countryCodeLabel')}
          hint={t('addProduct.classification.countryCodeHint')}
          required
          value={values.countryCode}
          options={shippingCountryOptions}
          placeholder={t('addProduct.classification.countryCodePlaceholder')}
          emptyText={t('addProduct.classification.countryCodeEmpty')}
          onSelect={setField('countryCode')}
          className="add-product-classification__field--compact"
        />
      </div>

      <div className="add-product-classification__row add-product-classification__row--3">
        <FilterDropdownField
          fieldKey="productCountry"
          openKey={openKey}
          onOpenKeyChange={setOpenKey}
          label={t('addProduct.classification.productCountryLabel')}
          hint={t('addProduct.classification.productCountryHint')}
          required
          value={values.productCountry}
          options={countryFilterOptions}
          placeholder={t('addProduct.classification.productCountryPlaceholder')}
          emptyText={t('addProduct.classification.productCountryEmpty')}
          onSelect={setField('productCountry')}
          className="add-product-classification__field--compact"
        />

        <FilterDropdownField
          fieldKey="brandCategories"
          openKey={openKey}
          onOpenKeyChange={setOpenKey}
          label={t('addProduct.classification.brandLabel')}
          hint={t('addProduct.classification.brandHint')}
          required
          value={values.brandCategories}
          options={brandFilterOptions}
          placeholder={t('addProduct.classification.brandPlaceholder')}
          emptyText={t('addProduct.classification.brandEmpty')}
          onSelect={setField('brandCategories')}
          className="add-product-classification__field--compact"
        />

        <FilterDropdownField
          fieldKey="countriesCategories"
          openKey={openKey}
          onOpenKeyChange={setOpenKey}
          label={t('addProduct.classification.countriesCategoryLabel')}
          hint={t('addProduct.classification.countriesCategoryHint')}
          required
          value={values.countriesCategories}
          options={countryFilterOptions}
          placeholder={t('addProduct.classification.countriesCategoryPlaceholder')}
          emptyText={t('addProduct.classification.countriesCategoryEmpty')}
          onSelect={setField('countriesCategories')}
          className="add-product-classification__field--compact"
        />
      </div>
    </section>
  );
}
