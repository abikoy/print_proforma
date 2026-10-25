/**
 * Units of measurement.
 *
 * All sizes are STORED in centimetres and all rates are STORED per cm².
 * The unit setting only changes how sizes are typed and displayed.
 */
export const UNITS = ['mm', 'cm', 'inch', 'm'] as const;
export type Unit = (typeof UNITS)[number];

const CM_PER_UNIT: Record<Unit, number> = {
  mm: 0.1,
  cm: 1,
  inch: 2.54,
  m: 100,
};

export const UNIT_NAMES: Record<Unit, string> = {
  mm: 'Millimetres (mm)',
  cm: 'Centimetres (cm)',
  inch: 'Inches (inch)',
  m: 'Metres (m)',
};

export function toCm(value: number, unit: Unit): number {
  return value * CM_PER_UNIT[unit];
}

export function fromCm(cm: number, unit: Unit): number {
  return cm / CM_PER_UNIT[unit];
}

/** Area in cm² from a width and height in cm. */
export function areaCm2(widthCm: number | null, heightCm: number | null): number {
  if (!widthCm || !heightCm || widthCm <= 0 || heightCm <= 0) return 0;
  return widthCm * heightCm;
}

/** "9", "8.5", "3.35": at most 2 decimals, no trailing zeros. */
export function formatDimension(cm: number, unit: Unit): string {
  return String(Number(fromCm(cm, unit).toFixed(2)));
}

/** "9 x 5 cm" */
export function formatSize(widthCm: number | null, heightCm: number | null, unit: Unit): string {
  if (!widthCm || !heightCm) return '';
  return `${formatDimension(widthCm, unit)} x ${formatDimension(heightCm, unit)} ${unit}`;
}
/** How many cm² are in one square unit (1 m² = 10,000 cm²). */
export const cm2PerUnit2 = (u: Unit) => CM_PER_UNIT[u] ** 2;

/** Stored rate (per cm²) to the rate shown per square unit. */
export const rateToUnit = (perCm2: number, u: Unit) => Number((perCm2 * cm2PerUnit2(u)).toFixed(6));

/** Rate typed per square unit to the stored rate per cm². */
export const rateFromUnit = (perUnit2: number, u: Unit) => Number((perUnit2 / cm2PerUnit2(u)).toFixed(6));

/** "m²", "cm²", "in²" */
export const areaLabel = (u: Unit) => (u === 'inch' ? 'in²' : `${u}²`);
