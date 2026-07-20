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

export async function fetchCourierPaymentTariffs() {
  const res = await fetch(apiUrl('/api/admin/courier-payment-tariffs'));
  const payload = await parseJson(res);
  return payload?.data || { tiers: [] };
}

export async function updateCourierPaymentTariffs(tiers) {
  const res = await fetch(apiUrl('/api/admin/courier-payment-tariffs'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tiers }),
  });
  const payload = await parseJson(res);
  return payload?.data;
}

export async function updateCourierAssignmentPayment(assignmentId, courierPayment) {
  const res = await fetch(
    apiUrl(`/api/admin/courier-assignments/${encodeURIComponent(assignmentId)}/payment`),
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courierPayment }),
    },
  );
  const payload = await parseJson(res);
  return payload?.data;
}
