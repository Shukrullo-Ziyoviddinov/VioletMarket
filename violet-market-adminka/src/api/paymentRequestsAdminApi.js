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

function normalizeStats(data) {
  return {
    totalCount: Number(data?.totalCount) || 0,
    inProcessCount: Number(data?.inProcessCount) || 0,
    inProcessAmount: Number(data?.inProcessAmount) || 0,
    withdrawnCount: Number(data?.withdrawnCount) || 0,
    withdrawnAmount: Number(data?.withdrawnAmount) || 0,
    rejectedCount: Number(data?.rejectedCount) || 0,
    rejectedUniqueProductCount: Number(data?.rejectedUniqueProductCount) || 0,
    rejectedAmount: Number(data?.rejectedAmount) || 0,
  };
}

function normalizeRequest(row) {
  return {
    id: Number(row?.id) || 0,
    requestCode: String(row?.requestCode || ''),
    sellerId: String(row?.sellerId || ''),
    sellerName: String(row?.sellerName || ''),
    sellerLogoUrl: String(row?.sellerLogoUrl || ''),
    status: String(row?.status || 'in_process'),
    totalAmount: Number(row?.totalAmount) || 0,
    itemCount: Number(row?.itemCount) || 0,
    submittedAt: row?.submittedAt || '',
    reviewedAt: row?.reviewedAt || null,
  };
}

function normalizeItem(row) {
  return {
    id: Number(row?.id) || 0,
    productId: Number(row?.productId) || 0,
    productCode: String(row?.productCode || ''),
    title: row?.title || { uz: '', ru: '' },
    imageUrl: String(row?.imageUrl || ''),
    soldAt: row?.soldAt || '',
    price: Number(row?.price) || 0,
    amount: Number(row?.amount) || 0,
    status: String(row?.status || 'in_process'),
  };
}

export async function fetchPaymentRequestStats() {
  const res = await fetch(apiUrl('/api/admin/payment-requests/stats'));
  const payload = await parseJson(res);
  return normalizeStats(payload?.data || {});
}

function normalizeRejectedProduct(row) {
  return {
    soldItemId: Number(row?.soldItemId) || 0,
    productId: Number(row?.productId) || 0,
    productCode: String(row?.productCode || ''),
    title: row?.title || { uz: '', ru: '' },
    imageUrl: String(row?.imageUrl || ''),
    sellerId: String(row?.sellerId || ''),
    sellerName: String(row?.sellerName || ''),
    sellerLogoUrl: String(row?.sellerLogoUrl || ''),
    amount: Number(row?.amount) || 0,
    status: String(row?.status || ''),
    rejectionCount: Number(row?.rejectionCount) || 0,
    rejections: Array.isArray(row?.rejections)
      ? row.rejections.map((entry) => ({
          paymentRequestId: Number(entry?.paymentRequestId) || null,
          rejectedAt: entry?.rejectedAt || '',
          comment: String(entry?.comment || ''),
        }))
      : [],
    isWithdrawn: Boolean(row?.isWithdrawn),
    withdrawnAt: row?.withdrawnAt || null,
  };
}

export async function fetchRejectedProducts() {
  const res = await fetch(apiUrl('/api/admin/payment-requests/rejected-products'));
  const payload = await parseJson(res);
  const products = Array.isArray(payload?.data?.products) ? payload.data.products : [];
  return products.map(normalizeRejectedProduct);
}

export async function fetchPaymentRequestSellerOptions() {
  const res = await fetch(apiUrl('/api/admin/payment-requests/seller-options'));
  const payload = await parseJson(res);
  const sellers = Array.isArray(payload?.data?.sellers) ? payload.data.sellers : [];
  return sellers.map((row) => ({
    sellerId: String(row?.sellerId || ''),
    name: String(row?.name || ''),
    logoUrl: String(row?.logoUrl || ''),
  }));
}

export async function fetchPaymentRequests(filters = {}) {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== 'all') params.set('status', String(filters.status));
  if (filters?.sellerId && filters.sellerId !== 'all') params.set('sellerId', String(filters.sellerId));
  if (filters?.dateFrom) params.set('dateFrom', String(filters.dateFrom));
  if (filters?.dateTo) params.set('dateTo', String(filters.dateTo));
  if (filters?.page) params.set('page', String(filters.page));

  const query = params.toString();
  const path = query ? `/api/admin/payment-requests?${query}` : '/api/admin/payment-requests';
  const res = await fetch(apiUrl(path));
  const payload = await parseJson(res);
  const data = payload?.data || {};

  return {
    page: Number(data?.page) || 1,
    limit: Number(data?.limit) || 10,
    total: Number(data?.total) || 0,
    totalPages: Number(data?.totalPages) || 1,
    requests: Array.isArray(data?.requests) ? data.requests.map(normalizeRequest) : [],
  };
}

export async function fetchPaymentRequestDetail(paymentRequestId) {
  const res = await fetch(apiUrl(`/api/admin/payment-requests/${paymentRequestId}`));
  const payload = await parseJson(res);
  const data = payload?.data || {};
  return {
    ...normalizeRequest(data),
    items: Array.isArray(data?.items) ? data.items.map(normalizeItem) : [],
  };
}

export async function approvePaymentRequest(paymentRequestId) {
  const res = await fetch(apiUrl(`/api/admin/payment-requests/${paymentRequestId}/approve`), {
    method: 'POST',
  });
  const payload = await parseJson(res);
  const data = payload?.data || {};
  return {
    ...normalizeRequest(data),
    items: Array.isArray(data?.items) ? data.items.map(normalizeItem) : [],
  };
}

export async function rejectPaymentRequest(paymentRequestId, comment = '') {
  const res = await fetch(apiUrl(`/api/admin/payment-requests/${paymentRequestId}/reject`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ comment }),
  });
  const payload = await parseJson(res);
  const data = payload?.data || {};
  return {
    ...normalizeRequest(data),
    items: Array.isArray(data?.items) ? data.items.map(normalizeItem) : [],
  };
}
