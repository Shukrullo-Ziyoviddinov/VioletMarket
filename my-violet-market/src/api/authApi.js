import { apiUrl } from '../config/api';

async function parseJsonResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || res.statusText || 'So‘rov xatosi');
    err.status = res.status;
    err.code = data.code;
    throw err;
  }
  return data;
}

export function sendLoginCode(email) {
  return fetch(apiUrl('/api/auth/send-login-code'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  }).then(parseJsonResponse);
}

export function sendRegisterCode(email) {
  return fetch(apiUrl('/api/auth/send-register-code'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  }).then(parseJsonResponse);
}

export function verifyLogin(email, code) {
  return fetch(apiUrl('/api/auth/verify-login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  }).then(parseJsonResponse);
}

export function registerUser(payload) {
  return fetch(apiUrl('/api/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(parseJsonResponse);
}
