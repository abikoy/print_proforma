'use client';

import { History, PlusSquare, Settings, UserRound, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

const ITEMS: Array<{ href: string; label: string; icon: LucideIcon; match: string[] }> = [
  { href: '/new-proforma', label: 'New Proforma', icon: PlusSquare, match: ['/new-proforma', '/report'] },
  { href: '/history', label: 'History', icon: History, match: ['/history'] },
  { href: '/settings', label: 'Settings', icon: Settings, match: ['/settings'] },
  { href: '/account', label: 'My Account', icon: UserRound, match: ['/account'] },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="px-3 py-4">
      <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-muted">Workspace</p>
      <ul className="space-y-1">
        {ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = match.some((m) => pathname === m || pathname.startsWith(`${m}/`));
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  active ? 'bg-tint text-ink' : 'text-body hover:bg-elevated',
                )}
              >
                <Icon className={cn('h-[18px] w-[18px]', active && 'text-accent')} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
