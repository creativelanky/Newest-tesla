'use client';

import { useMarket, quoteStats, fmtPrice, fmtSigned } from '@/lib/market';

// Continuous live price strip. Prices update in place while the row scrolls.
export default function MarketTicker() {
  const { quotes, ready } = useMarket();
  const list = Object.values(quotes);
  if (!ready || list.length === 0) {
    return <div className="h-[46px] border-y border-line bg-panel" />;
  }
  const row = [...list, ...list];

  return (
    <div className="relative flex overflow-hidden border-y border-line bg-panel">
      <div className="flex shrink-0 animate-marquee items-center whitespace-nowrap py-3">
        {row.map((q, i) => {
          const s = quoteStats(q);
          return (
            <span key={i} className="flex items-center gap-2 px-6 text-[15px]">
              <span className="font-semibold tracking-wide text-white">{q.symbol}</span>
              <span className="num text-grey-300">
                {q.symbol === 'BTC' ? fmtPrice(q.price, 0) : fmtPrice(q.price)}
              </span>
              <span className={`num ${s.up ? 'text-gain' : 'text-loss'}`}>
                {fmtSigned(s.changePct)}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
