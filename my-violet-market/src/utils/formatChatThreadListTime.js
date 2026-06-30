const UZ_TIMEZONE = 'Asia/Tashkent';

function getDayStartInTz(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  const day = Number(parts.find((p) => p.type === 'day')?.value);
  return Date.UTC(year, month - 1, day);
}

export function formatChatThreadListTime(isoOrDate, lang = 'uz') {
  const date = new Date(isoOrDate);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const dayDiff = Math.round(
    (getDayStartInTz(now, UZ_TIMEZONE) - getDayStartInTz(date, UZ_TIMEZONE)) / 86400000,
  );

  if (dayDiff === 0) {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: UZ_TIMEZONE,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  }

  if (dayDiff === 1) {
    return lang === 'ru' ? 'Вчера' : 'Kecha';
  }

  if (dayDiff > 1 && dayDiff < 7) {
    return lang === 'ru' ? `${dayDiff} дн. назад` : `${dayDiff} kun oldin`;
  }

  return new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'uz-UZ', {
    timeZone: UZ_TIMEZONE,
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function formatChatThreadStatusTime(isoOrDate, lang = 'uz') {
  const date = new Date(isoOrDate);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) {
    return lang === 'ru' ? 'Только что' : 'Hozirgina';
  }

  if (minutes < 60) {
    return lang === 'ru' ? `${minutes} мин. назад` : `${minutes} daqiqa oldin`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return lang === 'ru' ? `${hours} ч. назад` : `${hours} soat oldin`;
  }

  const days = Math.floor(hours / 24);
  return lang === 'ru' ? `${days} дн. назад` : `${days} kun oldin`;
}
