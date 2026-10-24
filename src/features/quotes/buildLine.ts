import { computeLine } from '@/lib/pricing/calc';
import type { DiscountSettings } from '@/lib/pricing/discount';
import { areaCm2, formatSize, type Unit } from '@/lib/pricing/units';
import type { Category, DraftLine, Variant } from '@/types';

export interface BuildLineInput {
  id: string;
  category: Category;
  variant: Variant;
  widthCm: number | null;
  heightCm: number | null;
  note: string;
  laminated: boolean;
  quantity: number;
  discount: DiscountSettings;
  unit: Unit;
}

/** "Business Cards, 300gsm paper, 9 x 5 cm, with lamination" */
export function describeLine(
  categoryName: string,
  variantName: string,
  widthCm: number | null,
  heightCm: number | null,
  note: string,
  laminated: boolean,
  unit: Unit,
): string {
  const parts = [categoryName, variantName];
  const size = formatSize(widthCm, heightCm, unit);
  if (size) parts.push(size);
  if (note.trim()) parts.push(note.trim());
  parts.push(laminated ? 'with lamination' : 'without lamination');
  return parts.join(', ');
}

/** Builds a priced quote line, freezing the rates used so later price edits never change it. */
export function buildLine(i: BuildLineInput): DraftLine {
  const result = computeLine({
    method: i.variant.pricing_method,
    rate: i.variant.rate,
    laminationRate: i.variant.lamination_rate,
    areaCm2: areaCm2(i.widthCm, i.heightCm),
    laminated: i.laminated,
    quantity: i.quantity,
    discount: i.discount,
  });
  return {
    id: i.id,
    categoryId: i.category.id,
    variantId: i.variant.id,
    categoryName: i.category.name,
    variantName: i.variant.name,
    widthCm: i.widthCm,
    heightCm: i.heightCm,
    note: i.note.trim(),
    laminated: i.laminated,
    quantity: i.quantity,
    method: i.variant.pricing_method,
    rate: i.variant.rate,
    laminationRate: i.variant.lamination_rate,
    discountFactor: result.factor,
    unitPrice: result.unitPrice,
    lineTotal: result.lineTotal,
    description: describeLine(i.category.name, i.variant.name, i.widthCm, i.heightCm, i.note, i.laminated, i.unit),
  };
}
