import { apiUrl } from '../config/api';

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

export async function fetchHomeBanners() {
  const res = await fetch(apiUrl('/api/admin/home-banners'));
  const data = await parseJson(res);
  return data?.data?.banners || [];
}

export async function createHomeBanner(payload) {
  const res = await fetch(apiUrl('/api/admin/home-banners'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function updateHomeBanner(bannerId, payload) {
  const res = await fetch(apiUrl(`/api/admin/home-banners/${bannerId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function deleteHomeBanner(bannerId) {
  const res = await fetch(apiUrl(`/api/admin/home-banners/${bannerId}`), {
    method: 'DELETE',
  });
  await parseJson(res);
}
