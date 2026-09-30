'use client';

import Link from 'next/link';
import PriceChart from './PriceChart';
import QuoteCard from './QuoteCard';
import { useMarket, quoteStats, fmtPrice, fmtSigned, impliedValuation } from '@/lib/market';

// The live "trading panel" that sits in the hero: primary SPX quote with a chart,
// two secondary instruments, and the implied valuation headline.
export default function HeroPanel() {
  const { quotes, ready } = useMarket();
  const spx = quotes.SPX;

  if (!ready || !spx) {
    return <div className="tile h-[420px] animate-pulse bg-panel/80" />;
  }
  const s = quoteStats(spx);
  const val = impliedValuation(spx.price);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl">
      {/* fancy sheen */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <div className="pointer-events-none absolute -left-24 -top-24 h-48 w-48 rounded-full bg-white/[0.06] blur-3xl" />
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="live-dot" />
          <span className="tile-title">SPX · SpaceX Holdings</span>
        </div>
        <span className="pill border-white/15 text-grey-300">Pre-IPO</span>
      </div>

      <div className="px-5 pt-5">
        <div className="flex items-end justify-between">
          <div>
            <div className="num text-[34px] font-medium leading-none text-white">${fmtPrice(spx.price)}</div>
            <div className={`num mt-2 text-[13px] ${s.up ? 'text-gain' : 'text-loss'}`}>
              {fmtSigned(s.changeAbs)} ({fmtSigned(s.changePct)}%) today
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-grey-500">Implied valuation</div>
            <div className="num mt-1 text-[15px] text-white">${val.toFixed(0)}B</div>
          </div>
        </div>
      </div>

      <div className="mt-3 px-2">
        <PriceChart data={spx.history} up={s.up} height={150} />
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-white/10 bg-white/10">
        <MiniQuote q={quotes.STRSHP} />
        <MiniQuote q={quotes.STRLNK} />
      </div>

      <div className="p-4">
        <Link href="/signup" className="btn-solid w-full">Start trading</Link>
      </div>
    </div>
  );
}

function MiniQuote({ q }) {
  if (!q) return <div className="bg-white/[0.02] p-4" />;
  const s = quoteStats(q);
  return (
    <div className="bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-white">{q.symbol}</span>
        <span className={`num text-[11px] ${s.up ? 'text-gain' : 'text-loss'}`}>{fmtSigned(s.changePct)}%</span>
      </div>
      <div className="num mt-1.5 text-[16px] text-white">${fmtPrice(q.price)}</div>
    </div>
  );
}
