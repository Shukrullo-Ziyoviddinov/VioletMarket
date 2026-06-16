const MONTH_NAMES_UZ = [
  'Yanvar',
  'Fevral',
  'Mart',
  'Aprel',
  'May',
  'Iyun',
  'Iyul',
  'Avgust',
  'Sentabr',
  'Oktabr',
  'Noyabr',
  'Dekabr',
];

export const CUSTOMER_STATISTIC_DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => ({
  value: String(index + 1),
  label: String(index + 1),
}));

export const CUSTOMER_STATISTIC_WEEK_OPTIONS = Array.from({ length: 52 }, (_, index) => ({
  value: String(index + 1),
  label: String(index + 1),
}));

export const CUSTOMER_STATISTIC_MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => {
  const now = new Date();
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index, 1));
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const value = `${year}-${String(month).padStart(2, '0')}`;
  return {
    value,
    label: `${MONTH_NAMES_UZ[month - 1]} ${year}`,
  };
});

const NOW = new Date();
const CURRENT_MONTH = `${NOW.getUTCFullYear()}-${String(NOW.getUTCMonth() + 1).padStart(2, '0')}`;

export const CUSTOMER_STATISTIC_DEFAULT_FILTERS = {
  day: String(NOW.getUTCDate()),
  week: '1',
  month: CURRENT_MONTH,
};

export const CUSTOMER_STATISTIC_MOCK_METRICS = [
  {
    id: 'registered',
    title: "Ro'yxatdan o'tgan foydalanuvchilar",
    value: '15,200',
    footerLabel: "O'tgan oydan: ",
    footerHighlight: '+12%',
    footerTone: 'positive',
    showChart: true,
  },
  {
    id: 'dau',
    title: 'Kunlik Faol Foydalanuvchilar (DAU)',
    value: '2,100',
    footerLabel: "O'tgan kundan: ",
    footerHighlight: '+5%',
    footerTone: 'positive',
    showChart: false,
  },
  {
    id: 'wau',
    title: 'Haftalik Faol Foydalanuvchilar (WAU)',
    value: '7,500',
    footerLabel: "O'tgan haftadan: ",
    footerHighlight: '+8%',
    footerTone: 'positive',
    showChart: false,
  },
  {
    id: 'mau',
    title: 'Oylik Faol Foydalanuvchilar (MAU)',
    value: '14,000',
    footerLabel: "O'tgan oydan: ",
    footerHighlight: '+10%',
    footerTone: 'positive',
    showChart: false,
  },
];
