export const CURRENCY = 'ETB';

export function formatMoney(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** "ETB 1,250.00" */
export function formatETB(n: number): string {
  return `${CURRENCY} ${formatMoney(n)}`;
}

/** Trims long rates: 0.05 -> "0.05", 0.052 -> "0.052", 120 -> "120" */
export function formatRate(n: number): string {
  return String(Number(n.toFixed(6)));
}

/** 7 -> "0007". Numbers above 9999 simply grow: 10000, 10001 ... */
export function formatProformaNumber(n: number): string {
  return String(n).padStart(4, '0');
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-10-22" -> "22 Oct 2026" (no timezone shifting) */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** Today's date in the user's local time as YYYY-MM-DD. */
export function todayISO(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${mm}-${dd}`;
}

export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
