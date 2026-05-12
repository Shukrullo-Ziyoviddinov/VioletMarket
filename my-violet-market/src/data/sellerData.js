/**
 * Sotuvchilar ro'yxati. Mahsulotda sellerId shu yeridagi id bilan bog'lanadi.
 */
export const sellers = [
  {
    id: 'violet',
    name: { uz: 'Violet market', ru: 'Violet market' },
    description: {
      uz: "Biz O'zbekistondagi omborimizdan fashion va texnika tovarlarini taklif qilamiz. Sifat va mijozga e'tibor — asosiy ustuvorliklarimiz.",
      ru: 'Мы предлагаем товары fashion и техники со склада в Узбекистане. Качество и внимание к клиенту — наш приоритет.',
    },
    logo: 'img/vm logo.jpg',
    /** Demo: boshlang'ich obunachilar (obuna tugmasi +1 ko'rsatadi) */
    subscriberCount: 10,
  },
];

export const getSellerById = (id) => sellers.find((s) => s.id === id);
