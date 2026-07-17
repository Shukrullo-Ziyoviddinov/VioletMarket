const apiUrl = String(
  process.env.EXPO_PUBLIC_API_URL || 'https://violetmarket.onrender.com',
)
  .trim()
  .replace(/\/+$/, '');

if (!apiUrl.startsWith('http')) {
  throw new Error('EXPO_PUBLIC_API_URL noto‘g‘ri sozlangan');
}

export const env = {
  apiUrl,
} as const;

export function resolveMediaUrl(path: string) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${env.apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
}
