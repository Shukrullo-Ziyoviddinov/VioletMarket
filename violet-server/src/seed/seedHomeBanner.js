const homeBannerData = [
    {
      type: "image",
      src: { uz: "img/img1.jpg", ru: "img/img1.jpg" },
      clickable: true,
      category: "Erkaklar kiyimi"
    },
    {
      type: "image",
      src: { uz: "img/img2.jpg", ru: "img/img2.jpg" },
      clickable: false
    },
    {
      type: "image",
      src: { uz: "img/img3.jpg", ru: "img/img3.jpg" },
      clickable: true,
      category: "Ayollar kiyimi",
      countriesCategories: "yevropa",
      brandCategories: "puma"
    },
    {
      type: "image",
      src: { uz: "img/home-new1.jpg", ru: "img/home-new1.jpg" },
      clickable: true,
      category: "Smart gadjetlar"
    }
  ];

module.exports = { homeBannerData };
