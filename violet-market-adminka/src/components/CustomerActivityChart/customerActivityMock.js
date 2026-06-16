export const CUSTOMER_ACTIVITY_FILTER_OPTIONS = [
  { value: 'all', label: 'Hammasi' },
  { value: 'dau', label: 'DAU' },
  { value: 'wau', label: 'WAU' },
  { value: 'mau', label: 'MAU' },
];

export const CUSTOMER_ACTIVITY_SERIES = [
  {
    key: 'dau',
    label: 'DAU',
    stroke: '#6d28d9',
    fill: '#a78bfa',
    legendColor: '#c4b5fd',
  },
  {
    key: 'wau',
    label: 'WAU',
    stroke: '#8b5cf6',
    fill: '#a78bfa',
    legendColor: '#8b5cf6',
  },
  {
    key: 'mau',
    label: 'MAU',
    stroke: '#0d9488',
    fill: '#2dd4bf',
    legendColor: '#14b8a6',
  },
];

export const CUSTOMER_ACTIVITY_MOCK_DATA = [
  { label: '1 iyun', dau: 2100, wau: 4200, mau: 1100 },
  { label: '15 iyun', dau: 5600, wau: 6800, mau: 2100 },
  { label: '27 iyun', dau: 8600, wau: 6200, mau: 2800 },
  { label: '30 iyun', dau: 6400, wau: 4800, mau: 1900 },
  { label: '1 iyun', dau: 7900, wau: 5600, mau: 2400 },
  { label: '3 iyun', dau: 10800, wau: 7300, mau: 3100 },
  { label: '5 iyun', dau: 9400, wau: 6600, mau: 2700 },
];

export const CUSTOMER_ACTIVITY_Y_TICKS = [0, 2000, 6000, 9000, 12000];
