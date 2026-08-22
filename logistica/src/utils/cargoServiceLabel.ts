/**
 * Logistica UI — cargo lane ko‘rsatish.
 * Qoidalar: @volet/cargo-service-rules
 */
import {
  countCargoLanes,
  formatCargoServiceTypeLabel,
  isMixedCargoLanes,
  resolveProductCargoLane,
  resolveStoredCargoServiceType,
} from '@volet/cargo-service-rules';

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export type CargoLaneCounts = {
  standard?: number;
  express?: number;
};

export { isMixedCargoLanes, resolveProductCargoLane, resolveStoredCargoServiceType };

export function formatCargoServiceLabel(
  t: TranslateFn,
  cargoServiceType?: string | null,
  counts?: CargoLaneCounts | null,
) {
  const standard = Math.max(0, Number(counts?.standard) || 0);
  const express = Math.max(0, Number(counts?.express) || 0);
  if (isMixedCargoLanes({ standard, express })) {
    return t('shipments.cargoService.mixed', { express, standard });
  }
  const type =
    cargoServiceType ||
    (express > 0 ? 'express' : standard > 0 ? 'standard' : '');
  return formatCargoServiceTypeLabel(type, {
    express: t('shipments.cargoService.express'),
    standard: t('shipments.cargoService.standard'),
  });
}

function unitMatchKey(shipmentId: string, unitIndex: number) {
  return `${String(shipmentId || '').trim()}:${Number(unitIndex) || 0}`;
}

export function findProductForReturnUnit<
  T extends {
    shipmentId?: string;
    unitIndex?: number;
    cargoServiceType?: string | null;
  },
>(
  products: T[] | undefined,
  shipmentId: string,
  unitIndex: number,
) {
  const key = unitMatchKey(shipmentId, unitIndex);
  return (Array.isArray(products) ? products : []).find(
    (product) =>
      unitMatchKey(String(product.shipmentId || ''), Number(product.unitIndex) || 0) ===
      key,
  );
}

export function selectionHasMixedCargoLanes<
  T extends {
    shipmentId?: string;
    unitIndex?: number;
    cargoServiceType?: string | null;
  },
>(
  products: T[] | undefined,
  units: Array<{ shipmentId: string; unitIndex: number }> | undefined,
) {
  const lanes = new Set<'express' | 'standard'>();
  for (const unit of Array.isArray(units) ? units : []) {
    const product = findProductForReturnUnit(
      products,
      unit.shipmentId,
      unit.unitIndex,
    );
    lanes.add(resolveProductCargoLane(product));
    if (lanes.size > 1) return true;
  }
  return false;
}

export function keepSameLaneSelection<
  T extends {
    shipmentId?: string;
    unitIndex?: number;
    cargoServiceType?: string | null;
  },
>(
  products: T[] | undefined,
  prev: Array<{ shipmentId: string; unitIndex: number }>,
  shipmentId: string,
  unitIndex: number,
) {
  const key = unitMatchKey(shipmentId, unitIndex);
  const current = Array.isArray(prev) ? prev : [];
  const exists = current.some(
    (row) => unitMatchKey(row.shipmentId, row.unitIndex) === key,
  );
  if (exists) {
    return current.filter(
      (row) => unitMatchKey(row.shipmentId, row.unitIndex) !== key,
    );
  }

  const nextLane = resolveProductCargoLane(
    findProductForReturnUnit(products, shipmentId, unitIndex),
  );
  const sameLane = current.filter((row) => {
    const product = findProductForReturnUnit(
      products,
      row.shipmentId,
      row.unitIndex,
    );
    return resolveProductCargoLane(product) === nextLane;
  });
  return [...sameLane, { shipmentId, unitIndex }];
}
