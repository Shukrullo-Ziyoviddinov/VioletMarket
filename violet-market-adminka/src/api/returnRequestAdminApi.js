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

export async function fetchReturnRequests(status = 'pending') {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  const res = await fetch(apiUrl(`/api/admin/return-requests?${params.toString()}`));
  const payload = await parseJson(res);
  return payload?.data || { total: 0, items: [] };
}

export async function approveReturnRequest(id, reasonType) {
  const res = await fetch(
    apiUrl(`/api/admin/return-requests/${encodeURIComponent(id)}/approve`),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reasonType }),
    },
  );
  const payload = await parseJson(res);
  return payload?.data;
}

export async function rejectReturnRequest(id, rejectReason = '') {
  const res = await fetch(
    apiUrl(`/api/admin/return-requests/${encodeURIComponent(id)}/reject`),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rejectReason }),
    },
  );
  const payload = await parseJson(res);
  return payload?.data;
}
