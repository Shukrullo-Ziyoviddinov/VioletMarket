function addDaysToDateKey(dateKey, days) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  const y = next.getUTCFullYear();
  const m = next.getUTCMonth() + 1;
  const d = next.getUTCDate();
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function getIsoWeekStartKey(year, week) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const firstWeekMonday = new Date(jan4);
  firstWeekMonday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1));
  const result = new Date(firstWeekMonday);
  result.setUTCDate(firstWeekMonday.getUTCDate() + (week - 1) * 7);
  const y = result.getUTCFullYear();
  const m = result.getUTCMonth() + 1;
  const d = result.getUTCDate();
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function resolveIntlLocale(language) {
  const lang = String(language || 'uz').split('-')[0];
  if (lang === 'en') return 'en-US';
  if (lang === 'zh') return 'zh-CN';
  return 'uz-UZ';
}

function parseDateKey(dateKey) {
  const [year, month, day] = String(dateKey).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

export function formatSellerStatisticsScopeLabel(period, filters, language = 'uz') {
  const locale = resolveIntlLocale(language);

  if (period === 'day' && filters?.day) {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Tashkent',
    }).format(parseDateKey(filters.day));
  }

  if (period === 'month' && filters?.month) {
    const [year, month] = String(filters.month).split('-').map(Number);
    return new Intl.DateTimeFormat(locale, {
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Tashkent',
    }).format(new Date(Date.UTC(year, month - 1, 1, 12, 0, 0)));
  }

  if (period === 'week' && filters?.week) {
    const match = /^(\d{4})-W(\d{1,2})$/.exec(String(filters.week));
    if (!match) return String(filters.week);

    const isoYear = Number(match[1]);
    const week = Number(match[2]);
    const weekStartKey = getIsoWeekStartKey(isoYear, week);
    const weekEndKey = addDaysToDateKey(weekStartKey, 6);
    const startLabel = new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      timeZone: 'Asia/Tashkent',
    }).format(parseDateKey(weekStartKey));
    const endLabel = new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Tashkent',
    }).format(parseDateKey(weekEndKey));
    return `${startLabel} - ${endLabel}`;
  }

  return '';
}
