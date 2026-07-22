/**
 * Naqd to‘lov: qaytim hisoblash.
 * Misol: due=120000, received=150000 → change=30000
 */

export function parseMoneyInput(raw: string): number | null {
  const cleaned = String(raw || '')
    .trim()
    .replace(/\s/g, '')
    .replace(/,/g, '.')
    .replace(/[^\d.]/g, '');
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.floor(value);
}

export type CashChangeResult = {
  dueAmount: number;
  receivedAmount: number;
  changeAmount: number;
  /** Olingan summa >= mahsulot narxi */
  canConfirm: boolean;
  isShort: boolean;
};

export function calcCashChange(
  dueAmount: number,
  receivedAmount: number | null,
): CashChangeResult {
  const due = Math.max(0, Math.round(Number(dueAmount) || 0));
  const received =
    receivedAmount == null || !Number.isFinite(receivedAmount)
      ? 0
      : Math.max(0, Math.round(receivedAmount));
  const changeAmount = Math.max(0, received - due);
  const canConfirm = received >= due;
  return {
    dueAmount: due,
    receivedAmount: received,
    changeAmount,
    canConfirm,
    isShort: received > 0 && received < due,
  };
}
