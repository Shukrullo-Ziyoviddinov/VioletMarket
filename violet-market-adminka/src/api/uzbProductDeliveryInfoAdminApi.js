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

export async function fetchUzbProductDeliveryInfo() {
  const res = await fetch(apiUrl('/api/admin/uzb-product-delivery-info'));
  const data = await parseJson(res);
  return data?.data || { deliveryInfo: null };
}

export async function updateUzbProductDeliveryInfo(payload) {
  const res = await fetch(apiUrl('/api/admin/uzb-product-delivery-info'), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data || { deliveryInfo: null };
}

export async function deleteUzbProductDeliveryInfo() {
  const res = await fetch(apiUrl('/api/admin/uzb-product-delivery-info'), {
    method: 'DELETE',
  });
  const data = await parseJson(res);
  return data?.data || { deliveryInfo: null };
}
