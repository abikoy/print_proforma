import { discountFactor, type DiscountSettings } from './discount';

export type PricingMethod = 'per_cm2' | 'fixed';

export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

export interface LineInput {
  method: PricingMethod;
  /** per_cm2: ETB per cm². fixed: ETB per piece. */
  rate: number;
  /** per_cm2: ETB per cm² of lamination. fixed: flat ETB per piece. */
  laminationRate: number;
  areaCm2: number;
  laminated: boolean;
  quantity: number;
  discount: DiscountSettings;
}

export interface LineResult {
  baseUnit: number;
  laminationUnit: number;
  preDiscountUnit: number;
  factor: number;
  unitPrice: number;
  lineTotal: number;
}

/**
 * unit price = (paper cost + lamination cost) x discount factor
 * line total = unit price x quantity
 * Unit price is rounded to 2 decimals first, so printed rows always add up.
 */
export function computeLine(i: LineInput): LineResult {
  const baseUnit = i.method === 'per_cm2' ? i.rate * i.areaCm2 : i.rate;
  const laminationUnit = !i.laminated ? 0 : i.method === 'per_cm2' ? i.laminationRate * i.areaCm2 : i.laminationRate;
  const preDiscountUnit = baseUnit + laminationUnit;
  const factor = discountFactor(i.quantity, i.discount);
  const unitPrice = round2(preDiscountUnit * factor);
  const lineTotal = round2(unitPrice * i.quantity);
  return { baseUnit, laminationUnit, preDiscountUnit, factor, unitPrice, lineTotal };
}

export interface Totals {
  subtotal: number;
  vatAmount: number;
  total: number;
}

export function computeTotals(lineTotals: number[], vatEnabled: boolean, vatRate: number): Totals {
  const subtotal = round2(lineTotals.reduce((sum, n) => sum + n, 0));
  const vatAmount = vatEnabled ? round2((subtotal * vatRate) / 100) : 0;
  return { subtotal, vatAmount, total: round2(subtotal + vatAmount) };
}
