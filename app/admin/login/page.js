'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { call } from '@/lib/api';
import { IconShieldCheck } from '@/components/DeskIcons';
import PasswordField from '@/components/PasswordField';

// Standalone admin sign-in. Authenticates directly against Supabase, verifies
// the account is actually an admin, then goes straight to the console —
// no user dashboard in between.
export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');

    const supabase = supabaseBrowser();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setBusy(false);
      return setError('Incorrect email or password.');
    }

    // Confirm this account actually has admin rights before proceeding.
    const who = await call('/api/admin/whoami');
    if (!who.ok || !who.data?.isAdmin) {
      await supabase.auth.signOut();
      setBusy(false);
      return setError('This account does not have admin access.');
    }

    router.replace('/admin');
  }

  return (
    <div className="admin flex min-h-screen items-center justify-center bg-ink px-6 font-sans">
      <form onSubmit={submit} className="w-full max-w-sm">
        <div className="tile p-8">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg border border-line bg-card2 text-grey-200">
            <IconShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="mt-5 text-center text-[20px] font-semibold text-white">Admin console</h1>
          <p className="mt-1.5 text-center text-[12px] text-grey-500">Sign in with your administrator credentials.</p>

          <label className="label mt-7">Email</label>
          <input
            type="email"
            autoFocus
            className="input"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
          />

          <label className="label mt-4">Password</label>
          <PasswordField
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
          />

          {error && (
            <p className="mt-4 rounded-lg border border-loss/40 bg-loss/10 px-3 py-2 text-[12px] text-loss">{error}</p>
          )}

          <button type="submit" disabled={busy} className="btn-solid mt-6 w-full">
            {busy ? 'Signing in…' : 'Enter console'}
          </button>
        </div>
        <p className="mt-6 text-center text-[11px] text-grey-600">Authorised personnel only.</p>
      </form>
    </div>
  );
}
