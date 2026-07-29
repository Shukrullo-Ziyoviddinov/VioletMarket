import type { ProcessStepKey } from '@/types/shipment';

/** Yuklarim ish stoli — Toshkent yo‘q (UZBda Clientga yuborish) */
export const YUKLARIM_PROCESS_STEPS: {
  key: Exclude<ProcessStepKey, 'toshkent_omborida'>;
  label: string;
  icon: 'cube-outline' | 'car-outline' | 'document-text-outline';
}[] = [
  { key: 'xitoy_omborida', label: 'Xitoy omborida', icon: 'cube-outline' },
  { key: 'yolda', label: "Yo'lda", icon: 'car-outline' },
  { key: 'bojxonada', label: 'Bojxonada', icon: 'document-text-outline' },
];

/** Barcha process steplar (normalize uchun) */
export const PROCESS_STEPS: {
  key: ProcessStepKey;
  label: string;
  icon:
    | 'cube-outline'
    | 'car-outline'
    | 'document-text-outline'
    | 'business-outline';
}[] = [
  ...YUKLARIM_PROCESS_STEPS,
  {
    key: 'toshkent_omborida',
    label: 'Toshkent omborida',
    icon: 'business-outline',
  },
];

const PROCESS_STEP_KEYS = new Set(PROCESS_STEPS.map((step) => step.key));

export function normalizeProcessStep(
  value: string | null | undefined,
): ProcessStepKey | null {
  const key = String(value || '').trim();
  if (!key || !PROCESS_STEP_KEYS.has(key as ProcessStepKey)) return null;
  return key as ProcessStepKey;
}

export function isUzWarehouseFlowStep(step: string | null | undefined) {
  const key = String(step || '').trim();
  return key === 'bojxonada' || key === 'toshkent_omborida';
}
