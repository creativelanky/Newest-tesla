'use client';

import Sparkline from './Sparkline';
import LiveNumber from './LiveNumber';
import { useMarket, quoteStats, fmtPrice, fmtSigned } from '@/lib/market';
import { IconList } from './DeskIcons';

// Compact live watchlist for the dashboard rail.
export default function DeskWatchlist() {
  const { quotes, ready } = useMarket();
  const list = Object.values(quotes).filter((q) => q.symbol !== 'BTC');
  if (!ready) return <div className="tile h-[300px] animate-pulse" />;

  return (
    <div className="tile overflow-hidden">
      <div className="tile-head">
        <h3 className="tile-title flex items-center gap-2.5"><span className="icon-chip"><IconList className="h-3.5 w-3.5" /></span>Watchlist</h3>
        <span className="flex items-center gap-1.5 text-[12px] uppercase tracking-wider text-grey-400"><span className="live-dot" /> Live</span>
      </div>
      <div className="divide-y divide-line">
        {list.map((q) => {
          const s = quoteStats(q);
          return (
            <div key={q.symbol} className="row-hover flex items-center gap-3 px-5 py-3">
              <div className="w-16 shrink-0">
                <div className="text-[14px] font-semibold text-white">{q.symbol}</div>
              </div>
              <Sparkline data={q.history.slice(-30)} up={s.up} width={64} height={22} />
              <div className="ml-auto text-right">
                <LiveNumber value={q.price} render={(v) => `$${fmtPrice(v)}`} className="text-[15px] font-medium text-white" />
                <div className={`num text-[13px] ${s.up ? 'text-gain' : 'text-loss'}`}>{fmtSigned(s.changePct)}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
