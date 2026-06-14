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

export async function fetchAdminCategories() {
  const res = await fetch(apiUrl('/api/admin/categories'));
  const data = await parseJson(res);
  return data?.data || {};
}

export async function createAdminMasterCategory(payload) {
  const res = await fetch(apiUrl('/api/admin/categories/master-categories'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function updateAdminMasterCategory(masterCategoryId, payload) {
  const res = await fetch(apiUrl(`/api/admin/categories/master-categories/${masterCategoryId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function deleteAdminMasterCategory(masterCategoryId) {
  const res = await fetch(apiUrl(`/api/admin/categories/master-categories/${masterCategoryId}`), {
    method: 'DELETE',
  });
  await parseJson(res);
}

export async function createAdminCountryCategory(payload) {
  const res = await fetch(apiUrl('/api/admin/categories/countries'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function updateAdminCountryCategory(countryId, payload) {
  const res = await fetch(apiUrl(`/api/admin/categories/countries/${countryId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function deleteAdminCountryCategory(countryId) {
  const res = await fetch(apiUrl(`/api/admin/categories/countries/${countryId}`), {
    method: 'DELETE',
  });
  await parseJson(res);
}

export async function createAdminBrandCategory(payload) {
  const res = await fetch(apiUrl('/api/admin/categories/brands'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function updateAdminBrandCategory(brandId, payload) {
  const res = await fetch(apiUrl(`/api/admin/categories/brands/${brandId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function deleteAdminBrandCategory(brandId) {
  const res = await fetch(apiUrl(`/api/admin/categories/brands/${brandId}`), {
    method: 'DELETE',
  });
  await parseJson(res);
}

export async function createAdminFilterValue(payload) {
  const res = await fetch(apiUrl('/api/admin/categories/filter-values'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function updateAdminFilterValue(filterId, payload) {
  const res = await fetch(apiUrl(`/api/admin/categories/filter-values/${filterId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function deleteAdminFilterValue(filterId) {
  const res = await fetch(apiUrl(`/api/admin/categories/filter-values/${filterId}`), {
    method: 'DELETE',
  });
  await parseJson(res);
}
