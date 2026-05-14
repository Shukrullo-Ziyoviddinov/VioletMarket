const footerData = {
    aboutSections: [
      {
        id: 1,
        title: { uz: "Kompaniya haqida", ru: "О компании" },
        items: [
          { text: { uz: "Biz haqimizda", ru: "О нас" } }
        ]
      },
      {
        id: 2,
        title: { uz: "Mijozlarga xizmat", ru: "Клиентам" },
        items: [
          { text: { uz: "Yordam markazi", ru: "Центр помощи" } }
        ]
      },
      {
        id: 3,
        title: { uz: "Yetkazib berish va qaytarish", ru: "Доставка и возврат" },
        items: [
          { text: { uz: "Yetkazib berish va qaytarish", ru: "Доставка и возврат" } }
        ]
      }
    ],
   
    socialMedia: [
      { id: 1, name: "Telegram", icon: "/img/telegram.png", link: "https://t.me/violetmarket" },
      { id: 2, name: "Instagram", icon: "/img/Instagram-logo.png", link: "https://instagram.com/violetmarket" },
      { id: 3, name: "Facebook", icon: "/img/facebook-logo.png", link: "https://facebook.com/violetmarket" },
      { id: 4, name: "YouTube", icon: "/img/youtube-logo.png", link: "https://youtube.com/violetmarket" }
    ],
    appStores: [
      { id: 1, name: "App Store", image: "/img/app%20store%20logo.svg", link: "https://apps.apple.com/app/violetmarket" },
      { id: 2, name: "Google Play", image: "/img/Google_Play-Badge-Logo.wine.svg", link: "https://play.google.com/store/apps/details?id=com.violetmarket" }
    ]
  };

module.exports = { footerData };
