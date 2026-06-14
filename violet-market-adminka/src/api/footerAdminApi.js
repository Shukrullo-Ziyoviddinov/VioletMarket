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

export async function fetchFooterAdminData() {
  const res = await fetch(apiUrl('/api/admin/footer'));
  const data = await parseJson(res);
  return data?.data?.footerData || { aboutSections: [], socialMedia: [], appStores: [], contacts: [] };
}

export async function createFooterAboutSection(payload) {
  const res = await fetch(apiUrl('/api/admin/footer/about-sections'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function updateFooterAboutSection(sectionId, payload) {
  const res = await fetch(apiUrl(`/api/admin/footer/about-sections/${sectionId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function deleteFooterAboutSection(sectionId) {
  const res = await fetch(apiUrl(`/api/admin/footer/about-sections/${sectionId}`), {
    method: 'DELETE',
  });
  await parseJson(res);
}

export async function createFooterSocialMedia(payload) {
  const res = await fetch(apiUrl('/api/admin/footer/social-media'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function updateFooterSocialMedia(socialId, payload) {
  const res = await fetch(apiUrl(`/api/admin/footer/social-media/${socialId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function deleteFooterSocialMedia(socialId) {
  const res = await fetch(apiUrl(`/api/admin/footer/social-media/${socialId}`), {
    method: 'DELETE',
  });
  await parseJson(res);
}

export async function createFooterAppStore(payload) {
  const res = await fetch(apiUrl('/api/admin/footer/app-stores'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function updateFooterAppStore(appStoreId, payload) {
  const res = await fetch(apiUrl(`/api/admin/footer/app-stores/${appStoreId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function deleteFooterAppStore(appStoreId) {
  const res = await fetch(apiUrl(`/api/admin/footer/app-stores/${appStoreId}`), {
    method: 'DELETE',
  });
  await parseJson(res);
}

export async function createFooterContact(payload) {
  const res = await fetch(apiUrl('/api/admin/footer/contacts'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function updateFooterContact(contactId, payload) {
  const res = await fetch(apiUrl(`/api/admin/footer/contacts/${contactId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function deleteFooterContact(contactId) {
  const res = await fetch(apiUrl(`/api/admin/footer/contacts/${contactId}`), {
    method: 'DELETE',
  });
  await parseJson(res);
}
