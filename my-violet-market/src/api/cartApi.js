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

export function updateCartCargoOptionsApi(token, payload) {
  return fetch(apiUrl('/api/cart/cargo-options'), {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload || {}),
  }).then(parseJsonResponse);
}

export function checkoutCartApi(
  token,
  { paymentMethod, deliveryAddress } = {},
) {
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

  const body = { paymentMethod: method };

  if (addressPayload) {
    const city = String(addressPayload.city || '').trim();
    const province = String(addressPayload.province || '').trim();
    const region = String(addressPayload.region || province || '').trim();
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

    body.deliveryAddress = {
      ...addressPayload,
      city,
      province,
      region,
      district,
      addressLine,
      coords,
    };
    body.address = body.deliveryAddress;
    body.city = city;
    body.province = province;
    body.region = region;
    body.district = district;
    body.addressLine = addressLine;
    body.coords = coords;
    body.formatted = addressPayload.formatted || addressLine;
  }

  // Manzil bodyda bo‘lmasa server savedDeliveryAddress dan oladi.
  return fetch(apiUrl('/api/cart/checkout'), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
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
