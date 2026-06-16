const STATISTICS_TIME_ZONE = 'Asia/Tashkent';

function getTashkentYmd(date = new Date()) {
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone: STATISTICS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

  const [year, month, day] = formatted.split('-').map(Number);
  return { year, month, day };
}

function getIsoWeekFromYmd(year, month, day) {
  const target = new Date(Date.UTC(year, month - 1, day));
  const dayNum = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((target - yearStart) / (24 * 60 * 60 * 1000)) + 1) / 7);
  return week;
}

export function getDefaultCustomerStatisticFilters(date = new Date()) {
  const { year, month, day } = getTashkentYmd(date);
  return {
    day: String(day),
    week: String(getIsoWeekFromYmd(year, month, day)),
    month: `${year}-${String(month).padStart(2, '0')}`,
  };
}
