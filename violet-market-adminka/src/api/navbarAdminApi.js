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

export async function deleteNavbarItem(sectionId, itemId) {
  const res = await fetch(apiUrl(`/api/admin/navbar/${sectionId}/items/${itemId}`), {
    method: 'DELETE',
  });
  const data = await parseJson(res);
  return data?.data;
}
