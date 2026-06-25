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
    subscriberCount: 10,
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
