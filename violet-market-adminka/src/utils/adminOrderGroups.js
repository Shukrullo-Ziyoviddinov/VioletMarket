/**
 * Asosiy admin Buyurtmalar — seller fulfillment: orderId:sellerId (bitta blok).
 * Last-mile / cargo monitoring: lane split alohida (orderId:sellerId:standard|express).
 */

import {
  buildCargoLaneGroupKey,
  normalizeCargoServiceType,
} from './cargoServiceRules';

export function resolveAdminOrderGroupKey(order) {
  const fromApi = String(order?.groupKey || '').trim();
  if (fromApi) return fromApi;
  const orderId = Number(order?.orderId) || 0;
  const sellerId = String(order?.sellerId || order?.seller?.id || '').trim();
  const type = normalizeCargoServiceType(order?.cargoServiceType);
  if (orderId && sellerId && type) {
    return buildCargoLaneGroupKey(orderId, sellerId, type);
  }
  return `${orderId}:${sellerId}`;
}

export function groupAdminOrdersByFulfillment(orders = []) {
  const list = Array.isArray(orders) ? orders : [];
  const map = new Map();

  for (const order of list) {
    if (!order) continue;
    const groupKey = resolveAdminOrderGroupKey(order);
    if (!map.has(groupKey)) {
      map.set(groupKey, {
        id: `group-${groupKey}`,
        groupKey,
        orderId: Number(order.orderId) || 0,
        orderCode: String(order.orderCode || ''),
        buyer: order.buyer || order.customer || null,
        orderedAt: order.orderedAt || null,
        trackingStatus: String(order.trackingStatus || ''),
        cargoServiceType: order.cargoServiceType || null,
        paymentMethod: order.paymentMethod,
        sellerId: String(order.sellerId || order.seller?.id || ''),
        seller: order.seller || null,
        items: [],
      });
    }
    map.get(groupKey).items.push(order);
  }

  return Array.from(map.values()).map((group) => {
    const itemIndexes = [
      ...new Set(group.items.map((item) => Number(item.itemIndex) || 0)),
    ];
    const productCodes = group.items
      .map((item) => String(item.productCode || '').trim())
      .filter(Boolean);
    const first = group.items[0] || {};
    const courierFields = hoistCourierFieldsFromItems(group.items);

    return {
      ...group,
      itemIndexes,
      productCodes,
      productCount: group.items.length,
      productCode:
        productCodes.length <= 1
          ? productCodes[0] || first.productCode || ''
          : productCodes.join(', '),
      itemIndex: itemIndexes[0] ?? 0,
      unitIndex: Number(first.unitIndex) || 0,
      amount: group.items.reduce(
        (sum, item) => sum + (Number(item.amount) || 0),
        0,
      ),
      imageUrl: first.imageUrl,
      title: first.title,
      color: first.color,
      size: first.size,
      storage: first.storage,
      model: first.model,
      isGroup: group.items.length > 1,
      cargoServiceType: first.cargoServiceType || group.cargoServiceType || null,
      ...courierFields,
    };
  });
}

/** Handed card top-level maydonlari — items[] dan ko‘tariladi. */
function hoistCourierFieldsFromItems(items = []) {
  const list = Array.isArray(items) ? items : [];
  const accepted = list.find((item) => item?.courierAccepted && item?.courier);
  const handedTimes = list
    .map((item) => item?.handedToCourierAt)
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  return {
    courierAccepted: Boolean(accepted),
    courier: accepted?.courier || null,
    acceptedAt: accepted?.acceptedAt || null,
    handedToCourierAt:
      handedTimes[0]?.toISOString?.() ||
      accepted?.handedToCourierAt ||
      list[0]?.handedToCourierAt ||
      null,
  };
}
