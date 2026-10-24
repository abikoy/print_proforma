import { describe, expect, it } from 'vitest';
import { buildLine } from '@/features/quotes/buildLine';
import { addDaysISO, formatDate, formatProformaNumber } from '@/lib/format';
import { areaCm2, computeLine, computeTotals, discountFactor, formatSize, fromCm, toCm, validateDiscount } from '@/lib/pricing';
import type { Category, Variant } from '@/types';

const discount = { startQty: 100, endQty: 1000, startPct: 100, endPct: 50 };

describe('units', () => {
  it('converts to and from cm', () => {
    expect(toCm(10, 'mm')).toBeCloseTo(1);
    expect(toCm(2, 'inch')).toBeCloseTo(5.08);
    expect(toCm(1.5, 'm')).toBeCloseTo(150);
    expect(fromCm(5.08, 'inch')).toBeCloseTo(2);
  });
  it('computes area and formats sizes', () => {
    expect(areaCm2(9, 5)).toBe(45);
    expect(areaCm2(null, 5)).toBe(0);
    expect(formatSize(8.5, 5.5, 'cm')).toBe('8.5 x 5.5 cm');
    expect(formatSize(9, 5, 'mm')).toBe('90 x 50 mm');
  });
});

describe('discountFactor', () => {
  it('stays at the start percentage at and below the start quantity', () => {
    expect(discountFactor(1, discount)).toBe(1);
    expect(discountFactor(100, discount)).toBe(1);
  });
  it('stays at the end percentage at and above the end quantity', () => {
    expect(discountFactor(1000, discount)).toBe(0.5);
    expect(discountFactor(5000, discount)).toBe(0.5);
  });
  it('falls evenly in between', () => {
    expect(discountFactor(550, discount)).toBeCloseTo(0.75);
    expect(discountFactor(325, discount)).toBeCloseTo(0.875);
  });
  it('uses whatever the user configured', () => {
    const custom = { startQty: 50, endQty: 250, startPct: 100, endPct: 80 };
    expect(discountFactor(150, custom)).toBeCloseTo(0.9);
  });
  it('validates settings', () => {
    expect(validateDiscount(discount)).toBeNull();
    expect(validateDiscount({ ...discount, endQty: 100 })).not.toBeNull();
    expect(validateDiscount({ ...discount, endPct: 120 })).not.toBeNull();
  });
});

describe('computeLine', () => {
  const base = { method: 'per_cm2' as const, rate: 0.05, laminationRate: 0.02, areaCm2: 45, discount };
  it('prices per cm2 without lamination', () => {
    const r = computeLine({ ...base, laminated: false, quantity: 100 });
    expect(r.unitPrice).toBe(2.25);
    expect(r.lineTotal).toBe(225);
  });
  it('adds lamination per cm2', () => {
    const r = computeLine({ ...base, laminated: true, quantity: 100 });
    expect(r.unitPrice).toBe(3.15);
    expect(r.lineTotal).toBe(315);
  });
  it('applies the quantity discount', () => {
    const r = computeLine({ ...base, laminated: false, quantity: 1000 });
    expect(r.factor).toBe(0.5);
    expect(r.unitPrice).toBe(1.13);
    expect(r.lineTotal).toBe(1130);
  });
  it('supports fixed prices with a flat lamination fee', () => {
    const r = computeLine({ method: 'fixed', rate: 120, laminationRate: 15, areaCm2: 0, laminated: true, quantity: 10, discount });
    expect(r.unitPrice).toBe(135);
    expect(r.lineTotal).toBe(1350);
  });
});

describe('computeTotals', () => {
  it('adds VAT only when enabled', () => {
    expect(computeTotals([100, 50.5], false, 15)).toEqual({ subtotal: 150.5, vatAmount: 0, total: 150.5 });
    expect(computeTotals([100, 50.5], true, 15)).toEqual({ subtotal: 150.5, vatAmount: 22.58, total: 173.08 });
  });
});

describe('buildLine', () => {
  const category: Category = { id: 'c1', user_id: 'u', name: 'Business Cards', icon: 'contact', size_mode: 'preset', sort_order: 0 };
  const variant: Variant = {
    id: 'v1', user_id: 'u', category_id: 'c1', name: '300gsm paper', width_cm: 9, height_cm: 5,
    pricing_method: 'per_cm2', rate: 0.05, lamination_rate: 0.02, sort_order: 0,
  };
  it('describes size and lamination status and freezes the prices', () => {
    const line = buildLine({
      id: 'l1', category, variant, widthCm: 9, heightCm: 5, note: '', laminated: true, quantity: 100, discount, unit: 'cm',
    });
    expect(line.description).toBe('Business Cards, 300gsm paper, 9 x 5 cm, with lamination');
    expect(line.unitPrice).toBe(3.15);
    expect(line.rate).toBe(0.05);
  });
});

describe('format helpers', () => {
  it('pads proforma numbers', () => {
    expect(formatProformaNumber(1)).toBe('0001');
    expect(formatProformaNumber(12345)).toBe('12345');
  });
  it('formats and shifts dates without timezone drift', () => {
    expect(formatDate('2026-10-22')).toBe('22 Oct 2026');
    expect(addDaysISO('2026-10-22', 15)).toBe('2026-11-06');
    expect(addDaysISO('2026-12-25', 10)).toBe('2027-01-04');
  });
});
