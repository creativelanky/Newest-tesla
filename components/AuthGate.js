'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useAccount } from '@/lib/useAccount';
import SuspendedScreen from './SuspendedScreen';

// Client-side guard: bounces to /login when there's no signed-in user, and
// locks suspended accounts out of every surface except the ones that pass
// `allowSuspended` (i.e. /support, so they can still reach the team).
export default function AuthGate({ children, allowSuspended = false }) {
  const { state, ready } = useStore();
  const account = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (ready && !state.user) router.replace('/login');
  }, [ready, state.user, router]);

  if (!ready) return <Loading />;
  if (!state.user) return null;

  // Wait for the real profile before deciding — avoids flashing the desk to a
  // suspended user, or the lockout to an active one, during the fetch.
  if (!account.ready) return <Loading />;

  if (!allowSuspended && account.profile?.status === 'suspended') {
    return <SuspendedScreen reason={account.profile.suspend_reason} />;
  }

  return children;
}

function Loading() {
  return (
    <div className="container-page grid min-h-[60vh] place-items-center">
      <div className="flex items-center gap-3 text-grey-400">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
        Loading account…
      </div>
    </div>
  );
}
