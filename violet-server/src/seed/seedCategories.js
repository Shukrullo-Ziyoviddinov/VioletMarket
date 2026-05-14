// Davlat kategoriyalari (filterValue = products.countriesCategories bilan mos)
const categoriyCountries = [
    { id: 1, name: { uz: "Xitoy", ru: "Китай" }, image: "img/categoriya-xitoy.jpg", flag: "/img/china bayroq.svg", link: "/category/china", filterValue: "xitoy" },
    { id: 2, name: { uz: "AQSH", ru: "США" }, image: "img/categoriya-aqsh.jpg", flag: "/img/aqsh bayroge.svg", link: "/category/usa", filterValue: "usa" },
    { id: 3, name: { uz: "Turkiya", ru: "Турция" }, image: "img/categoriya-turkiya.jpg", flag: "/img/turkiya b.png", link: "/category/turkey", filterValue: "turkiya" },
    { id: 4, name: { uz: "Koreya", ru: "Корея" }, image: "/img/categoriya-korea.jpg", flag: "/img/korea b.png", link: "/category/korea", filterValue: "koreya" },
    { id: 5, name: { uz: "Yevropa", ru: "Европа" }, image: "img/categoriya-germaniya.jpg", flag: "/img/yevropa b.webp", link: "/category/europe", filterValue: "yevropa" },
  ];
  
  // Brend kategoriyalari (filterValue = products.brandCategories bilan mos; link boshqa bo'lishi mumkin)
const categoriesBrend = [
    { id: 1, name: "Nike", image: "/img/nike-brand.png", link: "/category/nike", filterValue: "nike" },
    { id: 2, name: "Apple", image: "img/apple-brand.png", link: "/category/versace", filterValue: "apple" },
    { id: 3, name: "Puma", image: "/img/puma-brand.png", link: "/category/puma", filterValue: "puma" },
    { id: 4, name: "Zara", image: "/img/zara-brand.png", link: "/category/zara", filterValue: "zara" },
    { id: 5, name: "Huawe", image: "img/Huawei-brand.png", link: "/category/hm", filterValue: "huawe" },
    { id: 6, name: "Gucci", image: "/img/gucci-brand.png", link: "/category/gucci", filterValue: "gucci" },
    { id: 7, name: "Amazon", image: "img/amazon-brand.png", link: "/category/prada", filterValue: "amazon" },
    { id: 8, name: "Adidas", image: "/img/adidas-brand.png", link: "/category/adidas", filterValue: "adidas" },
  ];

module.exports = { categoriyCountries, categoriesBrend };
