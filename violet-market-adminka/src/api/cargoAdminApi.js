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

export async function fetchCargoAdminData() {
  const res = await fetch(apiUrl('/api/admin/cargo'));
  const data = await parseJson(res);
  return {
    cargoRates: Array.isArray(data?.data?.cargoRates) ? data.data.cargoRates : [],
    deliveryPrices: Array.isArray(data?.data?.deliveryPrices) ? data.data.deliveryPrices : [],
  };
}

export async function createCargoRate(payload) {
  const res = await fetch(apiUrl('/api/admin/cargo/cargo-rates'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function updateCargoRate(currentKey, payload) {
  const res = await fetch(apiUrl(`/api/admin/cargo/cargo-rates/${encodeURIComponent(currentKey)}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function deleteCargoRate(currentKey) {
  const res = await fetch(apiUrl(`/api/admin/cargo/cargo-rates/${encodeURIComponent(currentKey)}`), {
    method: 'DELETE',
  });
  await parseJson(res);
}

export async function createDeliveryPrice(payload) {
  const res = await fetch(apiUrl('/api/admin/cargo/delivery-prices'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function updateDeliveryPrice(currentKey, payload) {
  const res = await fetch(
    apiUrl(`/api/admin/cargo/delivery-prices/${encodeURIComponent(currentKey)}`),
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );
  const data = await parseJson(res);
  return data?.data;
}

export async function deleteDeliveryPrice(currentKey) {
  const res = await fetch(
    apiUrl(`/api/admin/cargo/delivery-prices/${encodeURIComponent(currentKey)}`),
    {
      method: 'DELETE',
    },
  );
  await parseJson(res);
}
