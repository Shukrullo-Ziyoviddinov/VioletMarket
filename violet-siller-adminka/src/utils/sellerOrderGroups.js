/**
 * Seller Buyurtmalar — fulfillment guruhi: orderId:sellerId (bitta tasdiqlash/yig‘ish).
 * groupKey lane emas; xorijda faqat cargoPackages[] ichida Standard/Express vizual paket.
 */

import {
  normalizeCargoServiceType,
  resolveStoredCargoServiceType,
} from '@volet/cargo-service-rules';
import { resolveSellerPipelineMode } from './sellerPipeline';

export function resolveSellerOrderGroupKey(order) {
  const fromApi = String(order?.groupKey || '').trim();
  if (fromApi) return fromApi;
  const orderId = Number(order?.orderId) || 0;
  const sellerId = String(order?.sellerId || '').trim();
  return `${orderId}:${sellerId}`;
}

export function isForeignSellerOrder(order) {
  const mode = String(order?.pipelineMode || '').trim();
  if (mode === 'foreign') return true;
  if (mode === 'local') return false;

  const fromItems = Array.isArray(order?.items)
    ? order.items.find((item) => String(item?.pipelineMode || '').trim())
    : null;
  const itemMode = String(fromItems?.pipelineMode || '').trim();
  if (itemMode === 'foreign') return true;
  if (itemMode === 'local') return false;

  const country =
    order?.sellerCountry ||
    fromItems?.sellerCountry ||
    order?.items?.[0]?.sellerCountry ||
    '';
  return resolveSellerPipelineMode(country) === 'foreign';
}

export function resolveItemCargoServiceType(item) {
  return (
    normalizeCargoServiceType(item?.cargoServiceType) ||
    normalizeCargoServiceType(item?.cargoShipment?.cargoServiceType)
  );
}

/** Eski yozuv / yo‘q maydon → Standard (@volet/cargo-service-rules). */
export function resolveStoredItemCargoLane(item) {
  return resolveStoredCargoServiceType(resolveItemCargoServiceType(item));
}

/**
 * Cargodan OLDIN: vizual paket belgisi.
 * `#0012` = buyurtma kodi (orderCode), `-EX`/`-ST` = Express/Standard tarif.
 * Bu mahsulot shtrixi emas (`productCode` = `#0045`) va DB’da yo‘q.
 * Cargodan KEYIN: `resolvePackageCode` o‘rniga `requestCode` (REQ-…) qo‘yadi.
 */
export function buildPackageBarcode(orderCode, type) {
  const base = String(orderCode || '').trim() || '#0000';
  return type === 'express' ? `${base}-EX` : `${base}-ST`;
}

export function resolvePackageCode(requestCodes, orderCode, type) {
  const codes = [
    ...new Set(
      (Array.isArray(requestCodes) ? requestCodes : [])
        .map((code) => String(code || '').trim())
        .filter(Boolean),
    ),
  ];
  if (codes.length === 1) {
    return { packageCode: codes[0], packageCodeKind: 'request' };
  }
  if (codes.length > 1) {
    return { packageCode: codes.join(', '), packageCodeKind: 'request' };
  }
  return {
    packageCode: buildPackageBarcode(orderCode, type),
    packageCodeKind: 'synthetic',
  };
}

function listOrderUnits(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  if (items.length) return items;
  return order ? [order] : [];
}

/**
 * Faqat xorij: Express va Standard alohida paket.
 * UZB / local → har doim null.
 */
export function buildSellerCargoPackages(order) {
  if (!isForeignSellerOrder(order)) return null;

  const units = listOrderUnits(order);
  if (!units.length) return null;
  if (!units.some((item) => resolveItemCargoServiceType(item))) return null;

  const orderCode = String(order?.orderCode || units[0]?.orderCode || '').trim();
  const buckets = {
    express: [],
    standard: [],
  };

  for (const item of units) {
    const type = resolveStoredItemCargoLane(item);
    buckets[type].push(item);
  }

  const packages = [];
  for (const type of ['express', 'standard']) {
    const items = buckets[type];
    if (!items.length) continue;
    const productCodes = [
      ...new Set(
        items
          .map((item) => String(item.productCode || '').trim())
          .filter(Boolean),
      ),
    ];
    const requestCodes = [
      ...new Set(
        items
          .map((item) => String(item?.cargoShipment?.requestCode || '').trim())
          .filter(Boolean),
      ),
    ];
    const { packageCode, packageCodeKind } = resolvePackageCode(
      requestCodes,
      orderCode,
      type,
    );
    packages.push({
      type,
      items,
      productCodes,
      requestCodes,
      packageCode,
      packageCodeKind,
      productCount: items.length,
      amount: items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    });
  }

  return packages.length ? packages : null;
}

export function resolveSellerCargoPackages(order) {
  if (!isForeignSellerOrder(order)) return null;
  if (Array.isArray(order?.cargoPackages) && order.cargoPackages.length) {
    return order.cargoPackages;
  }
  return buildSellerCargoPackages(order);
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
        pipelineMode: order.pipelineMode || 'local',
        sellerCountry: String(order.sellerCountry || ''),
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
    const grouped = {
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
    return {
      ...grouped,
      cargoPackages: buildSellerCargoPackages(grouped),
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
