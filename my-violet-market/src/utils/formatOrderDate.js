const MONTHS_UZ = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentyabr',
  'oktyabr',
  'noyabr',
  'dekabr',
];

const MONTHS_RU = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

/**
 * @param {string|Date} isoOrDate
 * @param {'uz'|'ru'} lang
 * @returns {string} masalan: "2 fevral" yoki "2 февраля"
 */
export function formatOrderDate(isoOrDate, lang = 'uz') {
  if (!isoOrDate) return '';
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return '';

  const day = d.getDate();
  const monthIndex = d.getMonth();
  const months = lang === 'ru' ? MONTHS_RU : MONTHS_UZ;
  const month = months[monthIndex] || '';
  return `${day} ${month}`;
}
