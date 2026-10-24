'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, PageHeader } from '@/components/ui/Card';
import { Field, Input } from '@/components/ui/Fields';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/AuthContext';
import { messageOf } from '@/lib/errors';
import { supabase } from '@/lib/supabase/client';

export default function AccountPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, profile, refreshProfile, signOut } = useAuth();

  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => setName(profile?.full_name ?? ''), [profile?.full_name]);

  async function saveName(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSavingName(true);
    try {
      const { error } = await supabase.from('profiles').update({ full_name: name.trim() }).eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success('Name saved. New proformas will show it as “Prepared by”.');
    } catch (e2) {
      toast.error(messageOf(e2));
    } finally {
      setSavingName(false);
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    setSavingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword('');
      setConfirm('');
      toast.success('Password changed.');
    } catch (e2) {
      toast.error(messageOf(e2));
    } finally {
      setSavingPw(false);
    }
  }

  const pwMismatch = confirm.length > 0 && confirm !== password;

  return (
    <div className="max-w-2xl">
      <PageHeader crumb="Workspace / My account" title="My account" />

      <div className="space-y-6">
        <Card>
          <h2 className="text-base font-semibold text-ink">Profile</h2>
          <form onSubmit={saveName} className="mt-4 space-y-4">
            <Field label="Email" htmlFor="email">
              <Input id="email" value={user?.email ?? ''} disabled readOnly />
            </Field>
            <Field label="Your name" htmlFor="name" hint="Shown as “Prepared by” on new proformas.">
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Button type="submit" loading={savingName} disabled={!name.trim() || name.trim() === profile?.full_name}>
              Save name
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-ink">Change password</h2>
          <form onSubmit={savePassword} className="mt-4 space-y-4">
            <Field label="New password" htmlFor="new-password" hint="At least 6 characters.">
              <PasswordInput id="new-password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <Field label="Confirm new password" htmlFor="confirm-password" error={pwMismatch ? 'Passwords do not match.' : null}>
              <PasswordInput id="confirm-password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </Field>
            <Button type="submit" loading={savingPw} disabled={password.length < 6 || password !== confirm}>
              Change password
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-ink">Sign out</h2>
          <p className="mt-1 text-sm text-muted">You will need to sign in again to see your quotes.</p>
          <Button
            className="mt-4"
            variant="secondary"
            onClick={async () => {
              await signOut();
              router.replace('/login');
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden /> Sign out
          </Button>
        </Card>
      </div>
    </div>
  );
}
