'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import AuthGate from '@/components/AuthGate';
import InvestModal from '@/components/InvestModal';
import { OPPORTUNITIES, RISK_ORDER } from '@/lib/opportunities';
import { useStore, formatUSD } from '@/lib/store';

const FILTERS = ['All', 'Low', 'Medium', 'High', 'Very High'];
const SORTS = [
  { id: 'return', label: 'Top projected return' },
  { id: 'risk', label: 'Lowest risk' },
  { id: 'min', label: 'Lowest minimum' },
  { id: 'funded', label: 'Most funded' },
];

export default function InvestPage() {
  return (
    <AuthGate>
      <Invest />
    </AuthGate>
  );
}

function Invest() {
  const { state, ready } = useStore();
  const [risk, setRisk] = useState('All');
  const [sort, setSort] = useState('return');
  const [active, setActive] = useState(null);

  const list = useMemo(() => {
    let items = OPPORTUNITIES.filter((o) => risk === 'All' || o.risk === risk);
    items = [...items].sort((a, b) => {
      if (sort === 'return') return b.projected - a.projected;
      if (sort === 'risk') return RISK_ORDER[a.risk] - RISK_ORDER[b.risk];
      if (sort === 'min') return a.price - b.price;
      if (sort === 'funded') return b.fundedPct - a.fundedPct;
      return 0;
    });
    return items;
  }, [risk, sort]);

  if (!ready || !state.user) return null;

  return (
    <div className="app-shell container-page pb-20 pt-32">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Open programs</p>
          <h1 className="h1 mt-3 text-[clamp(2.2rem,5vw,3.6rem)] text-white">Opportunities</h1>
        </div>
        <div className="flex items-center gap-3 border border-line px-5 py-3 text-[13px]">
          <span className="text-grey-400">Available</span>
          <span className="mono font-medium text-white">{formatUSD(state.balance, { cents: true })}</span>
          <Link href="/wallet" className="link-underline text-[13px]">+ Add</Link>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setRisk(f)}
              className={`border px-4 py-2 text-[12px] font-medium tracking-wide transition-colors ${
                risk === f
                  ? 'border-white bg-white text-black'
                  : 'border-line text-grey-300 hover:border-white/40 hover:text-white'
              }`}
            >
              {f === 'All' ? 'All risk' : f}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-3 text-[13px] text-grey-400">
          Sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-line bg-black px-3 py-2 text-[13px] text-white focus:border-white focus:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Grid */}
      <div className="mt-10 grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((opp) => (
          <InvestCard key={opp.id} opp={opp} onInvest={() => setActive(opp)} />
        ))}
      </div>

      {active && (
        <InvestModal opp={active} balance={state.balance} onClose={() => setActive(null)} />
      )}
    </div>
  );
}

function InvestCard({ opp, onInvest }) {
  return (
    <div className="flex h-full flex-col bg-panel p-7">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="h3 text-white">{opp.name}</h3>
          <p className="mono mt-1.5 text-[11px] text-grey-500">{opp.ticker} — {opp.category}</p>
        </div>
        <span className="mono shrink-0 text-[18px] font-medium text-white">{opp.projected.toFixed(1)}%</span>
      </div>
      <p className="body mt-4 flex-1 text-[14px]">{opp.blurb}</p>

      <ul className="mt-5 space-y-2">
        {opp.highlights.map((h) => (
          <li key={h} className="flex gap-3 text-[13px] leading-relaxed text-grey-300">
            <span className="mt-[9px] h-px w-3 shrink-0 bg-grey-600" />
            {h}
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <div className="mb-2 flex items-baseline justify-between text-[11px]">
          <span className="text-grey-500">Funded</span>
          <span className="mono text-grey-300">{opp.fundedPct}%</span>
        </div>
        <div className="h-px w-full bg-white/15">
          <div className="h-px bg-white" style={{ width: `${opp.fundedPct}%` }} />
        </div>
      </div>

      <div className="mt-7 flex items-center justify-between border-t border-line pt-5">
        <div className="text-[12px] text-grey-500">
          From <span className="mono text-grey-100">{formatUSD(opp.price)}</span>
        </div>
        <button onClick={onInvest} className="btn-outline btn-sm">
          Invest
        </button>
      </div>
    </div>
  );
}
