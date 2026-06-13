import { apiUrl, getApiBaseUrl } from '../config/api';

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.message || data?.error || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function fetchNavbarSections() {
  const res = await fetch(apiUrl('/api/admin/navbar'));
  const data = await parseJson(res);
  return data?.data?.sections || [];
}

export async function createNavbarSection(payload) {
  const res = await fetch(apiUrl('/api/admin/navbar'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function deleteNavbarSection(sectionId) {
  const res = await fetch(apiUrl(`/api/admin/navbar/${sectionId}`), {
    method: 'DELETE',
  });
  await parseJson(res);
}

export async function updateNavbarSection(sectionId, payload) {
  const res = await fetch(apiUrl(`/api/admin/navbar/${sectionId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function deleteNavbarItem(sectionId, itemId) {
  const res = await fetch(apiUrl(`/api/admin/navbar/${sectionId}/items/${itemId}`), {
    method: 'DELETE',
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function updateNavbarItem(sectionId, itemId, payload) {
  const res = await fetch(apiUrl(`/api/admin/navbar/${sectionId}/items/${itemId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function createNavbarItem(sectionId, payload) {
  const res = await fetch(apiUrl(`/api/admin/navbar/${sectionId}/items`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export function toAbsoluteImageUrl(pathValue) {
  if (!pathValue) return '';
  if (/^https?:\/\//i.test(pathValue)) return pathValue;
  return `${getApiBaseUrl()}${pathValue.startsWith('/') ? pathValue : `/${pathValue}`}`;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function isImageReachable(pathValue) {
  const url = toAbsoluteImageUrl(pathValue);
  try {
    const headRes = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    if (headRes.ok) return true;
    if (headRes.status !== 405) return false;
  } catch (_error) {
    // HEAD barcha platformalarda bir xil ishlamasligi mumkin
  }

  try {
    const getRes = await fetch(url, { method: 'GET', cache: 'no-store' });
    return getRes.ok;
  } catch (_error) {
    return false;
  }
}

async function waitUntilImageReachable(pathValue, maxAttempts = 8, delayMs = 350) {
  for (let i = 0; i < maxAttempts; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await isImageReachable(pathValue);
    if (ok) return true;
    // eslint-disable-next-line no-await-in-loop
    await sleep(delayMs);
  }
  return false;
}

export function uploadNavbarImage(file, onProgress, onPhaseChange) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Fayl topilmadi'));
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', apiUrl('/api/admin/uploads/image'));

    if (typeof onPhaseChange === 'function') {
      onPhaseChange('uploading');
    }

    xhr.upload.onprogress = (event) => {
      const totalBytes = event.total > 0 ? event.total : file.size;
      if (!totalBytes) return;
      const rawPercent = Math.round((event.loaded / totalBytes) * 100);
      // 100% ni faqat server tasdiqlaganidan keyin ko'rsatamiz
      const percent = Math.max(0, Math.min(99, rawPercent));
      if (typeof onProgress === 'function') {
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      let payload = {};
      try {
        payload = JSON.parse(xhr.responseText || '{}');
      } catch (e) {
        payload = {};
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        const uploadedPath = payload?.data?.path || '';
        if (!uploadedPath) {
          reject(new Error("Server image manzilini qaytarmadi"));
          return;
        }

        (async () => {
          if (typeof onPhaseChange === 'function') {
            onPhaseChange('verifying');
          }
          const reachable = await waitUntilImageReachable(uploadedPath);
          if (!reachable) {
            reject(new Error("Rasm serverga to'liq saqlanmadi yoki ochilmadi"));
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
    formData.append('image', file);
    xhr.send(formData);
  });
}
