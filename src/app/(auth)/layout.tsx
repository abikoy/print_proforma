'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { LogoTile } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useAuth } from '@/features/auth/AuthContext';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && session) router.replace('/new-proforma');
  }, [loading, session, router]);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex justify-end bg-navy px-4 py-2">
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-6 flex flex-col items-center text-center">
            <LogoTile className="mb-3 h-14 w-14" />
            <p className="text-2xl font-bold text-ink">PrintQuote</p>
            <p className="text-sm text-muted">Quotation workspace</p>
          </div>
          <div className="rounded-2xl border border-line bg-card p-6 shadow-card sm:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
