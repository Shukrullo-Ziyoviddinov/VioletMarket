import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DropdownPicker from '../DropdownPicker/DropdownPicker';

export default function AddProductSectionField({ value, options, onChange }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const pickerOptions = useMemo(
    () =>
      (Array.isArray(options) ? options : []).map((option) => {
        const optionValue = String(option.value || '');
        return {
          value: optionValue,
          label: t(`addProduct.section.options.${optionValue}`, {
            defaultValue: option.label || optionValue,
          }),
        };
      }),
    [options, t],
  );

  return (
    <section className="add-product-form__card">
      <DropdownPicker
        label={t('addProduct.section.label')}
        hint={t('addProduct.section.hint')}
        required
        mode="single"
        value={value}
        options={pickerOptions}
        placeholder={t('addProduct.section.placeholder')}
        emptyText={t('addProduct.section.emptyText')}
        isOpen={isOpen}
        onToggle={setIsOpen}
        onSelect={onChange}
      />
    </section>
  );
}
