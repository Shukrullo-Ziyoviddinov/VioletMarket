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

export async function fetchShippingCountries() {
  const res = await fetch(apiUrl('/api/admin/shipping-countries'));
  const data = await parseJson(res);
  return Array.isArray(data?.data) ? data.data : [];
}

export async function createShippingCountry(payload) {
  const res = await fetch(apiUrl('/api/admin/shipping-countries'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function updateShippingCountry(shippingCountryId, payload) {
  const res = await fetch(apiUrl(`/api/admin/shipping-countries/${shippingCountryId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function deleteShippingCountry(shippingCountryId) {
  const res = await fetch(apiUrl(`/api/admin/shipping-countries/${shippingCountryId}`), {
    method: 'DELETE',
  });
  await parseJson(res);
}
