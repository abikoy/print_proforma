'use client';

import { Menu, UserCircle2, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { LogoTile } from '@/components/ui/Logo';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 flex items-center justify-between bg-navy px-4 py-3 text-white print:hidden sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg p-2 text-white/90 hover:bg-white/10 lg:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
          <Link href="/new-proforma" className="flex items-center gap-3">
            <LogoTile />
            <span className="leading-tight">
              <span className="block text-lg font-bold">PrintQuote</span>
              <span className="block text-xs text-white/75">Quotation workspace</span>
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link
            href="/account"
            aria-label="My account"
            className="rounded-lg p-2 text-white/90 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <UserCircle2 className="h-5 w-5" aria-hidden />
          </Link>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-[68px] hidden h-[calc(100vh-68px)] w-64 shrink-0 overflow-y-auto border-r border-line bg-card print:hidden lg:block">
          <Sidebar />
        </aside>

        {menuOpen && (
          <div className="fixed inset-x-0 bottom-0 top-[68px] z-20 bg-black/40 print:hidden lg:hidden" onClick={() => setMenuOpen(false)}>
            <aside className="h-full w-64 max-w-[80%] border-r border-line bg-card" onClick={(e) => e.stopPropagation()}>
              <Sidebar onNavigate={() => setMenuOpen(false)} />
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1 p-4 print:p-0 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
