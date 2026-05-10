/**
 * product.json ba'zan JS literal (kalitlar qo'shtirnoqsiz) bo'lib qoladi.
 * Ushbu skript uni RFC JSON qilib yozadi va engArzonlare.js dagi
 * mahsulotlarni (agar JSONda yo'q bo'lsa) qo'shadi.
 *
 * Ishga tushirish: node scripts/normalize-product-json.cjs
 *
 * sizeChart.typeSize — tanlanadigan qiymatlar: src/constants/sizeChartKind.js
 *   (TYPE_SIZE_VALUES). Tarjima: locales da productDetail.sizeChartKind.<qiymat>
 * guideImages[].typeSize — xuddi shu ro'yxatdan (ixtiyoriy; sizeChart.typeSize
 *   ham ishlatiladi). Eski JSON: chartKind / kind hali o'qiladi.
 * guideImages[].src — ixtiyoriy; bo'sh bo'lsa typeSize bo'yicha standart rasm.
 */
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'src', 'data');
const jsonPath = path.join(dataDir, 'product.json');
const engPath = path.join(dataDir, 'engArzonlare.js');

function parseBracketArrayFromFile(filePath) {
  let text = fs.readFileSync(filePath, 'utf8').trim();
  text = text.replace(/\s*;\s*$/, '');
  return Function('"use strict"; return (' + text + ')')();
}

function parseEngArzonlareExport(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('engArzonlare.js: massiv topilmadi');
  }
  const literal = text.slice(start, end + 1);
  return Function('"use strict"; return (' + literal + ')')();
}

const main = parseBracketArrayFromFile(jsonPath);
const eng = parseEngArzonlareExport(engPath);
const ids = new Set(main.map((p) => p.id));
const merged = [...main, ...eng.filter((p) => !ids.has(p.id))];

fs.writeFileSync(jsonPath, JSON.stringify(merged, null, 2) + '\n', 'utf8');
console.log('Yozildi:', jsonPath, '—', merged.length, 'ta mahsulot');
