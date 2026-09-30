'use client';

import { useState } from 'react';
import Link from 'next/link';
import DepositFlow from './DepositFlow';
import WithdrawFlow from './WithdrawFlow';
import { useStore, formatUSD, positionEquity, positionPnL, portfolioValue } from '@/lib/store';
import { useAccount as useRealAccount } from '@/lib/useAccount';
import { useMarket, quoteStats } from '@/lib/market';
import { optionPremium } from '@/lib/options';
import { getTrader, copyValue } from '@/lib/traders';
import { IconWalletLine, IconArrowUpRight, IconArrowDownLeft, IconPulse, IconVerified } from './DeskIcons';

// Simulated-market side of the account (positions, options, copies, program
// holdings, IPO reservation) — still runs on the live price simulation +
// localStorage. Cash, profit and identity (below) are real, from Postgres.
function useSimAccount() {
  const { state } = useStore();
  const { quotes } = useMarket();

  const spx = quotes.SPX;
  const spxPct = spx ? quoteStats(spx).changePct : 0;
  const spot = spx ? spx.price : 0;

  let positionsEquity = 0;
  let openPnL = 0;
  let marginUsed = 0;
  for (const p of state.positions || []) {
    const q = quotes[p.symbol];
    const price = q ? q.price : p.entry;
    positionsEquity += positionEquity(p, price);
    openPnL += positionPnL(p, price);
    marginUsed += p.margin;
  }

  let optionsValue = 0;
  for (const o of state.options || []) {
    const cur = optionPremium({ kind: o.kind, strike: o.strike, spot, days: o.expiry });
    optionsValue += cur * 100 * o.contracts;
  }

  let copiesValue = 0;
  for (const [id, alloc] of Object.entries(state.copies || {})) {
    copiesValue += copyValue(alloc, getTrader(id), spxPct);
  }

  const holdingsValue = portfolioValue(state);
  const ipoReserved = state.ipo?.reserved || 0;
  const invested = positionsEquity + optionsValue + copiesValue + holdingsValue + ipoReserved;

  return { invested, positionsEquity, optionsValue, copiesValue, holdingsValue, ipoReserved, openPnL, marginUsed };
}

// Greeting + balance cards, in plain-English terms. The primary card shows the
// total balance and carries deposit / withdraw directly beneath it. Deposits,
// profit, KYC status and identity are real (Postgres via /api/me); invested
// value remains a separate simulated-market view.
export function Balances() {
  const real = useRealAccount();
  const sim = useSimAccount();
  const [flow, setFlow] = useState(null);
  if (!real.ready || !real.signedIn || !real.profile) return null;

  const profile = real.profile;
  const first = (profile.name || 'Investor').split(' ')[0];
  const accountValue = Number(profile.balance) || 0;
  const deposits = Number(profile.deposit_total) || 0;
  const profit = Number(profile.profit) || 0;
  const profitPct = deposits > 0 ? (profit / deposits) * 100 : 0;
  const kyc = profile.kyc_status;

  // onSubmitted fires right after a successful API call, while the flow
  // component is still showing its own "submitted" screen — refresh data in
  // the background without closing the modal out from under that screen.
  // onDone fires when the user actually dismisses it.

  return (
    <div>
      {/* Page header — deliberately quiet; the figures below carry the weight */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="stat-label flex items-center gap-2">
            <span className="live-dot" /> Trading desk
          </p>
          <h1 className="mt-2 flex flex-wrap items-center gap-2.5 font-sans text-[20px] font-semibold tracking-tight text-grey-100 sm:text-[24px]">
            Welcome back, <span className="uppercase text-white">{first}</span>
            {kyc === 'verified' && (
              <span className="pill chip-gain gap-1">
                <IconVerified className="h-3.5 w-3.5" /> Verified
              </span>
            )}
          </h1>
        </div>
        <span className="pill border-line text-grey-400">
          <span className="live-dot" /> Markets open
        </span>
      </div>

      {/* Suspended accounts — money movement is blocked server-side too */}
      {profile.status === 'suspended' && (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-loss/40 bg-loss/10 px-4 py-3.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-loss/40 text-loss">!</span>
          <span className="text-[13px] leading-relaxed text-loss">
            Your account is suspended. Deposits and withdrawals are disabled — please contact support.
          </span>
        </div>
      )}

      {/* Verification prompt for anyone not yet verified — amber to signal action */}
      {kyc !== 'verified' && profile.status !== 'suspended' && (
        <Link
          href="/verify"
          className="mt-5 flex items-center gap-3 rounded-xl border border-warn/40 bg-warn/[0.10] px-4 py-3.5 transition-colors hover:bg-warn/[0.16]"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-warn/40 bg-warn/[0.12] text-warn">
            <IconVerified className="h-4 w-4" />
          </span>
          <span className="flex-1">
            <span className="block text-[13px] font-semibold text-warn">
              {kyc === 'pending'
                ? 'Verification in review'
                : kyc === 'rejected'
                ? 'Verification needs attention'
                : 'Verify your identity'}
            </span>
            <span className="block text-[11px] text-warn/70">
              {kyc === 'pending'
                ? 'We’re checking your documents — this usually takes a few minutes.'
                : kyc === 'rejected'
                ? 'Your documents couldn’t be verified. Submit again.'
                : 'Required before you can withdraw funds.'}
            </span>
          </span>
          <span className="rounded-md bg-warn px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-black">
            {kyc === 'pending' ? 'Pending' : 'Verify now'}
          </span>
        </Link>
      )}

      <div className="mt-7 grid gap-4 lg:grid-cols-4">
        {/* Primary — total balance (vivid hero) */}
        <div className="hero-aurora relative flex flex-col overflow-hidden rounded-2xl p-6 sm:p-7 lg:col-span-2 lg:row-span-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold uppercase tracking-wider2 text-scarlet">Total balance</span>
            <span
              className="grid h-9 w-9 place-items-center rounded-lg text-scarlet"
              style={{ background: 'rgba(229,72,77,0.16)', border: '1px solid rgba(229,72,77,0.42)' }}
            >
              <IconWalletLine className="h-4 w-4" />
            </span>
          </div>

          <div
            className="mt-5 font-sans text-[clamp(3rem,7vw,4.6rem)] font-bold leading-[0.95] tracking-tight text-white"
            style={{ textShadow: '0 0 40px rgba(229,72,77,0.55)' }}
          >
            {formatUSD(accountValue, { cents: true })}
          </div>

          <div className="mt-4 flex items-center gap-2 text-[14px]">
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold ${
                profit >= 0 ? 'bg-gain/20 text-gain' : 'bg-loss/20 text-loss'
              }`}
            >
              {profit >= 0 ? <IconArrowUpRight className="h-3.5 w-3.5" /> : <IconArrowDownLeft className="h-3.5 w-3.5" />}
              {profit >= 0 ? '+' : '−'}{Math.abs(profitPct).toFixed(2)}%
            </span>
            <span className="text-grey-300">
              {profit >= 0 ? '+' : '−'}{formatUSD(Math.abs(profit), { cents: true })} all-time
            </span>
          </div>

          {/* Deposit / Withdraw */}
          <div className="mt-6 flex flex-row gap-3">
            <button onClick={() => setFlow('deposit')} disabled={profile.status === 'suspended'} className="btn-scarlet btn-sm flex-1 gap-2">
              <IconArrowDownLeft className="h-3.5 w-3.5" /> Deposit
            </button>
            <button onClick={() => setFlow('withdraw')} disabled={profile.status === 'suspended'} className="btn btn-sm flex-1 gap-2 border-white/25 bg-white/5 text-white hover:bg-white/10">
              <IconArrowUpRight className="h-3.5 w-3.5" /> Withdraw
            </button>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <div className="text-[12px] uppercase tracking-wider text-grey-300">Invested</div>
              <div className="mt-1.5 font-sans text-[21px] font-semibold text-white">{formatUSD(sim.invested, { cents: true })}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <div className="text-[12px] uppercase tracking-wider text-grey-300">Margin in use</div>
              <div className="mt-1.5 font-sans text-[21px] font-semibold text-white">{formatUSD(sim.marginUsed, { cents: true })}</div>
            </div>
          </div>
        </div>

        <Card
          label="Total account profit"
          value={`${profit >= 0 ? '+' : '−'}${formatUSD(Math.abs(profit), { cents: true })}`}
          hint="Set by the team as your positions are reviewed"
          tone={profit >= 0 ? 'gain' : 'loss'}
          icon={IconPulse}
          accent={profit >= 0 ? '#34d399' : '#f87171'}
        />
        <Card
          label="Total deposits"
          value={formatUSD(deposits, { cents: true })}
          hint="Money you've added, net of withdrawals"
          icon={IconArrowDownLeft}
          accent="#4f8bff"
        />
        <Card
          label="Available cash"
          value={formatUSD(profile.balance, { cents: true })}
          hint="Ready to invest or withdraw"
          icon={IconWalletLine}
          accent="#25d6e6"
          span
        />
      </div>

      <DepositFlow open={flow === 'deposit'} onClose={() => setFlow(null)} onSubmitted={real.refresh} />
      <WithdrawFlow open={flow === 'withdraw'} profile={profile} onClose={() => setFlow(null)} onSubmitted={real.refresh} />
    </div>
  );
}

function Card({ label, value, hint, tone, span, icon: Icon, accent = '#4f8bff' }) {
  return (
    <div
      className={`tile accent-top lift relative overflow-hidden p-5 sm:p-6 ${span ? 'lg:col-span-2' : ''}`}
      style={{ '--accent': accent }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="stat-label">{label}</span>
        {Icon && (
          <span
            className="grid h-8 w-8 place-items-center rounded-md"
            style={{ color: accent, background: `${accent}22`, border: `1px solid ${accent}55` }}
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div
        className={`stat-value mt-3 text-[clamp(1.9rem,3.4vw,2.5rem)] leading-none ${tone === 'gain' ? 'text-gain' : tone === 'loss' ? 'text-loss' : 'text-white'}`}
      >
        {value}
      </div>
      {hint && <div className="mt-2.5 text-[13px] leading-relaxed text-grey-500">{hint}</div>}
    </div>
  );
}
