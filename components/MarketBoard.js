'use client';

import Sparkline from './Sparkline';
import { useMarket, quoteStats, fmtPrice, fmtSigned } from '@/lib/market';

// Live watchlist table with per-row sparklines. Prices tick in place.
export default function MarketBoard() {
  const { quotes, ready } = useMarket();
  const list = Object.values(quotes);

  if (!ready || list.length === 0) {
    return <div className="tile h-[420px] animate-pulse" />;
  }

  return (
    <div className="tile overflow-hidden">
      <div className="grid grid-cols-[1.4fr_1fr_1fr_1.1fr] items-center gap-3 border-b border-line px-5 py-3 text-[10px] uppercase tracking-wider text-grey-500">
        <span>Instrument</span>
        <span className="text-right">Last</span>
        <span className="text-right">24h</span>
        <span className="text-right">Trend</span>
      </div>
      <div className="divide-y divide-line">
        {list.map((q) => {
          const s = quoteStats(q);
          const isBtc = q.symbol === 'BTC';
          return (
            <div
              key={q.symbol}
              className="grid grid-cols-[1.4fr_1fr_1fr_1.1fr] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
            >
              <div className="min-w-0">
                <div className="text-[13px] font-semibold tracking-wide text-white">{q.symbol}</div>
                <div className="truncate text-[11px] text-grey-500">{q.name}</div>
              </div>
              <div className="num text-right text-[14px] text-white">
                ${fmtPrice(q.price, isBtc ? 0 : 2)}
              </div>
              <div className={`num text-right text-[13px] ${s.up ? 'text-gain' : 'text-loss'}`}>
                {fmtSigned(s.changePct)}%
              </div>
              <div className="flex justify-end">
                <Sparkline data={q.history} up={s.up} width={84} height={26} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
