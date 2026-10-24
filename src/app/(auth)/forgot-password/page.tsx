'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Fields';
import { Alert } from '@/components/ui/Feedback';
import { messageOf } from '@/lib/errors';
import { supabase } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    // The email link signs the user in and lands on My Account, where they can set a new password.
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/account`,
    });
    setBusy(false);
    if (err) return setError(messageOf(err));
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <Alert tone="success">If that email has an account, a reset link is on its way. Open it to choose a new password.</Alert>
        <Link href="/login" className="block text-center text-sm text-accent hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <h1 className="text-xl font-bold text-ink">Reset your password</h1>
      <p className="-mt-2 text-sm text-muted">Enter your email and we will send you a link.</p>
      {error && <Alert tone="danger">{error}</Alert>}
      <Field label="Email" htmlFor="email">
        <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Button type="submit" size="lg" block loading={busy} disabled={!email.trim()}>
        Send reset link
      </Button>
      <Link href="/login" className="block text-center text-sm text-accent hover:underline">
        Back to sign in
      </Link>
    </form>
  );
}
