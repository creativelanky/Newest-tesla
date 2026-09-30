'use client';

import Link from 'next/link';
import { formatUSD } from '@/lib/store';

// Square-cornered data panel. No glow, no gradient — the numbers do the work.
export default function OpportunityCard({ opp, href, onInvest, cta = 'Invest' }) {
  return (
    <div className="group flex h-full flex-col border border-line bg-panel p-7 transition-colors duration-300 hover:border-white/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="h3 text-white">{opp.name}</h3>
          <p className="mono mt-1.5 text-[11px] tracking-wider2 text-grey-500">
            {opp.ticker} — {opp.category}
          </p>
        </div>
        <span className="mono shrink-0 text-right text-[22px] font-medium leading-none text-white">
          {opp.projected.toFixed(1)}
          <span className="text-[13px] text-grey-500">%</span>
        </span>
      </div>

      <p className="body mt-5 flex-1">{opp.blurb}</p>

      <ul className="mt-6 space-y-2 border-t border-line pt-5">
        {opp.highlights.map((h) => (
          <li key={h} className="flex gap-3 text-[13px] leading-relaxed text-grey-300">
            <span className="mt-[9px] h-px w-3 shrink-0 bg-grey-600" />
            {h}
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[11px] tracking-wider2 text-grey-500">Round funded</span>
          <span className="mono text-[12px] text-grey-300">{opp.fundedPct}%</span>
        </div>
        <div className="h-px w-full bg-white/15">
          <div className="h-px bg-white" style={{ width: `${opp.fundedPct}%` }} />
        </div>
      </div>

      <div className="mt-7 grid grid-cols-3 gap-4 border-t border-line pt-5">
        <Meta label="From" value={formatUSD(opp.price)} />
        <Meta label="Horizon" value={opp.horizon} />
        <Meta label="Risk" value={opp.risk} />
      </div>

      <div className="mt-7">
        {onInvest ? (
          <button onClick={onInvest} className="btn-outline w-full">
            {cta}
          </button>
        ) : (
          <Link href={href} className="btn-outline w-full">
            {cta}
          </Link>
        )}
      </div>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <div className="text-[10px] tracking-wider2 text-grey-500">{label}</div>
      <div className="mono mt-1 text-[13px] text-white">{value}</div>
    </div>
  );
}
