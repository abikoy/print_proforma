'use client';

import type { Session, User } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { LogoTile } from '@/components/ui/Logo';
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client';
import type { Profile } from '@/types';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  /** True until the first session check has finished. */
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function SetupNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-card p-8 shadow-card">
        <LogoTile className="mb-4" />
        <h1 className="text-xl font-bold text-ink">Connect PrintQuote to Supabase</h1>
        <p className="mt-2 text-sm text-body">The app needs your Supabase project address and public key before anyone can sign in.</p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-body">
          <li>
            Copy <code className="rounded bg-elevated px-1.5 py-0.5">frontend/.env.local.example</code> to{' '}
            <code className="rounded bg-elevated px-1.5 py-0.5">frontend/.env.local</code>.
          </li>
          <li>Paste your project URL and anon key (Supabase dashboard, Project Settings, API).</li>
          <li>Run the SQL files in backend/supabase/migrations (see backend/README.md).</li>
          <li>Restart the dev server.</li>
        </ol>
      </div>
    </div>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    // Keep this callback synchronous: awaiting Supabase calls in here can deadlock the auth client.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id ?? null;

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data } = await supabase.from('profiles').select('id, full_name').eq('id', userId).maybeSingle();
    setProfile((data as Profile | null) ?? null);
  }, [userId]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    try {
      sessionStorage.removeItem('pq-draft');
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<AuthState>(
    () => ({ session, user: session?.user ?? null, profile, loading, refreshProfile: fetchProfile, signOut }),
    [session, profile, loading, fetchProfile, signOut],
  );

  if (!isSupabaseConfigured) return <SetupNotice />;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
