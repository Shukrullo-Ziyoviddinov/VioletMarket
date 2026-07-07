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

function normalizeWithdrawal(row) {
  return {
    id: Number(row?.id) || 0,
    paymentRequestId: Number(row?.paymentRequestId) || 0,
    requestCode: String(row?.requestCode || ''),
    sellerId: String(row?.sellerId || ''),
    sellerName: String(row?.sellerName || ''),
    sellerLogoUrl: String(row?.sellerLogoUrl || ''),
    soldItemId: Number(row?.soldItemId) || 0,
    productId: Number(row?.productId) || 0,
    productCode: String(row?.productCode || ''),
    title: row?.title || { uz: '', ru: '' },
    imageUrl: String(row?.imageUrl || ''),
    amount: Number(row?.amount) || 0,
    withdrawnAt: row?.withdrawnAt || '',
  };
}

export async function fetchWithdrawalStats() {
  const res = await fetch(apiUrl('/api/admin/withdrawals/stats'));
  const payload = await parseJson(res);
  const data = payload?.data || {};
  return {
    withdrawnCount: Number(data?.withdrawnCount) || 0,
    withdrawnProductCount: Number(data?.withdrawnProductCount) || 0,
    withdrawnAmount: Number(data?.withdrawnAmount) || 0,
  };
}

export async function fetchWithdrawalSellerOptions() {
  const res = await fetch(apiUrl('/api/admin/withdrawals/seller-options'));
  const payload = await parseJson(res);
  const sellers = Array.isArray(payload?.data?.sellers) ? payload.data.sellers : [];
  return sellers.map((row) => ({
    sellerId: String(row?.sellerId || ''),
    name: String(row?.name || ''),
    logoUrl: String(row?.logoUrl || ''),
  }));
}

export async function fetchWithdrawals(filters = {}) {
  const params = new URLSearchParams();
  if (filters?.sellerId && filters.sellerId !== 'all') {
    params.set('sellerId', String(filters.sellerId));
  }
  if (filters?.dateFrom) params.set('dateFrom', String(filters.dateFrom));
  if (filters?.dateTo) params.set('dateTo', String(filters.dateTo));
  if (filters?.page) params.set('page', String(filters.page));

  const query = params.toString();
  const path = query ? `/api/admin/withdrawals?${query}` : '/api/admin/withdrawals';
  const res = await fetch(apiUrl(path));
  const payload = await parseJson(res);
  const data = payload?.data || {};

  return {
    page: Number(data?.page) || 1,
    limit: Number(data?.limit) || 10,
    total: Number(data?.total) || 0,
    totalPages: Number(data?.totalPages) || 1,
    withdrawals: Array.isArray(data?.withdrawals) ? data.withdrawals.map(normalizeWithdrawal) : [],
  };
}
