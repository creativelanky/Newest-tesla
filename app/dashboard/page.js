'use client';

import Link from 'next/link';
import AuthGate from '@/components/AuthGate';
import { Balances } from '@/components/DeskAccount';
import DeskChart from '@/components/DeskChart';
import { PositionsTable } from '@/components/DeskTrade';
import DeskWatchlist from '@/components/DeskWatchlist';
import FloatingSpx from '@/components/FloatingSpx';
import MarketTicker from '@/components/MarketTicker';
import LiveActivity from '@/components/LiveActivity';
import DeskHistory from '@/components/DeskHistory';
import { useStore } from '@/lib/store';

export default function DashboardPage() {
  return (
    <AuthGate>
      <Desk />
    </AuthGate>
  );
}

function Desk() {
  const { state, ready } = useStore();
  if (!ready || !state.user) return null;

  return (
    <div className="app-shell container-page pb-24 pt-28">
      <FloatingSpx />
      <Balances />

      {/* Transaction history — deposits/withdrawals with live status tags */}
      <div className="mt-6">
        <DeskHistory />
      </div>

      {/* Live market ticker — constant motion */}
      <div className="mt-6 overflow-hidden rounded-xl border border-line">
        <MarketTicker />
      </div>

      {/* Live chart + watchlist + streaming desk feed */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <DeskChart />
        <div className="flex flex-col gap-6">
          <DeskWatchlist />
          <LiveActivity rows={6} />
        </div>
      </div>

      {/* Open positions */}
      <div className="mt-6">
        <PositionsTable />
      </div>
    </div>
  );
}
