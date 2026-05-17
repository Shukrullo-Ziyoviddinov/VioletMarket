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

/** Bitta mahsulot — server DB dagi cycleEndsAt */
export function fetchFlashSaleCountdown(productId, durationHours) {
  const params = new URLSearchParams();
  params.set('durationHours', String(durationHours));
  return fetch(
    apiUrl(`/api/flash-sale/${Number(productId)}?${params}`),
  ).then(parseJsonResponse);
}

/** Ko‘p mahsulot (Home / big-discount) */
export function fetchFlashSaleCountdownBatch(items) {
  return fetch(apiUrl('/api/flash-sale/batch'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: items.map((item) => ({
        productId: Number(item.productId),
        durationHours: Number(item.durationHours),
      })),
    }),
  }).then(parseJsonResponse);
}
