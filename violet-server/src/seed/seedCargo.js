// Kargo narxlari
const cargoRates = {
    china: {
      name: { uz: "Xitoy kargo", ru: "Китайская доставка" },
      standard: 6, // $6/kg
      express: 9, // $9/kg
      infoCargo: { uz: "Standard 12-18 kunda, express 3-7 kunda yetkaziladi. Xitoydan O'zbekistonga.", ru: "Стандарт 12-18 дней, экспресс 3-7 дней. Из Китая в Узбекистан." }
    },
    usa: {
      name: { uz: "AQSH kargo", ru: "Доставка из США" },
      standard: 8,
      express: 12,
      infoCargo: { uz: "Standard 15-25 kunda, express 5-10 kunda yetkaziladi. AQSHdan O'zbekistonga.", ru: "Стандарт 15-25 дней, экспресс 5-10 дней. Из США в Узбекистан." }
    },
    turkiya: {
      name: { uz: "Turkiya kargo", ru: "Доставка из Турции" },
      standard: 5,
      express: 8,
      infoCargo: { uz: "Standard 10-15 kunda, express 3-7 kunda yetkaziladi. Turkiyadan O'zbekistonga.", ru: "Стандарт 10-15 дней, экспресс 3-7 дней. Из Турции в Узбекистан." }
    },
    korea: {
      name: { uz: "Koreya kargo", ru: "Доставка из Кореи" },
      standard: 7,
      express: 10,
      infoCargo: { uz: "Standard 12-20 kunda, express 4-8 kunda yetkaziladi. Koreyadan O'zbekistonga.", ru: "Стандарт 12-20 дней, экспресс 4-8 дней. Из Кореи в Узбекистан." }
    },
    uzb: {
      name: { uz: "O'zbekiston yetkazish", ru: "Доставка по Узбекистану" },
      infoCargo: { uz: "Qo'shimcha narx yo'q, 2-3 kunda yetkaziladi. Mahsulot o'zbekiston omborida.", ru: "Без доплат, доставка за 2-3 дня. Товар на складе в Узбекистане." }
    }
  };
  
  // Yetkazib berish narxlari (toshkent / viloyat kalitlari)
const deliveryPrices = {
    toshkent: {
      name: { uz: "Toshkent shahri bo'ylab yetkazish", ru: "Доставка по городу Ташкенту" },
      namePricetsh1: { uz: "20 000 so'mgacha", ru: "До 20 000 сум" },
      pricetsh1: 7000,
      namePricetsh2: { uz: "20 000 so'm-50 000 so'm", ru: "20 000 – 50 000 сум" },
      pricetsh2: 5000,
      namePricetsh3: { uz: "50 000 so'mdan", ru: "От 50 000 сум" },
      pricetsh3: 0 // Bepul
    },
    viloyat: {
      name: { uz: "Viloyat bo'ylab yetkazish", ru: "Доставка по регионам" },
      namePricev1: { uz: "20 000 so'mgacha", ru: "До 20 000 сум" },
      pricev1: 20000,
      namePricev2: { uz: "20 000 so'm-50 000 so'm", ru: "20 000 – 50 000 сум" },
      pricev2: 15000,
      namePricev3: { uz: "50 000 so'm-100 000 so'm", ru: "50 000 – 100 000 сум" },
      pricev3: 13000,
      namePricev4: { uz: "100 000 so'm-150 000 so'm", ru: "100 000 – 150 000 сум" },
      pricev4: 10000,
      namePricev5: { uz: "150 000 so'mdan", ru: "От 150 000 сум" },
      pricev5: 0 // Bepul
    }
  };

module.exports = { cargoRates, deliveryPrices };
