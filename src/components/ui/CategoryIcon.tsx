import {
  BookOpen,
  Contact,
  FileText,
  Image as ImageIcon,
  Layers,
  LayoutTemplate,
  Mail,
  Newspaper,
  Package,
  Printer,
  Receipt,
  ScrollText,
  Stamp,
  Tag,
  Ticket,
  type LucideIcon,
} from 'lucide-react';

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  contact: Contact,
  'file-text': FileText,
  'book-open': BookOpen,
  layout: LayoutTemplate,
  mail: Mail,
  printer: Printer,
  package: Package,
  image: ImageIcon,
  layers: Layers,
  newspaper: Newspaper,
  receipt: Receipt,
  scroll: ScrollText,
  stamp: Stamp,
  tag: Tag,
  ticket: Ticket,
};

export const ICON_KEYS = Object.keys(CATEGORY_ICONS);

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = CATEGORY_ICONS[name] ?? Printer;
  return <Icon className={className} aria-hidden />;
}
