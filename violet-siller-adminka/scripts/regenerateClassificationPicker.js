const fs = require('fs');
const path = require('path');
const { masterCategories } = require('../../violet-server/src/seed/seedMasterCategory');
const { productTypes } = require('../../violet-server/src/seed/seedProductType');

function masterCategoryKey(nameUz) {
  return String(nameUz || '')
    .trim()
    .toLowerCase()
    .replace(/[''`ʻ]/g, '')
    .replace(/\s+/g, '-');
}

const localesDir = path.join(__dirname, '../src/locales');

const enLabels = {
  'sayoxat-uchun-asqotade': 'Travel essentials',
  'sport-va-faol-turmush': 'Sports and active lifestyle',
  'vitaminlar-va-sogliq': 'Vitamins and health',
  'bolalar-tovarlari': "Children's products",
  'gozallik-va-parvarish': 'Beauty and personal care',
  'kanselyariya-tovarlari': 'Stationery',
  kitoblar: 'Books',
  'qizlar-kiyimi': "Girls' clothing",
  'ayollar-kiyimi': "Women's clothing",
  'ayollar-poyabzali': "Women's footwear",
  'ogil-bollar-kiyimlar': "Boys' clothing",
  'erkaklar-poyabzali': "Men's footwear",
  'erkaklar-kiyimi': "Men's clothing",
  'iqlim-texnikasi': 'Climate equipment',
  'gozallik-uchun-texnika': 'Beauty appliances',
  'smart-gadjetlar': 'Smart gadgets',
  aksessuarlar: 'Accessories',
  'maishiy-texnika': 'Home appliances',
  elektronika: 'Electronics',
};

const zhLabels = {
  'sayoxat-uchun-asqotade': '旅行用品',
  'sport-va-faol-turmush': '运动与活跃生活',
  'vitaminlar-va-sogliq': '维生素与健康',
  'bolalar-tovarlari': '儿童用品',
  'gozallik-va-parvarish': '美容护理',
  'kanselyariya-tovarlari': '文具',
  kitoblar: '图书',
  'qizlar-kiyimi': '女童服装',
  'ayollar-kiyimi': '女装',
  'ayollar-poyabzali': '女鞋',
  'ogil-bollar-kiyimlar': '男童服装',
  'erkaklar-poyabzali': '男鞋',
  'erkaklar-kiyimi': '男装',
  'iqlim-texnikasi': '气候设备',
  'gozallik-uchun-texnika': '美容电器',
  'smart-gadjetlar': '智能设备',
  aksessuarlar: '配饰',
  'maishiy-texnika': '家用电器',
  elektronika: '电子产品',
};

const uzMc = {};
const enMc = {};
const zhMc = {};

masterCategories.forEach((row) => {
  const key = masterCategoryKey(row.name.uz);
  uzMc[key] = row.name.uz;
  enMc[key] = enLabels[key] || row.name.uz;
  zhMc[key] = zhLabels[key] || row.name.uz;
});

const ptUz = {};
productTypes.forEach((row) => {
  ptUz[row.code] = row.title;
});

const enFile = JSON.parse(fs.readFileSync(path.join(localesDir, 'classificationPicker.en.json'), 'utf8'));
const zhFile = JSON.parse(fs.readFileSync(path.join(localesDir, 'classificationPicker.zh.json'), 'utf8'));

fs.writeFileSync(
  path.join(localesDir, 'classificationPicker.uz.json'),
  JSON.stringify({ masterCategoryOptions: uzMc, productTypeOptions: ptUz }, null, 2),
);
fs.writeFileSync(
  path.join(localesDir, 'classificationPicker.en.json'),
  JSON.stringify({ masterCategoryOptions: enMc, productTypeOptions: enFile.productTypeOptions }, null, 2),
);
fs.writeFileSync(
  path.join(localesDir, 'classificationPicker.zh.json'),
  JSON.stringify({ masterCategoryOptions: zhMc, productTypeOptions: zhFile.productTypeOptions }, null, 2),
);

console.log('master category keys:', Object.keys(uzMc).length);
