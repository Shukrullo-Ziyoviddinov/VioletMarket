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

export async function startSellerRegistration(payload) {
  const res = await fetch(apiUrl('/api/seller-auth/register/start'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function fetchSellerRegistrationCountries() {
  const res = await fetch(apiUrl('/api/seller-auth/register/countries'));
  const data = await parseJson(res);
  return Array.isArray(data?.data?.countries) ? data.data.countries : [];
}

export async function verifySellerEmail(payload) {
  const res = await fetch(apiUrl('/api/seller-auth/register/verify-email'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function submitSellerApplication(payload, registrationToken) {
  const res = await fetch(apiUrl('/api/seller-auth/register/submit-application'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${registrationToken}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function fetchApplicationStatus({ email, registrationToken } = {}) {
  const headers = {};
  if (registrationToken) {
    headers.Authorization = `Bearer ${registrationToken}`;
  }

  const query = email ? `?email=${encodeURIComponent(email)}` : '';
  const res = await fetch(apiUrl(`/api/seller-auth/application-status${query}`), { headers });
  const data = await parseJson(res);
  return data?.data;
}

export async function loginSeller(payload) {
  const res = await fetch(apiUrl('/api/seller-auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function fetchSellerCabinetProfile(token) {
  const res = await fetch(apiUrl('/api/seller-auth/me'), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function updateSellerMarketProfile(token, payload) {
  const res = await fetch(apiUrl('/api/seller-auth/market-profile'), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  return data?.data;
}

export async function uploadSellerMarketImage(token, file) {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(apiUrl('/api/seller-auth/uploads/image'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const data = await parseJson(res);
  return data?.data;
}
