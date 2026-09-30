'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { call } from '@/lib/api';

// Gate for the console. Verifies admin rights server-side (every /api/admin/**
// route re-checks too). Anyone without a session is sent to the dedicated
// /admin/login; a signed-in non-admin is offered a way to sign out and retry.
export default function AdminGate({ children }) {
  const router = useRouter();
  const [status, setStatus] = useState('checking'); // checking | allowed | denied

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace('/admin/login');
        return;
      }
      const who = await call('/api/admin/whoami');
      if (!active) return;
      setStatus(who.ok && who.data?.isAdmin ? 'allowed' : 'denied');
    })();
    return () => {
      active = false;
    };
  }, [router]);

  if (status === 'checking') {
    return (
      <div className="grid min-h-screen place-items-center bg-ink">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="grid min-h-screen place-items-center bg-ink px-6">
        <div className="tile w-full max-w-sm p-8 text-center">
          <h1 className="text-[18px] font-semibold text-white">No admin access</h1>
          <p className="mt-2 text-[12px] leading-relaxed text-grey-500">
            You’re signed in, but this account isn’t an administrator.
          </p>
          <button
            onClick={async () => {
              await supabaseBrowser().auth.signOut();
              router.replace('/admin/login');
            }}
            className="btn-outline btn-sm mt-6 w-full"
          >
            Sign in as admin
          </button>
        </div>
      </div>
    );
  }

  return children;
}
