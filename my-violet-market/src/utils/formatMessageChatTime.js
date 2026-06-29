const UZ_TIMEZONE = 'Asia/Tashkent';

export function formatMessageChatTime(isoOrDate) {
  const date = new Date(isoOrDate);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-US', {
    timeZone: UZ_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}
