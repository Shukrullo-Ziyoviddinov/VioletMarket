/**
 * Seller Buyurtmalar — bir checkout + bir siller UI bloki.
 * groupKey = orderId:sellerId (cargo groupId emas).
 */

export function resolveSellerOrderGroupKey(order) {
  const fromApi = String(order?.groupKey || '').trim();
  if (fromApi) return fromApi;
  const orderId = Number(order?.orderId) || 0;
  const sellerId = String(order?.sellerId || '').trim();
  return `${orderId}:${sellerId}`;
}

/**
 * Flat unit cardlarini groupKey bo‘yicha bloklarga yig‘adi.
 * Bitta mahsulot → items.length === 1 (eski kabi ishlaydi).
 */
export function groupSellerOrdersByFulfillment(orders = []) {
  const list = Array.isArray(orders) ? orders : [];
  const map = new Map();

  for (const order of list) {
    if (!order) continue;
    const groupKey = resolveSellerOrderGroupKey(order);
    if (!map.has(groupKey)) {
      map.set(groupKey, {
        id: `group-${groupKey}`,
        groupKey,
        orderId: Number(order.orderId) || 0,
        orderCode: String(order.orderCode || ''),
        buyer: order.buyer || order.customer || null,
        orderedAt: order.orderedAt || null,
        trackingStatus: String(order.trackingStatus || ''),
        paymentMethod: order.paymentMethod,
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
    const courierFields = hoistCourierFieldsFromItems(group.items);

    return {
      ...group,
      itemIndexes,
      productCount: group.items.length,
      productCodes,
      productCode:
        productCodes.length <= 1
          ? productCodes[0] || group.items[0]?.productCode || ''
          : productCodes.join(', '),
      itemIndex: itemIndexes[0] ?? 0,
      unitIndex: Number(group.items[0]?.unitIndex) || 0,
      amount: group.items.reduce(
        (sum, item) => sum + (Number(item.amount) || 0),
        0,
      ),
      isGroup: group.items.length > 1,
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
