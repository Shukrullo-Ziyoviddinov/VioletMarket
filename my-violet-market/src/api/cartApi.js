import { apiUrl } from '../config/api';

async function parseJsonResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || res.statusText || 'So‘rov xatosi');
    err.status = res.status;
    err.code = data.code;
    err.details = data.details;
    throw err;
  }
  return data;
}

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export function fetchCart(token) {
  return fetch(apiUrl('/api/cart'), {
    headers: authHeaders(token),
  }).then(parseJsonResponse);
}

export function addCartItem(token, payload) {
  return fetch(apiUrl('/api/cart/add'), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  }).then(parseJsonResponse);
}

export function updateCartItemQuantity(token, itemId, change) {
  return fetch(apiUrl(`/api/cart/items/${itemId}`), {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ change }),
  }).then(parseJsonResponse);
}

export function removeCartItem(token, itemId) {
  return fetch(apiUrl(`/api/cart/items/${itemId}`), {
    method: 'DELETE',
    headers: authHeaders(token),
  }).then(parseJsonResponse);
}

export function dismissCartUrgency(token, itemId) {
  return fetch(apiUrl(`/api/cart/items/${itemId}/urgency-dismiss`), {
    method: 'POST',
    headers: authHeaders(token),
  }).then(parseJsonResponse);
}

export function clearCartApi(token) {
  return fetch(apiUrl('/api/cart'), {
    method: 'DELETE',
    headers: authHeaders(token),
  }).then(parseJsonResponse);
}

export function checkoutCartApi(token, { paymentMethod, deliveryAddress } = {}) {
  const method = String(paymentMethod || '').trim();
  if (!method) {
    return Promise.reject(Object.assign(new Error('To‘lov usulini tanlang'), { status: 400 }));
  }

  let addressPayload = deliveryAddress || null;
  if (!addressPayload) {
    try {
      const raw = localStorage.getItem('checkoutAddress');
      addressPayload = raw ? JSON.parse(raw) : null;
    } catch {
      addressPayload = null;
    }
  }

  if (!addressPayload) {
    return Promise.reject(
      Object.assign(
        new Error('Yetkazib berish manzilini saqlang, keyin to‘lov qiling'),
        { status: 400, code: 'DELIVERY_ADDRESS_REQUIRED' },
      ),
    );
  }

  const city = String(addressPayload.city || '').trim();
  const district = String(addressPayload.district || '').trim();
  const addressLine = String(
    addressPayload.addressLine || addressPayload.formatted || '',
  ).trim();
  const coords = Array.isArray(addressPayload.coords)
    ? addressPayload.coords
    : null;

  if (!addressLine && !coords) {
    return Promise.reject(
      Object.assign(
        new Error('Manzil to‘liq emas. Manzilni qayta saqlang'),
        { status: 400, code: 'DELIVERY_ADDRESS_REQUIRED' },
      ),
    );
  }

  return fetch(apiUrl('/api/cart/checkout'), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      paymentMethod: method,
      deliveryAddress: {
        ...addressPayload,
        city,
        district,
        addressLine,
        coords,
      },
      address: {
        ...addressPayload,
        city,
        district,
        addressLine,
        coords,
      },
      // Flat fallback — ba'zi proxy/body parser holatlari uchun
      city,
      district,
      addressLine,
      coords,
      formatted: addressPayload.formatted || addressLine,
    }),
  }).then(parseJsonResponse);
}

export function saveDeliveryAddressApi(token, deliveryAddress) {
  const authToken = token || localStorage.getItem('authToken');
  let addressPayload = deliveryAddress || null;
  if (!addressPayload) {
    try {
      const raw = localStorage.getItem('checkoutAddress');
      addressPayload = raw ? JSON.parse(raw) : null;
    } catch {
      addressPayload = null;
    }
  }

  if (!authToken || !addressPayload) {
    return Promise.reject(
      Object.assign(new Error('Manzil saqlanmadi'), { status: 400 }),
    );
  }

  return fetch(apiUrl('/api/cart/delivery-address'), {
    method: 'PUT',
    headers: authHeaders(authToken),
    body: JSON.stringify({ deliveryAddress: addressPayload }),
  }).then(parseJsonResponse);
}
