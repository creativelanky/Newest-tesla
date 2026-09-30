'use client';

// Real account data — fetched from /api/me (backed by Postgres), replacing
// the localStorage business-data read for the pages that need to be real:
// dashboard balances, wallet, KYC/verify, and support messaging.
import { useCallback, useEffect, useState } from 'react';
import { fetchMe, fetchAdminOverview } from './api';
import { useStore } from './store';

const EMPTY = {
  profile: null,
  holdings: [],
  positions: [],
  options: [],
  copies: [],
  ipo: { reserved: 0 },
  transactions: [],
  requests: [],
  kycDocs: [],
  messages: [],
};

export function useAccount() {
  const { state: authState, ready: authReady } = useStore(); // identity only
  const [account, setAccount] = useState(EMPTY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!authState.user) {
      setAccount(EMPTY);
      setLoading(false);
      return;
    }
    const res = await fetchMe();
    if (res.ok) setAccount(res.data);
    setLoading(false);
  }, [authState.user]);

  useEffect(() => {
    if (!authReady) return;
    refresh();
  }, [authReady, refresh]);

  return {
    ready: authReady && !loading,
    signedIn: !!authState.user,
    ...account,
    refresh,
  };
}

const ADMIN_EMPTY = { users: [], requests: [], kycDocsByUser: {} };

// Whole-platform dataset for the admin console.
export function useAdminOverview() {
  const [data, setData] = useState(ADMIN_EMPTY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetchAdminOverview();
    if (res.ok) setData(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...data, loading, ready: !loading, refresh };
}
