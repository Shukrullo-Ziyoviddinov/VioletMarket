type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export type CargoLaneCounts = {
  standard?: number;
  express?: number;
};

export function formatCargoServiceLabel(
  t: TranslateFn,
  cargoServiceType?: string | null,
  counts?: CargoLaneCounts | null,
) {
  const standard = Math.max(0, Number(counts?.standard) || 0);
  const express = Math.max(0, Number(counts?.express) || 0);
  if (standard > 0 && express > 0) {
    return t('shipments.cargoService.mixed', { express, standard });
  }
  const type =
    cargoServiceType ||
    (express > 0 ? 'express' : standard > 0 ? 'standard' : '');
  if (type === 'express') return t('shipments.cargoService.express');
  if (type === 'standard') return t('shipments.cargoService.standard');
  return '';
}
