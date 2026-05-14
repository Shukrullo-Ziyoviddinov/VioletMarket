/**
 * violet-server/src/seed/seedProduct.js ba'zan noto'g'ri JS literal bo'lib qolishi mumkin.
 * Ushbu skript uni RFC JSON massiv sifatida qayta yozadi (fayl `[ ... ]` ko'rinishida qoladi).
 *
 * Ishga tushirish: my-violet-market papkasidan: node scripts/normalize-product-json.cjs
 *
 * sizeChart.typeSize — tanlanadigan qiymatlar: src/constants/sizeChartKind.js
 *   (TYPE_SIZE_VALUES). Tarjima: locales da productDetail.sizeChartKind.<qiymat>
 * guideImages[].typeSize — xuddi shu ro'yxatdan (ixtiyoriy; sizeChart.typeSize
 *   ham ishlatiladi). Eski JSON: chartKind / kind hali o'qiladi.
 * guideImages[].src — sxema rasmi (PNG/JPG/SVG yo'l); bo'sh bo'lsa typeSize bo'yicha
 *   standart: img/size-body-guide.png | size-pants-guide.png | size-foot-guide.png
 *
 * policy.blocks (ixtiyoriy) — mahsulot siyosati; bo'lmasa API: GET /api/default-product-policy.
 *   icon: package | truck | refresh | chat | credit-card (src/utils/productPolicy.js)
 *   title, text: { uz, ru }; divider: true/false; paymentIcons?: [{ src, alt }]
 */
const fs = require('fs');
const path = require('path');

const productsPath = path.join(
  __dirname,
  '..',
  '..',
  'violet-server',
  'src',
  'seed',
  'seedProduct.js'
);

function parseBracketArrayFromFile(filePath) {
  let text = fs.readFileSync(filePath, 'utf8').trim();
  text = text.replace(/\s*;\s*$/, '');
  return Function('"use strict"; return (' + text + ')')();
}

if (!fs.existsSync(productsPath)) {
  console.error('Topilmadi:', productsPath);
  process.exit(1);
}

const main = parseBracketArrayFromFile(productsPath);
const out = JSON.stringify(main, null, 2) + '\n';
fs.writeFileSync(productsPath, out, 'utf8');
console.log('Yozildi:', productsPath, '—', main.length, 'ta mahsulot');
