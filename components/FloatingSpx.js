'use client';

import { useQuote, quoteStats, fmtPrice, fmtSigned } from '@/lib/market';

// A small floating live SPX quote pinned near the top of the dashboard.
export default function FloatingSpx() {
  const spx = useQuote('SPX');
  if (!spx) return null;
  const s = quoteStats(spx);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[68px] z-40 flex justify-center px-4 sm:top-[76px]">
      <div className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-line bg-card2/90 px-3.5 py-1.5 shadow-lg backdrop-blur">
        <span className="live-dot" />
        <span className="text-[12px] font-semibold tracking-wide text-white">SPX</span>
        <span className="text-[13px] font-semibold tabular-nums text-white">${fmtPrice(spx.price)}</span>
        <span className={`text-[11px] font-semibold tabular-nums ${s.up ? 'text-gain' : 'text-loss'}`}>
          {fmtSigned(s.changePct)}%
        </span>
      </div>
    </div>
  );
}
