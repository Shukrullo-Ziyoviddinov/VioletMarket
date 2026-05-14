const navbarItems = [
    {
      id: 1,
      title: { uz: "Elektronika Texnika va Aksessuarlar", ru: "Электроника и аксессуары" },
      items: [
        { id: 101, name: { uz: "Elektronika", ru: "Электроника" }, image: "/img/texnika.jpg", description: { uz: "Batariya kabel va zaryad beruvchi qurilmalar", ru: "Батареи, кабели и зарядные устройства" } },
        { id: 102, name: { uz: "Maishiy texnika", ru: "Бытовая техника" }, image: "/img/main-texnika.png", description: { uz: "Kirmoshina, blendr, konditsioner, mikrovolnovka pech", ru: "Стиральные машины, блендеры, кондиционеры, микроволновки" } },
        { id: 103, name: { uz: "Aksessuarlar", ru: "Аксессуары" }, image: "/img/Aksessuarlar1.jpg", description: { uz: "Quloqchin, soat, audio texnikalar", ru: "Наушники, часы, аудиотехника" } },
        { id: 104, name: { uz: "Smart gadjetlar", ru: "Смарт-гаджеты" }, image: "/img/Smartgadjetlar.jpg", description: { uz: "Smartfonlar, smart soat, televizorlar", ru: "Смартфоны, смарт-часы, телевизоры" } },
        { id: 105, name: { uz: "Go'zallik uchun texnika", ru: "Техника для красоты" }, image: "/img/gozalliktexnika.jpg", description: { uz: "Soch turmaklash, soch soqol mashinkasi", ru: "Укладка волос, триммеры" } },
        { id: 106, name: { uz: "Iqlim texnikasi", ru: "Климатическая техника" }, image: "/img/iqlimuchun.jpg", description: { uz: "Havo sovutgichlar, ventilyatorlar, isitgichlar", ru: "Кондиционеры, вентиляторы, обогреватели" } }
      ]
    },
    {
      id: 2,
      title: { uz: "Erkaklar va ayollar uchun kiyimlar", ru: "Одежда для мужчин и женщин" },
      items: [
        { id: 201, name: { uz: "Erkaklar kiyimi", ru: "Мужская одежда" }, image: "/img/categoriyaerkaklarkiyimi.jpeg", description: { uz: "Shim, rubashka, futbolka, shapka", ru: "Брюки, рубашки, футболки, шапки" } },
        { id: 202, name: { uz: "Erkaklar poyabzali", ru: "Мужская обувь" }, image: "/img/categoriyaerkaklar-krasofka.jfif", description: { uz: "Krassovkalar, etiklar, botinkalar, kedalar", ru: "Кроссовки, туфли, ботинки, кеды" } },
        { id: 203, name: { uz: "O'g'il bollar kiyimlar", ru: "Одежда для мальчиков" }, image: "/img/ogilbollarkiyimi.jpeg", description: { uz: "Krassovkalar, futbolkalar, maykalar", ru: "Кроссовки, футболки, майки" } },
        { id: 204, name: { uz: "Ayollar poyabzali", ru: "Женская обувь" }, image: "/img/categoriyaayollaroyoqkiyimi.jfif", description: { uz: "Krassovkalar, kedalar, baletkalar, loferlar", ru: "Кроссовки, кеды, балетки, лоферы" } },
        { id: 205, name: { uz: "Ayollar kiyimi", ru: "Женская одежда" }, image: "/img/categoriyaayollarkeyimi.jpg", description: { uz: "Shimlar, yubkalar, tonikalar", ru: "Брюки, юбки, блузки" } },
        { id: 206, name: { uz: "Qizlar kiyimi", ru: "Одежда для девочек" }, image: "/img/qizbollarkiyimi.jpeg", description: { uz: "Shimlar, yubkalar, tonikalar, futbolkalar", ru: "Брюки, юбки, блузки, футболки" } }
      ]
    },
    {
      id: 3,
      title: { uz: "Har xil turdagi mahsulotlar", ru: "Разные товары" },
      items: [
        { id: 301, name: { uz: "Kitoblar", ru: "Книги" }, image: "/img/categoriyaktoblar.jpg", description: { uz: "Diniy kitoblar, badiiy kitoblar, sovg'a nashrlari", ru: "Религиозные, художественные книги, подарочные издания" } },
        { id: 302, name: { uz: "Kanselyariya tovarlari", ru: "Канцелярия" }, image: "/img/kanselyariya.jpg", description: { uz: "Yozuv qurollari, qog'oz mahsulotlari, chizmachilik qurollari", ru: "Письменные принадлежности, бумага, чертёжные инструменты" } },
        { id: 303, name: { uz: "Go'zallik va parvarish", ru: "Красота и уход" }, image: "/img/kasmetika.webp", description: { uz: "Makyaj, yuz parvarishi, korea kosmetikasi", ru: "Макияж, уход за кожей, корейская косметика" } },
        { id: 304, name: { uz: "Bolalar tovarlari", ru: "Товары для детей" }, image: "/img/uyinchoqlar.png", description: { uz: "O'yinchoqlar, bolalar xonasi, sovg'alar", ru: "Игрушки, детская комната, подарки" } },
        { id: 305, name: { uz: "Vitaminlar va sog'liq", ru: "Товары для детей" }, image: "/img/uyinchoqlar.png", description: { uz: "Vitaminlar orginal mahsulotla sog'leq uchun", ru: "Игрушки, детская комната, подарки" } },
        { id: 306, name: { uz: "Sport va Faol turmush", ru: "Товары для детей" }, image: "/img/uyinchoqlar.png", description: { uz: "Sport va Faol turmush uchun xarhil turdage mahsulotlar", ru: "Игрушки, детская комната, подарки" } },
        { id: 307, name: { uz: "Sayoxat uchun asqotade", ru: "Товары для детей" }, image: "/img/uyinchoqlar.png", description: { uz: "Sayoxat uchun mahsulotlar", ru: "Игрушки, детская комната, подарки" } },

      ]
    }
  ];

module.exports = { navbarItems };
