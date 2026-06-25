import React, { useMemo, useState } from 'react';
import DropdownPicker from '../DropdownPicker/DropdownPicker';

export default function AddProductSectionField({ value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const pickerOptions = useMemo(
    () =>
      (Array.isArray(options) ? options : []).map((option) => ({
        value: option.value,
        label: option.label,
      })),
    [options],
  );

  return (
    <section className="add-product-form__card">
      <DropdownPicker
        label="Mahsulot qaysi bo'limda ko'rinsin?"
        hint="Mijoz saytida mahsulot shu bo'lim ostida chiqadi. Faqat bitta bo'lim tanlanadi."
        required
        mode="single"
        value={value}
        options={pickerOptions}
        placeholder="Bo'limni tanlang"
        emptyText="Bo'limlar topilmadi"
        isOpen={isOpen}
        onToggle={setIsOpen}
        onSelect={onChange}
      />
    </section>
  );
}
