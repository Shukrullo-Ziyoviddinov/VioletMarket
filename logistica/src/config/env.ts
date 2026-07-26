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
