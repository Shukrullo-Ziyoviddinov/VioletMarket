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

export async function fetchSellerApplications() {
  const res = await fetch(apiUrl('/api/admin/seller-applications'));
  const payload = await parseJson(res);

  return {
    pending: Array.isArray(payload?.data?.pending) ? payload.data.pending : [],
    approved: Array.isArray(payload?.data?.approved) ? payload.data.approved : [],
  };
}

export async function approveSellerApplication(applicationId) {
  const res = await fetch(apiUrl(`/api/admin/seller-applications/${applicationId}/approve`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const payload = await parseJson(res);
  return payload?.data;
}

export async function rejectSellerApplication(applicationId, reason) {
  const res = await fetch(apiUrl(`/api/admin/seller-applications/${applicationId}/reject`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  const payload = await parseJson(res);
  return payload?.data;
}
