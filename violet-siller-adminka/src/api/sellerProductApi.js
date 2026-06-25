import { apiUrl, getApiBaseUrl } from '../config/api';

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.message || data?.error || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.code = data?.code;
    err.data = data;
    throw err;
  }
  return data;
}

export async function fetchSellerProductFormOptions(token) {
  const res = await fetch(apiUrl('/api/seller-auth/product-form/options'), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await parseJson(res);
  return data?.data;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function toAbsoluteVideoUrl(pathValue) {
  if (!pathValue) return '';
  const normalized = String(pathValue).trim().replace(/\\/g, '/');
  if (!normalized) return '';
  if (/^https?:\/\//i.test(normalized)) return normalized;
  if (normalized.startsWith('/uploads/') || normalized.startsWith('uploads/')) {
    return `${getApiBaseUrl()}${normalized.startsWith('/') ? normalized : `/${normalized}`}`;
  }
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

async function isVideoReachable(pathValue) {
  const url = toAbsoluteVideoUrl(pathValue);
  try {
    const headRes = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    if (headRes.ok) return true;
    if (headRes.status !== 405) return false;
  } catch (_error) {
    // ignore
  }
  try {
    const getRes = await fetch(url, { method: 'GET', cache: 'no-store' });
    return getRes.ok;
  } catch (_error) {
    return false;
  }
}

async function waitUntilVideoReachable(pathValue, maxAttempts = 10, delayMs = 400) {
  for (let i = 0; i < maxAttempts; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await isVideoReachable(pathValue);
    if (ok) return true;
    // eslint-disable-next-line no-await-in-loop
    await sleep(delayMs);
  }
  return false;
}

export function uploadSellerProductVideo(token, file, onProgress, onPhaseChange) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Video fayl topilmadi'));
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', apiUrl('/api/seller-auth/uploads/video'));
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    if (typeof onPhaseChange === 'function') {
      onPhaseChange('uploading');
    }

    xhr.upload.onprogress = (event) => {
      const totalBytes = event.total > 0 ? event.total : file.size;
      if (!totalBytes) return;
      const rawPercent = Math.round((event.loaded / totalBytes) * 100);
      const percent = Math.max(0, Math.min(99, rawPercent));
      if (typeof onProgress === 'function') {
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      let payload = {};
      try {
        payload = JSON.parse(xhr.responseText || '{}');
      } catch (_error) {
        payload = {};
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        const uploadedPath = payload?.data?.path || '';
        if (!uploadedPath) {
          reject(new Error("Server video manzilini qaytarmadi"));
          return;
        }

        (async () => {
          if (typeof onPhaseChange === 'function') {
            onPhaseChange('verifying');
          }
          const reachable = await waitUntilVideoReachable(uploadedPath);
          if (!reachable) {
            reject(new Error("Video serverga to'liq saqlanmadi yoki ochilmadi"));
            return;
          }
          if (typeof onProgress === 'function') {
            onProgress(100);
          }
          if (typeof onPhaseChange === 'function') {
            onPhaseChange('done');
          }
          resolve(uploadedPath);
        })();
        return;
      }

      reject(new Error(payload?.message || `Upload xatosi (${xhr.status})`));
    };

    xhr.onerror = () => reject(new Error('Upload davomida tarmoq xatoligi'));
    xhr.onabort = () => reject(new Error('Upload to‘xtatildi'));

    const formData = new FormData();
    formData.append('video', file);
    xhr.send(formData);
  });
}
