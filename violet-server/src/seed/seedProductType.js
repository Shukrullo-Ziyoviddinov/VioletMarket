const productTypes = [
  // Elektronika va Texnika
  { code: "smartphones", title: "Smartfonlar, telefonlar", group: "Elektronika va Texnika" },
  { code: "laptops_computers", title: "Noutbuklar, kompyuterlar", group: "Elektronika va Texnika" },
  {
    code: "accessories",
    title: "Aksessuarlar (g'iloflar, zaryadlovchilar, quloqchinlar)",
    group: "Elektronika va Texnika",
  },
  {
    code: "smart_watches",
    title: "Smart soatlar va fitnes bilaguzuklar",
    group: "Elektronika va Texnika",
  },
  {
    code: "tv_audio",
    title: "Televizorlar, kalonkalar va audio tizimlar",
    group: "Elektronika va Texnika",
  },
  {
    code: "home_appliances",
    title: "Uy va oshxona uchun maishiy texnika",
    group: "Elektronika va Texnika",
  },

  // Kiyim-kechak va Poyabzal
  { code: "t_shirts", title: "Futbolkalar, maykalar", group: "Kiyim-kechak va Poyabzal" },
  { code: "pants", title: "Shimlar, jinsilar, shortilar", group: "Kiyim-kechak va Poyabzal" },
  { code: "dresses", title: "Ko'ylaklar (ayollar uchun)", group: "Kiyim-kechak va Poyabzal" },
  { code: "outerwear", title: "Kurtka, palto, jaket", group: "Kiyim-kechak va Poyabzal" },
  { code: "footwear", title: "Krassovka, tufli, etik", group: "Kiyim-kechak va Poyabzal" },
  {
    code: "socks_underwear",
    title: "Paypoqlar, trus, mayka",
    group: "Kiyim-kechak va Poyabzal",
  },

  // Go'zallik va Salomatlik
  { code: "creams_tonics", title: "Krem, tonik", group: "Go'zallik va Salomatlik" },
  { code: "makeup", title: "Pomada, tush, tonal krem", group: "Go'zallik va Salomatlik" },
  { code: "hair_care", title: "Shampun, konditsioner, niqob", group: "Go'zallik va Salomatlik" },
  { code: "perfumes", title: "Atirlar, tualet suvlari", group: "Go'zallik va Salomatlik" },

  // Uy va Ro'zg'or buyumlari
  { code: "furniture", title: "Stul, stol, divan", group: "Uy va Ro'zg'or buyumlari" },
  { code: "kitchenware", title: "Tarelka, piyola", group: "Uy va Ro'zg'or buyumlari" },
  {
    code: "bedding",
    title: "Ko'rpa-yostiqlar, choyshablar, sochiqlar",
    group: "Uy va Ro'zg'or buyumlari",
  },
  {
    code: "home_decor",
    title: "Gullar, shamlar, rasmlar, yoritgichlar",
    group: "Uy va Ro'zg'or buyumlari",
  },

  // Boshqa ommabop toifalar
  { code: "toys", title: "O'yinchoq", group: "Boshqa ommabop toifalar" },
  { code: "sportswear", title: "Sport kiyimi", group: "Boshqa ommabop toifalar" },
  { code: "books", title: "Kitob", group: "Boshqa ommabop toifalar" },

  // Legacy seed kodlari (mavjud mahsulotlar uchun)
  { code: "shim", title: "Shim", group: "Legacy" },
  { code: "kupalnik", title: "Kupalnik", group: "Legacy" },
  { code: "xudi", title: "Xudi", group: "Legacy" },
  { code: "yozgi_keyim", title: "Yozgi kiyim", group: "Legacy" },
  { code: "shippak", title: "Shippak", group: "Legacy" },
  { code: "qolqop", title: "Qo'lqop", group: "Legacy" },
  { code: "chexol", title: "Chexol", group: "Legacy" },
  { code: "soat", title: "Soat", group: "Legacy" },
  { code: "telifon", title: "Telefon", group: "Legacy" },
  { code: "rubashka", title: "Rubashka", group: "Legacy" },
  { code: "yupka", title: "Yupka", group: "Legacy" },
  { code: "krossovka", title: "Krossovka", group: "Legacy" },
  { code: "kepka", title: "Kepka", group: "Legacy" },
  { code: "makasino", title: "Makasino", group: "Legacy" },
  { code: "quloqchin", title: "Quloqchin", group: "Legacy" },
  { code: "audio", title: "Audio", group: "Legacy" },
  { code: "aksessuar", title: "Aksessuar", group: "Legacy" },
  { code: "sport", title: "Sport", group: "Legacy" },
  { code: "oyoq_kiyim", title: "Oyoq kiyim", group: "Legacy" },
  { code: "gadjet", title: "Gadjet", group: "Legacy" },
  { code: "kiyim", title: "Kiyim", group: "Legacy" },
  { code: "uy", title: "Uy", group: "Legacy" },
  { code: "dekor", title: "Dekor", group: "Legacy" },
  { code: "oyin", title: "O'yin", group: "Legacy" },
  { code: "kanselyariya", title: "Kanselyariya", group: "Legacy" },
  { code: "avto", title: "Avto", group: "Legacy" },
  { code: "bog", title: "Bog'", group: "Legacy" },
  { code: "krem", title: "Krem", group: "Legacy" },
  { code: "makyaj", title: "Makyaj", group: "Legacy" },
  { code: "niqob", title: "Niqob", group: "Legacy" },
  { code: "serum", title: "Serum", group: "Legacy" },
  { code: "parvarish", title: "Parvarish", group: "Legacy" },
  { code: "elektronika", title: "Elektronika", group: "Legacy" },
  { code: "texnika", title: "Texnika", group: "Legacy" },
  { code: "kitob", title: "Kitob", group: "Legacy" },
  { code: "zaryadlagich", title: "Zaryadlagich", group: "Legacy" },
  { code: "kabel", title: "Kabel", group: "Legacy" },
  { code: "powerbank", title: "Powerbank", group: "Legacy" },
  { code: "batareya", title: "Batareya", group: "Legacy" },
  { code: "oyinchoq", title: "O'yinchoq", group: "Legacy" },
  { code: "sovga", title: "Sovg'a", group: "Legacy" },
];

module.exports = { productTypes };
