const UZ_TIMEZONE = 'Asia/Tashkent';

export function formatLastActiveUz(isoOrDate) {
  const date = new Date(isoOrDate);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('uz-UZ', {
    timeZone: UZ_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}
