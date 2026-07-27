import type { ProcessStepKey } from '@/types/shipment';

export const PROCESS_STEPS: {
  key: ProcessStepKey;
  label: string;
  icon: 'cube-outline' | 'car-outline' | 'document-text-outline' | 'business-outline';
}[] = [
  { key: 'xitoy_omborida', label: 'Xitoy omborida', icon: 'cube-outline' },
  { key: 'yolda', label: "Yo'lda", icon: 'car-outline' },
  { key: 'bojxonada', label: 'Bojxonada', icon: 'document-text-outline' },
  { key: 'toshkent_omborida', label: 'Toshkent omborida', icon: 'business-outline' },
];

const PROCESS_STEP_KEYS = new Set(PROCESS_STEPS.map((step) => step.key));

export function normalizeProcessStep(
  value: string | null | undefined,
): ProcessStepKey | null {
  const key = String(value || '').trim();
  if (!key || !PROCESS_STEP_KEYS.has(key as ProcessStepKey)) return null;
  return key as ProcessStepKey;
}
