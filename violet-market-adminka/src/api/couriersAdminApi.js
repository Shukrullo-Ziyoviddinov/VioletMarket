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

export async function fetchCouriers() {
  const res = await fetch(apiUrl('/api/admin/couriers'));
  const payload = await parseJson(res);

  return {
    pending: Array.isArray(payload?.data?.pending) ? payload.data.pending : [],
    approved: Array.isArray(payload?.data?.approved) ? payload.data.approved : [],
  };
}

export async function approveCourier(courierId) {
  const res = await fetch(apiUrl(`/api/admin/couriers/${courierId}/approve`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const payload = await parseJson(res);
  return payload?.data;
}

export async function rejectCourier(courierId) {
  const res = await fetch(apiUrl(`/api/admin/couriers/${courierId}/reject`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const payload = await parseJson(res);
  return payload?.data;
}

export async function deleteCourier(courierId) {
  const res = await fetch(apiUrl(`/api/admin/couriers/${encodeURIComponent(courierId)}`), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  const payload = await parseJson(res);
  return payload?.data;
}

export async function fetchCourierAcceptedOrders(courierId, status = 'all') {
  const normalizedStatus =
    status === 'accepted' || status === 'delivered' ? status : 'all';
  const search = new URLSearchParams();
  if (normalizedStatus !== 'all') {
    search.set('status', normalizedStatus);
  }
  const suffix = search.toString() ? `?${search.toString()}` : '';
  const res = await fetch(
    apiUrl(
      `/api/admin/couriers/${encodeURIComponent(courierId)}/accepted-orders${suffix}`,
    ),
  );
  const payload = await parseJson(res);
  return payload?.data || { courier: null, stats: null, orders: [] };
}

/** Qabul qilingan buyurtmani kuryerdan olib delivery poolga qaytarish */
export async function reassignCourierAssignment(assignmentId) {
  const res = await fetch(
    apiUrl(
      `/api/admin/courier-assignments/${encodeURIComponent(assignmentId)}/reassign`,
    ),
    { method: 'POST' },
  );
  const payload = await parseJson(res);
  return payload?.data || null;
}
