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

export function toAbsoluteImageUrl(pathValue) {
  if (!pathValue) return '';
  if (/^https?:\/\//i.test(pathValue)) return pathValue;
  return `${getApiBaseUrl()}${pathValue.startsWith('/') ? pathValue : `/${pathValue}`}`;
}

export function uploadNavbarImage(file, onProgress) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Fayl topilmadi'));
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', apiUrl('/api/admin/uploads/image'));

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100)));
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
        resolve(payload?.data?.path || '');
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
