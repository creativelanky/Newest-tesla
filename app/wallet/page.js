'use client';

import { useState } from 'react';
import AuthGate from '@/components/AuthGate';
import DepositFlow from '@/components/DepositFlow';
import WithdrawFlow from '@/components/WithdrawFlow';
import Modal from '@/components/Modal';
import { useStore, formatUSD, portfolioValue, methodLabel } from '@/lib/store';
import { useAccount } from '@/lib/useAccount';
import { IconWalletLine, IconArrowDownLeft, IconArrowUpRight, IconPulse } from '@/components/DeskIcons';

export default function WalletPage() {
  return (
    <AuthGate>
      <Wallet />
    </AuthGate>
  );
}

function Wallet() {
  const account = useAccount();
  const { state: simState } = useStore(); // program-holdings value is still simulated
  const [flow, setFlow] = useState(null); // 'deposit' | 'withdraw'
  if (!account.ready || !account.signedIn || !account.profile) return null;

  const { profile, requests, transactions } = account;
  const portfolio = portfolioValue(simState);

  return (
    <div className="app-shell container-page pb-24 pt-28">
      <p className="stat-label flex items-center gap-2"><span className="live-dot" /> Your account</p>
      <h1 className="mt-2 font-sans text-[20px] font-semibold tracking-tight text-grey-100 sm:text-[24px]">
        Wallet
      </h1>

      {/* Balances */}
      <div className="mt-7 grid gap-4 lg:grid-cols-3">
        <div className="tile tile-feature p-6 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="stat-label">Available balance</span>
            <span className="icon-chip"><IconWalletLine className="h-3.5 w-3.5" /></span>
          </div>
          <div className="figure-xl mt-4">{formatUSD(profile.balance, { cents: true })}</div>
          <div className="mt-6 flex gap-3">
            <button onClick={() => setFlow('deposit')} className="btn-solid btn-sm flex-1 gap-2">
              <IconArrowDownLeft className="h-3.5 w-3.5" /> Deposit
            </button>
            <button onClick={() => setFlow('withdraw')} className="btn-outline btn-sm flex-1 gap-2">
              <IconArrowUpRight className="h-3.5 w-3.5" /> Withdraw
            </button>
          </div>
        </div>

        <div className="tile p-6">
          <span className="stat-label">In positions</span>
          <div className="figure-md mt-3">{formatUSD(portfolio, { cents: true })}</div>
          <p className="mt-2 text-[11px] text-grey-500">Value of your program holdings</p>
        </div>

        <div className="tile p-6">
          <span className="stat-label">Net worth</span>
          <div className="figure-md mt-3">{formatUSD(Number(profile.balance) + portfolio, { cents: true })}</div>
          <p className="mt-2 text-[11px] text-grey-500">Cash plus everything invested</p>
        </div>
      </div>

      {/* Requests + ledger */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="tile overflow-hidden">
          <div className="tile-head">
            <h3 className="tile-title flex items-center gap-2.5">
              <span className="icon-chip"><IconPulse className="h-3.5 w-3.5" /></span>Deposits & withdrawals
            </h3>
            <span className="text-[12px] text-grey-500">{requests.length}</span>
          </div>
          {requests.length === 0 ? (
            <p className="px-5 py-12 text-center text-[13px] text-grey-500">
              No funding requests yet.
            </p>
          ) : (
            <div className="max-h-[26rem] divide-y divide-line overflow-y-auto">
              {requests.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <div className="text-[13px] text-white">
                      {r.kind === 'deposit' ? 'Deposit' : 'Withdrawal'} · {methodLabel(r.method)}
                    </div>
                    <div className="text-[11px] text-grey-600">{new Date(r.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="figure-sm">{formatUSD(r.amount, { cents: true })}</div>
                    <StatusPill status={r.status} kind={r.kind} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="tile overflow-hidden">
          <div className="tile-head">
            <h3 className="tile-title flex items-center gap-2.5">
              <span className="icon-chip"><IconWalletLine className="h-3.5 w-3.5" /></span>Transaction history
            </h3>
            <span className="text-[12px] text-grey-500">{transactions.length}</span>
          </div>
          {transactions.length === 0 ? (
            <p className="px-5 py-12 text-center text-[13px] text-grey-500">Nothing here yet.</p>
          ) : (
            <div className="max-h-[26rem] divide-y divide-line overflow-y-auto">
              {transactions.map((tx) => {
                const positive = tx.type === 'credit' || tx.type === 'sell';
                return (
                  <div key={tx.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <div className="truncate text-[13px] text-grey-100">{tx.label}</div>
                      <div className="text-[11px] text-grey-600">{new Date(tx.created_at).toLocaleString()}</div>
                    </div>
                    <span className={`figure-sm ${positive ? 'text-gain' : 'text-grey-300'}`}>
                      {positive ? '+' : '−'}{formatUSD(tx.amount, { cents: true })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Modal open={flow === 'deposit'} onClose={() => setFlow(null)} title="Deposit funds">
        <DepositFlow onDone={() => setFlow(null)} onSubmitted={account.refresh} />
      </Modal>

      <Modal open={flow === 'withdraw'} onClose={() => setFlow(null)} title="Withdraw funds">
        <WithdrawFlow profile={profile} onDone={() => setFlow(null)} onSubmitted={account.refresh} />
      </Modal>
    </div>
  );
}

export function StatusPill({ status, kind }) {
  const map = {
    pending: {
      cls: 'border-line text-grey-300',
      label: kind === 'withdrawal' ? 'Processing' : 'Pending',
    },
    approved: { cls: 'chip-gain', label: kind === 'withdrawal' ? 'Sent' : 'Credited' },
    rejected: { cls: 'chip-loss', label: 'Declined' },
  };
  const s = map[status] || map.pending;
  return <span className={`pill mt-1 ${s.cls}`}>{s.label}</span>;
}
