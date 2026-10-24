'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Alert, Spinner } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/AuthContext';
import { DataProvider, useData } from '@/features/data/DataContext';
import { DraftProvider } from '@/features/quotes/DraftContext';

function Gate({ children }: { children: ReactNode }) {
  const { loading, error, settings, reload } = useData();
  const { signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Loading your workspace" />
      </div>
    );
  }
  if (error || !settings) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 p-6">
        <Alert tone="danger">{error ?? 'Could not load your settings.'}</Alert>
        <div className="flex gap-2">
          <Button onClick={() => void reload()}>Try again</Button>
          <Button variant="secondary" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }
  return (
    <DraftProvider>
      <AppShell>{children}</AppShell>
    </DraftProvider>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) router.replace('/login');
  }, [loading, session, router]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }
  return (
    <DataProvider>
      <Gate>{children}</Gate>
    </DataProvider>
  );
}
