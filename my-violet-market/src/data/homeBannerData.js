/**
 * Banner: type "image", src — majburiy (uz/ru).
 * clickable: false — oddiy reklama, bosilganda hech narsa bo'lmaydi.
 * clickable: true — bosilsa ProductPage ga filtrlangan mahsulotlar bilan o'tadi.
 * Asosiy filter: category (navbar kategoriya nomi) — majburiy.
 * Ixtiyoriy: countriesCategories (davlat filterValue), brandCategories (brend filterValue).
 */
export const homeBannerData = [
  {
    id: 1,
    type: "image",
    src: { uz: "img/img1.jpg", ru: "img/img1.jpg" },
    clickable: true,
    category: "Erkaklar kiyimi"
  },
  {
    id: 2,
    type: "image",
    src: { uz: "img/img2.jpg", ru: "img/img2.jpg" },
    clickable: false
  },
  {
    id: 3,
    type: "image",
    src: { uz: "img/img3.jpg", ru: "img/img3.jpg" },
    clickable: true,
    category: "Ayollar kiyimi",
    countriesCategories: "yevropa",
    brandCategories: "puma"
  },
  {
    id: 4,
    type: "image",
    src: { uz: "img/home-new1.jpg", ru: "img/home-new1.jpg" },
    clickable: true,
    category: "Smart gadjetlar"
  }
];
