import { apiUrl } from '../config/api';

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.message || data?.error || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.code = data?.code;
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

function normalizeSummary(data) {
  return {
    availableAmount: Number(data?.availableAmount) || 0,
    inProcessAmount: Number(data?.inProcessAmount) || 0,
    withdrawnAmount: Number(data?.withdrawnAmount) || 0,
  };
}

function normalizeSoldItem(row) {
  return {
    id: String(row?.id ?? ''),
    orderId: Number(row?.orderId) || 0,
    productId: Number(row?.productId) || 0,
    productCode: String(row?.productCode || `#${row?.productId || ''}`),
    title: row?.title || { uz: '', ru: '' },
    imageUrl: String(row?.imageUrl || ''),
    soldAt: row?.soldAt || '',
    price: Number(row?.price) || 0,
    amount: Number(row?.amount) || 0,
    status: String(row?.status || 'available'),
    rejectionComment: String(row?.rejectionComment || '').trim() || '',
  };
}

export async function fetchSellerEarningsSummary(token) {
  const res = await fetch(apiUrl('/api/seller-auth/earnings/summary'), {
    headers: authHeaders(token),
  });
  const payload = await parseJson(res);
  return normalizeSummary(payload?.data || {});
}

export async function fetchSellerSoldItems(token, filters = {}) {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== 'all') {
    params.set('status', String(filters.status));
  }
  if (filters?.dateFrom) params.set('dateFrom', String(filters.dateFrom));
  if (filters?.dateTo) params.set('dateTo', String(filters.dateTo));
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));

  const query = params.toString();
  const path = query
    ? `/api/seller-auth/earnings/sold-items?${query}`
    : '/api/seller-auth/earnings/sold-items';

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
    items: Array.isArray(data?.items) ? data.items.map(normalizeSoldItem) : [],
  };
}

export async function submitSellerWithdrawalRequest(token, itemIds = []) {
  const res = await fetch(apiUrl('/api/seller-auth/earnings/withdrawal-requests'), {
    method: 'POST',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ itemIds: itemIds.map((id) => Number(id)).filter(Number.isFinite) }),
  });
  const payload = await parseJson(res);
  return {
    updatedCount: Number(payload?.data?.updatedCount) || 0,
    summary: normalizeSummary(payload?.data?.summary || {}),
  };
}
