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

export async function fetchLogisticaProfiles() {
  const res = await fetch(apiUrl('/api/admin/logistica'));
  const payload = await parseJson(res);

  return {
    pending: Array.isArray(payload?.data?.pending) ? payload.data.pending : [],
    approved: Array.isArray(payload?.data?.approved) ? payload.data.approved : [],
  };
}

export async function approveLogistica(id) {
  const res = await fetch(apiUrl(`/api/admin/logistica/${id}/approve`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const payload = await parseJson(res);
  return payload?.data;
}

export async function rejectLogistica(id) {
  const res = await fetch(apiUrl(`/api/admin/logistica/${id}/reject`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const payload = await parseJson(res);
  return payload?.data;
}

export async function deleteLogistica(id) {
  const res = await fetch(apiUrl(`/api/admin/logistica/${encodeURIComponent(id)}`), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  const payload = await parseJson(res);
  return payload?.data;
}
