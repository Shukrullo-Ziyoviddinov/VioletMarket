/**
 * Boshlang'ich demo sotuvchi — faqat seed uchun.
 * Production da tasdiqlangan sotuvchilar MongoDB da saqlanadi:
 *   - seller_accounts      → do'kon profili (id, name, logo, description)
 *   - seller_registrations → kirish (email, parol, shopId, status)
 */
const sellers = [
  {
    id: 'violet',
    name: { uz: 'Violet market', ru: 'Violet market' },
    description: {
      uz: "Biz O'zbekistondagi omborimizdan fashion va texnika tovarlarini taklif qilamiz. Sifat va mijozga e'tibor — asosiy ustuvorliklarimiz.",
      ru: 'Мы предлагаем товары fashion и техники со склада в Узбекистане. Качество и внимание к клиенту — наш приоритет.',
    },
    sellerCountry: "uzb",
    logo: 'img/vm logo.jpg',
    address: 'Toshkent shahri, Yunusobod tumani, Amir Temur ko‘chasi',
    coordinates: [41.311151, 69.279737],
    sellerPhone: '+998901112233',
    subscriberCount: 10,
    status: 'active',
  },
  {
    id: 'vilianora-market',
    name: { uz: 'vilianora market', ru: 'vilianora market' },
    description: {
      uz: 'Xitoy omboridan yetkazib beriladigan demo sotuvchi. Cargo Standard/Express demo uchun.',
      ru: 'Демо-продавец со склада в Китае. Для демо Standard/Express карго.',
    },
    sellerCountry: 'china',
    logo: 'img/vm logo.jpg',
    address: 'Guangzhou, China',
    coordinates: [23.1291, 113.2644],
    sellerPhone: '+8613800138000',
    subscriberCount: 5,
    status: 'active',
  },
];

/** Siller ruyxatdan utish collection kurinishi */
const sellerRegistrations = [
  {
    firstName: 'Shukrullo',
    lastName: 'Ziyoviddinov',
    email: 'abdusalomovjovox@gmail.com',
    shopId: 'violet',
    shopDisplayName: 'Violet market',
    sellerCountry: 'uzb',
    demoPassword: 'ShZ03_ZH04',
    emailVerified: true,
    status: 'approved',
  },
];

function getSellerById(id) {
  return sellers.find((s) => s.id === id);
}

module.exports = { sellers, sellerRegistrations, getSellerById };