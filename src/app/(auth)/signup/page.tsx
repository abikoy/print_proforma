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

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError('Use a password of at least 6 characters.');
    if (password !== confirm) return setError('The two passwords do not match.');

    setBusy(true);
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });
    setBusy(false);

    if (err) return setError(messageOf(err));
    if (data.session) {
      localStorage.setItem('pq-welcome', '1');
      router.replace('/new-proforma');
      return;
    }
    // Email confirmation is switched on in Supabase: no session until the link is clicked.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return setError('That email is already registered. Try signing in instead.');
    }
    setNotice('Account created. Check your email and click the confirmation link, then sign in.');
  }

  if (notice) {
    return (
      <div className="space-y-4">
        <Alert tone="success">{notice}</Alert>
        <Link href="/login" className="block text-center text-sm text-accent hover:underline">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <h1 className="text-xl font-bold text-ink">Create your account</h1>
      <p className="-mt-2 text-sm text-muted">You get your own price list, shop details and quote history.</p>
      {error && <Alert tone="danger">{error}</Alert>}
      <Field label="Your name" htmlFor="name" hint="Shown as “Prepared by” on your proformas.">
        <Input id="name" autoComplete="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </Field>
      <Field label="Email" htmlFor="email">
        <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Password" htmlFor="password">
        <PasswordInput id="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <Field label="Confirm password" htmlFor="confirm">
        <PasswordInput id="confirm" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </Field>
      <Button type="submit" size="lg" block loading={busy} disabled={!fullName.trim() || !email.trim() || !password || !confirm}>
        Create account
      </Button>
      <p className="text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
