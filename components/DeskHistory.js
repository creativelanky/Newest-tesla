'use client';

import Link from 'next/link';
import { useAccount } from '@/lib/useAccount';
import { formatUSD, methodLabel } from '@/lib/store';
import { IconArrowDownLeft, IconArrowUpRight, IconPulse } from './DeskIcons';

// Status pill styling per funding-request state.
const STATUS = {
  pending: { label: 'Pending', cls: 'chip-warn' },
  approved: { label: 'Approved', cls: 'chip-gain' },
  rejected: { label: 'Declined', cls: 'chip-loss' },
  completed: { label: 'Completed', cls: 'border-line text-grey-400' },
};

// Unified money history shown directly under the balances: every deposit and
// withdrawal (with its live status tag), plus other ledger entries (profit,
// trades) marked completed. Newest first.
export default function DeskHistory({ limit = 8, requests: reqProp, transactions: txProp }) {
  const account = useAccount();
  const requests = reqProp ?? account.requests ?? [];
  const transactions = txProp ?? account.transactions ?? [];

  const rows = buildRows(requests, transactions).slice(0, limit);

  return (
    <div className="tile overflow-hidden">
      <div className="tile-head">
        <h3 className="tile-title flex items-center gap-2.5">
          <span className="icon-chip"><IconPulse className="h-3.5 w-3.5" /></span>
          Transaction history
        </h3>
        <Link href="/wallet" className="text-[12px] uppercase tracking-wider text-grey-400 hover:text-white">
          View all
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="px-5 py-12 text-center text-[14px] text-grey-500">No transactions yet.</p>
      ) : (
        <div className="divide-y divide-line">
          {rows.map((r) => {
            const st = STATUS[r.status] || STATUS.completed;
            return (
              <div key={r.id} className="flex items-center gap-4 px-5 py-4">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border"
                  style={
                    r.sign > 0
                      ? { color: '#34d399', background: 'rgba(52,211,153,0.12)', borderColor: 'rgba(52,211,153,0.3)' }
                      : { color: '#f87171', background: 'rgba(248,113,113,0.12)', borderColor: 'rgba(248,113,113,0.3)' }
                  }
                >
                  {r.sign > 0 ? <IconArrowDownLeft className="h-4 w-4" /> : <IconArrowUpRight className="h-4 w-4" />}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium text-white">{r.label}</div>
                  <div className="text-[12px] text-grey-500">{new Date(r.ts).toLocaleString()}</div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <span className={`num text-[15px] font-semibold ${r.sign > 0 ? 'text-gain' : 'text-grey-100'}`}>
                    {r.sign > 0 ? '+' : '−'}{formatUSD(Math.abs(r.amount), { cents: true })}
                  </span>
                  <span className={`pill ${st.cls}`}>{st.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function buildRows(requests, transactions) {
  const rows = [];

  for (const r of requests) {
    rows.push({
      id: `req-${r.id}`,
      ts: r.created_at,
      label: `${r.kind === 'deposit' ? 'Deposit' : 'Withdrawal'} · ${methodLabel(r.method)}`,
      amount: Number(r.amount),
      sign: r.kind === 'deposit' ? 1 : -1,
      status: r.status, // pending | approved | rejected
    });
  }

  // Ledger entries that aren't the mirror of a funding request (profit, trades,
  // adjustments) — deposits/withdrawals are already covered above by requests.
  for (const t of transactions) {
    if (/deposit|withdrawal/i.test(t.label || '')) continue;
    const credit = t.type === 'credit' || t.type === 'sell';
    rows.push({
      id: `tx-${t.id}`,
      ts: t.created_at,
      label: t.label,
      amount: Number(t.amount),
      sign: credit ? 1 : -1,
      status: 'completed',
    });
  }

  return rows.sort((a, b) => new Date(b.ts) - new Date(a.ts));
}
