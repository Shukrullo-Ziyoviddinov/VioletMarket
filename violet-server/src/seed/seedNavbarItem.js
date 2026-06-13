const navbarItems = [
  {
    title: { uz: "Elektronika Texnika va Aksessuarlar", ru: "Электроника и аксессуары" },
    items: [
      {
        name: { uz: "Elektronika", ru: "Электроника" },
        category: "Elektronika",
        image: "/img/texnika.jpg",
        description: {
          uz: "Batariya kabel va zaryad beruvchi qurilmalar",
          ru: "Батареи, кабели и зарядные устройства",
        },
      },
      {
        name: { uz: "Maishiy texnika", ru: "Бытовая техника" },
        category: "Maishiy texnika",
        image: "/img/main-texnika.png",
        description: {
          uz: "Kirmoshina, blendr, konditsioner, mikrovolnovka pech",
          ru: "Стиральные машины, блендеры, кондиционеры, микроволновки",
        },
      },
      {
        name: { uz: "Aksessuarlar", ru: "Аксессуары" },
        category: "Aksessuarlar",
        image: "/img/Aksessuarlar1.jpg",
        description: {
          uz: "Quloqchin, soat, audio texnikalar",
          ru: "Наушники, часы, аудиотехника",
        },
      },
      {
        name: { uz: "Smart gadjetlar", ru: "Смарт-гаджеты" },
        category: "Smart gadjetlar",
        image: "/img/Smartgadjetlar.jpg",
        description: {
          uz: "Smartfonlar, smart soat, televizorlar",
          ru: "Смартфоны, смарт-часы, телевизоры",
        },
      },
      {
        name: { uz: "Go'zallik uchun texnika", ru: "Техника для красоты" },
        category: "Go'zallik uchun texnika",
        image: "/img/gozalliktexnika.jpg",
        description: { uz: "Soch turmaklash, soch soqol mashinkasi", ru: "Укладка волос, триммеры" },
      },
      {
        name: { uz: "Iqlim texnikasi", ru: "Климатическая техника" },
        category: "Iqlim texnikasi",
        image: "/img/iqlimuchun.jpg",
        description: {
          uz: "Havo sovutgichlar, ventilyatorlar, isitgichlar",
          ru: "Кондиционеры, вентиляторы, обогреватели",
        },
      },
    ],
  },
  {
    title: { uz: "Erkaklar va ayollar uchun kiyimlar", ru: "Одежда для мужчин и женщин" },
    items: [
      {
        name: { uz: "Erkaklar kiyimi", ru: "Мужская одежда" },
        category: "Erkaklar kiyimi",
        image: "/img/categoriyaerkaklarkiyimi.jpeg",
        description: { uz: "Shim, rubashka, futbolka, shapka", ru: "Брюки, рубашки, футболки, шапки" },
      },
      {
        name: { uz: "Erkaklar poyabzali", ru: "Мужская обувь" },
        category: "Erkaklar poyabzali",
        image: "/img/categoriyaerkaklar-krasofka.jfif",
        description: {
          uz: "Krassovkalar, etiklar, botinkalar, kedalar",
          ru: "Кроссовки, туфли, ботинки, кеды",
        },
      },
      {
        name: { uz: "O'g'il bollar kiyimlar", ru: "Одежда для мальчиков" },
        category: "O'g'il bollar kiyimlar",
        image: "/img/ogilbollarkiyimi.jpeg",
        description: { uz: "Krassovkalar, futbolkalar, maykalar", ru: "Кроссовки, футболки, майки" },
      },
      {
        name: { uz: "Ayollar poyabzali", ru: "Женская обувь" },
        category: "Ayollar poyabzali",
        image: "/img/categoriyaayollaroyoqkiyimi.jfif",
        description: {
          uz: "Krassovkalar, kedalar, baletkalar, loferlar",
          ru: "Кроссовки, кеды, балетки, лоферы",
        },
      },
      {
        name: { uz: "Ayollar kiyimi", ru: "Женская одежда" },
        category: "Ayollar kiyimi",
        image: "/img/categoriyaayollarkeyimi.jpg",
        description: { uz: "Shimlar, yubkalar, tonikalar", ru: "Брюки, юбки, блузки" },
      },
      {
        name: { uz: "Qizlar kiyimi", ru: "Одежда для девочек" },
        category: "Qizlar kiyimi",
        image: "/img/qizbollarkiyimi.jpeg",
        description: { uz: "Shimlar, yubkalar, tonikalar, futbolkalar", ru: "Брюки, юбки, блузки, футболки" },
      },
    ],
  },
  {
    title: { uz: "Har xil turdagi mahsulotlar", ru: "Разные товары" },
    items: [
      {
        name: { uz: "Kitoblar", ru: "Книги" },
        category: "Kitoblar",
        image: "/img/categoriyaktoblar.jpg",
        description: {
          uz: "Diniy kitoblar, badiiy kitoblar, sovg'a nashrlari",
          ru: "Религиозные, художественные книги, подарочные издания",
        },
      },
      {
        name: { uz: "Kanselyariya tovarlari", ru: "Канцелярия" },
        category: "Kanselyariya tovarlari",
        image: "/img/kanselyariya.jpg",
        description: {
          uz: "Yozuv qurollari, qog'oz mahsulotlari, chizmachilik qurollari",
          ru: "Письменные принадлежности, бумага, чертёжные инструменты",
        },
      },
      {
        name: { uz: "Go'zallik va parvarish", ru: "Красота и уход" },
        category: "Go'zallik va parvarish",
        image: "/img/kasmetika.webp",
        description: { uz: "Makyaj, yuz parvarishi, korea kosmetikasi", ru: "Макияж, уход за кожей, корейская косметика" },
      },
      {
        name: { uz: "Bolalar tovarlari", ru: "Товары для детей" },
        category: "Bolalar tovarlari",
        image: "/img/uyinchoqlar.png",
        description: { uz: "O'yinchoqlar, bolalar xonasi, sovg'alar", ru: "Игрушки, детская комната, подарки" },
      },
      {
        name: { uz: "Vitaminlar va sog'liq", ru: "Товары для детей" },
        category: "Vitaminlar va sog'liq",
        image: "/img/uyinchoqlar.png",
        description: { uz: "Vitaminlar orginal mahsulotla sog'leq uchun", ru: "Игрушки, детская комната, подарки" },
      },
      {
        name: { uz: "Sport va Faol turmush", ru: "Товары для детей" },
        category: "Sport va Faol turmush",
        image: "/img/uyinchoqlar.png",
        description: {
          uz: "Sport va Faol turmush uchun xarhil turdage mahsulotlar",
          ru: "Игрушки, детская комната, подарки",
        },
      },
      {
        name: { uz: "Sayoxat uchun asqotade", ru: "Товары для детей" },
        category: "Sayoxat uchun asqotade",
        image: "/img/uyinchoqlar.png",
        description: { uz: "Sayoxat uchun mahsulotlar", ru: "Игрушки, детская комната, подарки" },
      },
    ],
  },
];

module.exports = { navbarItems };
