import { Calculator, History, Layers, Ruler, Store, TrendingDown, type LucideIcon } from 'lucide-react';

export interface SettingsSection {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  { href: '/settings/categories', title: 'Categories and variants', description: 'Organize products and sizes', icon: Layers },
  { href: '/settings/pricing', title: 'Pricing rules', description: 'Rates, pricing methods and lamination', icon: Calculator },
  { href: '/settings/discounts', title: 'Quantity discounts', description: 'Configure discount thresholds', icon: TrendingDown },
  { href: '/settings/measurement-vat', title: 'Measurement and VAT', description: 'Default units and tax rate', icon: Ruler },
  { href: '/settings/shop-profile', title: 'Shop profile', description: 'Logo, contacts and report terms', icon: Store },
  { href: '/settings/price-log', title: 'Price change log', description: 'Old values, new values and timestamps', icon: History },
];
