'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Fields';
import { Alert } from '@/components/ui/Feedback';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { messageOf } from '@/lib/errors';
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (err) {
      setError(err.message === 'Invalid login credentials' ? 'That email and password do not match.' : messageOf(err));
      return;
    }
    router.replace('/new-proforma');
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <h1 className="text-xl font-bold text-ink">Sign in</h1>
      {error && <Alert tone="danger">{error}</Alert>}
      <Field label="Email" htmlFor="email">
        <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Password" htmlFor="password">
        <PasswordInput id="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <Button type="submit" size="lg" block loading={busy} disabled={!email.trim() || !password}>
        Sign in
      </Button>
      <div className="flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-accent hover:underline">
          Forgot password?
        </Link>
        <Link href="/signup" className="text-accent hover:underline">
          Create an account
        </Link>
      </div>
    </form>
  );
}
