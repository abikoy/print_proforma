'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { PageHeader } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import { SETTINGS_SECTIONS } from '@/features/settings/sections';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isIndex = pathname === '/settings';

  return (
    <div>
      <PageHeader crumb="Workspace / Settings" title="Settings" subtitle="Manage your own prices, products and shop information." />
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* On phones the list is the Settings page; on desktop it is always visible beside the form. */}
        <nav aria-label="Settings sections" className={cn(isIndex ? 'block' : 'hidden lg:block')}>
          <ul className="space-y-2">
            {SETTINGS_SECTIONS.map(({ href, title, description, icon: Icon }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border p-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                      active ? 'border-accent bg-tint' : 'border-line bg-card hover:bg-elevated',
                    )}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-elevated text-accent">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-ink">{title}</span>
                      <span className="block truncate text-xs text-muted">{description}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted lg:hidden" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={cn('min-w-0', isIndex ? 'hidden lg:block' : 'block')}>
          {!isIndex && (
            <Link href="/settings" className="mb-4 inline-flex items-center gap-1 text-sm text-accent hover:underline lg:hidden">
              <ChevronLeft className="h-4 w-4" aria-hidden /> All settings
            </Link>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
