export interface DiscountSettings {
  startQty: number;
  endQty: number;
  /** Price percentage at (and below) startQty, e.g. 100 */
  startPct: number;
  /** Price percentage at (and above) endQty, e.g. 50 */
  endPct: number;
}

/**
 * Smooth quantity discount.
 * Returns the PRICE FACTOR (1 = full price, 0.5 = half price).
 *
 *  qty <= startQty  -> startPct / 100
 *  qty >= endQty    -> endPct / 100
 *  in between       -> straight line from startPct to endPct
 *
 * All four numbers come from the user's settings; nothing is hard-coded.
 */
export function discountFactor(qty: number, s: DiscountSettings): number {
  const startF = s.startPct / 100;
  const endF = s.endPct / 100;
  if (!(qty > 0)) return startF;
  if (s.endQty <= s.startQty) return qty >= s.startQty ? endF : startF;
  if (qty <= s.startQty) return startF;
  if (qty >= s.endQty) return endF;
  const t = (qty - s.startQty) / (s.endQty - s.startQty);
  return startF + (endF - startF) * t;
}

/** Returns an error message, or null when the settings are valid. */
export function validateDiscount(s: DiscountSettings): string | null {
  const ints = [s.startQty, s.endQty];
  if (ints.some((n) => !Number.isFinite(n) || n < 1 || !Number.isInteger(n))) {
    return 'Quantities must be whole numbers of 1 or more.';
  }
  if (s.endQty <= s.startQty) return 'The ending quantity must be larger than the starting quantity.';
  for (const p of [s.startPct, s.endPct]) {
    if (!Number.isFinite(p) || p < 0 || p > 100) return 'Percentages must be between 0 and 100.';
  }
  return null;
}
