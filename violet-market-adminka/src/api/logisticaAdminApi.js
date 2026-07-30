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

export async function fetchLogisticaDetail(id) {
  const res = await fetch(
    apiUrl(`/api/admin/logistica/${encodeURIComponent(id)}/detail`),
  );
  const payload = await parseJson(res);
  return payload?.data || null;
}

export async function fetchLogisticaDetailHistory(id, params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.kind) query.set('kind', String(params.kind));

  const suffix = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(
    apiUrl(`/api/admin/logistica/${encodeURIComponent(id)}/history${suffix}`),
  );
  const payload = await parseJson(res);
  const data = payload?.data || {};

  return {
    page: Number(data.page) || 1,
    limit: Number(data.limit) || 30,
    total: Number(data.total) || 0,
    totalPages: Number(data.totalPages) || 1,
    counts: {
      handedOver: Math.max(0, Number(data?.counts?.handedOver) || 0),
      returned: Math.max(0, Number(data?.counts?.returned) || 0),
    },
    items: Array.isArray(data.items) ? data.items : [],
  };
}
