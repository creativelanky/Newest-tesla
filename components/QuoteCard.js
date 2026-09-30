'use client';

import Sparkline from './Sparkline';
import { quoteStats, fmtPrice, fmtSigned } from '@/lib/market';

// A single live instrument card (used on the hero + watchlists).
export default function QuoteCard({ quote, compact = false }) {
  if (!quote) return <div className="tile h-[112px] animate-pulse" />;
  const s = quoteStats(quote);
  const isBtc = quote.symbol === 'BTC';

  return (
    <div className="tile p-4 transition-colors hover:border-white/25">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[13px] font-semibold tracking-wide text-white">{quote.symbol}</div>
          <div className="mt-0.5 text-[10px] uppercase tracking-wider text-grey-500">{quote.name}</div>
        </div>
        <span className={`num text-[11px] ${s.up ? 'text-gain' : 'text-loss'}`}>
          {fmtSigned(s.changePct)}%
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="num text-[20px] font-medium leading-none text-white">
          ${fmtPrice(quote.price, isBtc ? 0 : 2)}
        </div>
        {!compact && <Sparkline data={quote.history} up={s.up} width={78} height={26} />}
      </div>
    </div>
  );
}
