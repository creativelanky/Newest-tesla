'use client';

import { useState } from 'react';
import PriceChart from './PriceChart';
import LiveNumber from './LiveNumber';
import { useQuote, quoteStats, fmtPrice, fmtSigned, impliedValuation } from '@/lib/market';

const RANGES = [
  ['1H', 20],
  ['4H', 45],
  ['1D', 90],
];

// Primary SPX chart with a timeframe selector (slices the live history buffer).
export default function DeskChart() {
  const spx = useQuote('SPX');
  const [range, setRange] = useState(2);

  if (!spx) return <div className="tile h-[360px] animate-pulse" />;
  const s = quoteStats(spx);
  const data = spx.history.slice(-RANGES[range][1]);
  const val = impliedValuation(spx.price);

  return (
    <div className="tile glow-ring p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="live-dot" />
            <span className="text-[14px] font-semibold tracking-wide text-white">SPX</span>
            <span className="text-[13px] text-grey-500">SpaceX Holdings · Pre-IPO</span>
          </div>
          <div className="mt-3 flex items-end gap-2.5">
            <LiveNumber value={spx.price} render={(v) => `$${fmtPrice(v)}`} className="figure-xl text-[clamp(1.7rem,3vw,2.1rem)]" />
            <span
              className={`mb-0.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[14px] font-semibold ${
                s.up ? 'chip-gain' : 'chip-loss'
              }`}
            >
              {fmtSigned(s.changePct)}%
            </span>
            <span className="mb-1 text-[14px] text-grey-500">{fmtSigned(s.changeAbs)}</span>
          </div>
        </div>
        <div className="flex gap-1 rounded-lg border border-line p-1">
          {RANGES.map(([label], i) => (
            <button
              key={label}
              onClick={() => setRange(i)}
              className={`seg-btn ${range === i ? 'bg-white text-black' : 'text-grey-400 hover:text-white'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <PriceChart data={data} up={s.up} height={230} />
      </div>

      <div className="mt-5 grid grid-cols-2 border-t border-line sm:grid-cols-4 sm:divide-x sm:divide-line">
        <Stat label="Day high" value={`$${fmtPrice(spx.dayHigh)}`} first />
        <Stat label="Day low" value={`$${fmtPrice(spx.dayLow)}`} />
        <Stat label="Open" value={`$${fmtPrice(spx.open)}`} />
        <Stat label="Implied val." value={`$${val.toFixed(0)}B`} />
      </div>
    </div>
  );
}

function Stat({ label, value, first }) {
  return (
    <div className={`pt-4 ${first ? 'sm:pr-4' : 'sm:px-4'}`}>
      <div className="text-[12px] uppercase tracking-wider text-grey-500">{label}</div>
      <div className="num mt-1 text-[14px] tnum text-white">{value}</div>
    </div>
  );
}
