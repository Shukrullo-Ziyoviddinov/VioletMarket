import { getApiBaseUrl } from '../config/api';

export function resolveCourierImage(path) {
  if (!path) return null;
  const raw = String(path).trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:')) return raw;
  return `${getApiBaseUrl()}${raw.startsWith('/') ? raw : `/${raw}`}`;
}

export function fileToJpegBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Fayl tanlanmadi'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Faylni o‘qib bo‘lmadi'));
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 1024;
        const scale = Math.min(1, maxWidth / image.width);
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Rasmni tayyorlab bo‘lmadi'));
          return;
        }
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      image.onerror = () => reject(new Error('Rasmni ochib bo‘lmadi'));
      image.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}
