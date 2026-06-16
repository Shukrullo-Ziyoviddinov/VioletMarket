export const CUSTOMER_STATISTIC_VIEW_OPTIONS = [
  { value: 'historical', label: 'Tarixiy Ma\'lumotlar' },
  { value: 'current', label: 'Joriy ko\'rinish' },
];

export const CUSTOMER_STATISTIC_DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => ({
  value: String(index + 1),
  label: String(index + 1),
}));

export const CUSTOMER_STATISTIC_WEEK_OPTIONS = Array.from({ length: 52 }, (_, index) => ({
  value: String(index + 1),
  label: String(index + 1),
}));

export const CUSTOMER_STATISTIC_MONTH_OPTIONS = [
  { value: '2026-06', label: 'Iyun 2026' },
  { value: '2026-05', label: 'May 2026' },
  { value: '2026-04', label: 'Aprel 2026' },
];

export const CUSTOMER_STATISTIC_DEFAULT_FILTERS = {
  view: 'historical',
  day: '4',
  week: '4',
  month: '2026-06',
};

export const CUSTOMER_STATISTIC_MOCK_METRICS = [
  {
    id: 'registered',
    title: "Ro'yxatdan O'tganlar Ko'p",
    value: '15,200',
    footerLabel: "Oylik o'sish: ",
    footerHighlight: '+12%',
    showChart: true,
  },
  {
    id: 'dau',
    title: 'Kunlik Faol Foydalanuvchilar (DAU)',
    value: '2,100',
    footerLabel: 'Yangi: ',
    footerHighlight: '+5%',
    showChart: false,
  },
  {
    id: 'wau',
    title: 'Haftalik Faol Foydalanuvchilar (WAU)',
    value: '7,500',
    footerLabel: 'Yangi: ',
    footerHighlight: '+8%',
    showChart: false,
  },
  {
    id: 'mau',
    title: 'Oylik Faol Foydalanuvchilar (MAU)',
    value: '14,000',
    footerLabel: 'Yangi: ',
    footerHighlight: '+10%',
    showChart: false,
  },
];
