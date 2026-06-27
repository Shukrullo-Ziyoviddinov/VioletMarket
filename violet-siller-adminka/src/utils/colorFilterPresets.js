export const COLOR_FILTER_OPTIONS = [
  { value: 'Black', label: 'Qora', subLabel: 'Black' },
  { value: 'White', label: 'Oq', subLabel: 'White' },
  { value: 'Gray', label: 'Kulrang', subLabel: 'Gray' },
  { value: 'DarkGray', label: "To'q kulrang", subLabel: 'DarkGray' },
  { value: 'Silver', label: 'Kumush', subLabel: 'Silver' },
  { value: 'Red', label: 'Qizil', subLabel: 'Red' },
  { value: 'Maroon', label: "To'q qizil", subLabel: 'Maroon' },
  { value: 'Pink', label: 'Pushti', subLabel: 'Pink' },
  { value: 'Orange', label: "To'q sariq", subLabel: 'Orange' },
  { value: 'Yellow', label: 'Sariq', subLabel: 'Yellow' },
  { value: 'Green', label: 'Yashil', subLabel: 'Green' },
  { value: 'Blue', label: "Ko'k", subLabel: 'Blue' },
  { value: 'Navy', label: "To'q ko'k", subLabel: 'Navy' },
  { value: 'Purple', label: 'Binafsha', subLabel: 'Purple' },
  { value: 'Brown', label: 'Jigarrang', subLabel: 'Brown' },
  { value: 'Beige', label: 'Bej', subLabel: 'Beige' },
  { value: 'Cream', label: 'Krem', subLabel: 'Cream' },
  { value: 'Multicolor', label: 'Rang-barang', subLabel: 'Multicolor' },
];

const COLOR_FILTER_SET = new Set(COLOR_FILTER_OPTIONS.map((item) => item.value));

export function isValidColorFilter(value) {
  return COLOR_FILTER_SET.has(String(value || '').trim());
}
