function formatNotificationDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

export function formatNotificationBadgeCount(count) {
  const value = Number(count) || 0;
  if (value > 99) return '99+';
  return String(value);
}

export { formatNotificationDateTime };
