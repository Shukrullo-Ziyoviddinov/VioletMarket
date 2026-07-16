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

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

function normalizeWithdrawal(row) {
  return {
    id: Number(row?.id) || 0,
    paymentRequestId: Number(row?.paymentRequestId) || 0,
    requestCode: String(row?.requestCode || ''),
    soldItemId: Number(row?.soldItemId) || 0,
    productId: Number(row?.productId) || 0,
    productCode: String(row?.productCode || ''),
    title: row?.title || { uz: '', ru: '' },
    imageUrl: String(row?.imageUrl || ''),
    amount: Number(row?.amount) || 0,
    submittedAt: row?.submittedAt || '',
    withdrawnAt: row?.withdrawnAt || '',
  };
}

export async function fetchSellerWithdrawals(token, filters = {}) {
  const params = new URLSearchParams();
  if (filters?.dateFrom) params.set('dateFrom', String(filters.dateFrom));
  if (filters?.dateTo) params.set('dateTo', String(filters.dateTo));
  if (filters?.search) params.set('search', String(filters.search).trim());
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));

  const query = params.toString();
  const path = query
    ? `/api/seller-auth/withdrawals?${query}`
    : '/api/seller-auth/withdrawals';

  const res = await fetch(apiUrl(path), {
    headers: authHeaders(token),
  });
  const payload = await parseJson(res);
  const data = payload?.data || {};

  return {
    page: Number(data?.page) || 1,
    limit: Number(data?.limit) || 10,
    total: Number(data?.total) || 0,
    totalPages: Number(data?.totalPages) || 1,
    withdrawals: Array.isArray(data?.withdrawals)
      ? data.withdrawals.map(normalizeWithdrawal)
      : [],
  };
}
