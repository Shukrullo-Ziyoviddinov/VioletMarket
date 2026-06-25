import React, { useMemo, useState } from 'react';
import DropdownPicker from '../DropdownPicker/DropdownPicker';

export default function AddProductCountriesField({ value, shippingCountries, onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const pickerOptions = useMemo(
    () =>
      (Array.isArray(shippingCountries) ? shippingCountries : []).map((row) => ({
        value: row.code,
        label: row?.name?.uz || row.code,
        subLabel: row?.name?.ru || '',
      })),
    [shippingCountries],
  );

  const handleToggleCode = (code) => {
    const normalized = String(code);
    const current = Array.isArray(value) ? value.map(String) : [];
    const exists = current.includes(normalized);

    if (exists) {
      onChange(current.filter((item) => item !== normalized));
      return;
    }

    onChange([...current, normalized]);
  };

  return (
    <section className="add-product-form__card">
      <DropdownPicker
        label="Mahsulot hududi (yetkazib berish mamlakati)"
        hint="Mahsulot qaysi mamlakatdan yetkazib berilishini tanlang. Bir nechta hudud tanlash mumkin. Ro'yxat admin paneldagi «Mahsulot hududi» bo'limidan olinadi."
        required
        mode="multiple"
        value={value}
        options={pickerOptions}
        placeholder="Hududlarni tanlang"
        emptyText="Mahsulot hududlari topilmadi"
        isOpen={isOpen}
        onToggle={setIsOpen}
        onToggleOption={handleToggleCode}
      />
    </section>
  );
}
