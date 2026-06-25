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

  return (
    <section className="add-product-form__card">
      <DropdownPicker
        label="Mahsulot qaysi davlatniki?"
        hint="Mahsulot qaysi davlatga tegishli va qaysi davlatdan mijozgacha yuborilishini bildiradi. Faqat bitta davlat tanlanadi. Ro'yxat admin paneldagi «Mahsulot hududi» bo'limidan olinadi."
        required
        mode="single"
        value={value}
        options={pickerOptions}
        placeholder="Davlatni tanlang"
        emptyText="Davlatlar topilmadi"
        isOpen={isOpen}
        onToggle={setIsOpen}
        onSelect={onChange}
      />
    </section>
  );
}
