import type { PricingMethod } from '@/lib/pricing/calc';
import type { Unit } from '@/lib/pricing/units';

export type { PricingMethod, Unit };
export type SizeMode = 'preset' | 'custom';

export interface Profile {
  id: string;
  full_name: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  size_mode: SizeMode;
  sort_order: number;
}

export interface Variant {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  width_cm: number | null;
  height_cm: number | null;
  pricing_method: PricingMethod;
  rate: number;
  lamination_rate: number;
  sort_order: number;
}

export interface UserSettings {
  user_id: string;
  unit: Unit;
  vat_rate: number;
  discount_start_qty: number;
  discount_end_qty: number;
  discount_start_pct: number;
  discount_end_pct: number;
  default_validity_days: number;
}

export interface ShopProfile {
  user_id: string;
  name: string;
  phone: string;
  address: string;
  tax_number: string;
  terms: string;
  logo_data_url: string | null;
}

/** Copy of the shop details stored on each quote so old reports never change. */
export interface ShopSnapshot {
  name: string;
  phone: string;
  address: string;
  tax_number: string;
  terms: string;
  logo_data_url: string | null;
}

/** One line of a quote, including the exact prices used when it was added. */
export interface DraftLine {
  id: string;
  categoryId: string | null;
  variantId: string | null;
  categoryName: string;
  variantName: string;
  widthCm: number | null;
  heightCm: number | null;
  note: string;
  laminated: boolean;
  quantity: number;
  method: PricingMethod;
  rate: number;
  laminationRate: number;
  discountFactor: number;
  unitPrice: number;
  lineTotal: number;
  description: string;
}

export interface Quote {
  id: string;
  user_id: string;
  number: number;
  customer_name: string;
  prepared_by: string;
  issue_date: string;
  valid_days: number;
  valid_until: string;
  vat_enabled: boolean;
  vat_rate: number;
  subtotal: number;
  vat_amount: number;
  total: number;
  shop_snapshot: ShopSnapshot;
  created_at: string;
  updated_at: string;
}

export interface QuoteLineRow {
  id: string;
  quote_id: string;
  position: number;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  snapshot: DraftLine;
}

export interface PriceLogEntry {
  id: string;
  changed_at: string;
  item: string;
  field: string;
  old_value: string | null;
  new_value: string | null;
}
