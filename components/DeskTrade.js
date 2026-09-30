'use client';

import { useState } from 'react';
import {
  useStore,
  formatUSD,
  openPosition,
  closePosition,
  positionPnL,
  positionEquity,
  positionUnits,
  liquidationPrice,
} from '@/lib/store';
import { useMarket, fmtPrice, fmtSigned } from '@/lib/market';
import { IconLayers, IconCandles } from './DeskIcons';

const LEVERAGES = [1, 2, 5, 10, 20];

// Open a leveraged long/short on SPX from available margin.
export function TradePanel() {
  const { state } = useStore();
  const spx = useMarket().quotes.SPX;
  const [dir, setDir] = useState('long');
  const [margin, setMargin] = useState('');
  const [lev, setLev] = useState(5);
  const [msg, setMsg] = useState(null);

  if (!spx) return <div className="tile h-[360px] animate-pulse" />;
  const m = Number(margin) || 0;
  const notional = m * lev;
  const units = spx.price > 0 ? notional / spx.price : 0;
  const liq =
    dir === 'long' ? spx.price - spx.price / lev : spx.price + spx.price / lev;

  function submit(e) {
    e.preventDefault();
    const res = openPosition({ symbol: 'SPX', dir, margin: m, leverage: lev, entry: spx.price });
    if (res.ok) {
      setMsg({ ok: true, text: `${dir === 'long' ? 'Long' : 'Short'} opened at $${fmtPrice(spx.price)}` });
      setMargin('');
    } else {
      setMsg({ ok: false, text: res.error });
    }
  }

  return (
    <div className="tile p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h3 className="tile-title flex items-center gap-2.5"><span className="icon-chip"><IconCandles className="h-3.5 w-3.5" /></span>Trade SPX</h3>
        <span className="num text-[15px] text-grey-300">${fmtPrice(spx.price)}</span>
      </div>

      {/* Direction */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => setDir('long')}
          className={`rounded-lg border py-3 text-[14px] font-semibold uppercase tracking-wider2 transition-colors ${
            dir === 'long' ? 'border-gain bg-gain/15 text-gain' : 'border-line text-grey-400 hover:text-white'
          }`}
        >
          Long ▲
        </button>
        <button
          onClick={() => setDir('short')}
          className={`rounded-lg border py-3 text-[14px] font-semibold uppercase tracking-wider2 transition-colors ${
            dir === 'short' ? 'border-loss bg-loss/15 text-loss' : 'border-line text-grey-400 hover:text-white'
          }`}
        >
          Short ▼
        </button>
      </div>

      <form onSubmit={submit} className="mt-4">
        <label className="label">Margin</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-grey-500">$</span>
          <input
            inputMode="decimal"
            className="input pl-7 text-[16px]"
            placeholder="0.00"
            value={margin}
            onChange={(e) => {
              setMargin(e.target.value.replace(/[^0-9.]/g, ''));
              setMsg(null);
            }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[13px] text-grey-500">
          <span>Available {formatUSD(state.balance, { cents: true })}</span>
          <button
            type="button"
            onClick={() => setMargin(String(Math.floor(state.balance * 100) / 100))}
            className="text-grey-300 hover:text-white"
          >
            Max
          </button>
        </div>

        {/* Leverage */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="label mb-0">Leverage</label>
            <span className="num text-[15px] text-white">{lev}×</span>
          </div>
          <div className="flex gap-2">
            {LEVERAGES.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLev(l)}
                className={`flex-1 rounded-md border py-2 text-[14px] font-medium transition-colors ${
                  lev === l ? 'border-white bg-white text-black' : 'border-line text-grey-400 hover:text-white'
                }`}
              >
                {l}×
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-2 rounded-lg border border-line p-3.5 text-[14px]">
          <Row label="Position size" value={formatUSD(notional, { cents: true })} />
          <Row label="Units" value={units.toFixed(4)} />
          <Row label="Entry price" value={`$${fmtPrice(spx.price)}`} />
          <Row label="Est. liquidation" value={`$${fmtPrice(liq)}`} danger />
        </div>

        {msg && (
          <p className={`mt-3 rounded-lg border px-3 py-2 text-[14px] ${msg.ok ? 'border-gain/40 bg-gain/10 text-gain' : 'border-loss/40 bg-loss/10 text-loss'}`}>
            {msg.text}
          </p>
        )}

        <button
          type="submit"
          disabled={!(m > 0) || m > state.balance}
          className={`mt-4 w-full rounded-lg py-3.5 text-[14px] font-semibold uppercase tracking-wider2 transition-colors disabled:opacity-40 ${
            dir === 'long' ? 'bg-gain text-black hover:bg-gain/85' : 'bg-loss text-white hover:bg-loss/85'
          }`}
        >
          Open {dir} · {lev}×
        </button>
        <p className="mt-3 text-center text-[13px] text-grey-600">Leveraged positions carry liquidation risk.</p>
      </form>
    </div>
  );
}

// Open leveraged positions with live P&L.
export function PositionsTable() {
  const { state } = useStore();
  const { quotes } = useMarket();
  const positions = state.positions || [];

  return (
    <div className="tile overflow-hidden">
      <div className="tile-head">
        <h3 className="tile-title flex items-center gap-2.5"><span className="icon-chip"><IconLayers className="h-3.5 w-3.5" /></span>Open positions</h3>
        <span className="num text-[14px] text-grey-500">{positions.length}</span>
      </div>

      {positions.length === 0 ? (
        <p className="px-5 py-10 text-center text-[15px] text-grey-500">
          No open positions. Open a long or short to start.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-[15px]">
            <thead className="border-b border-line bg-white/[0.015]">
              <tr className="text-[12px] uppercase tracking-wider text-grey-500">
                <th className="px-5 py-3 text-left font-medium">Market</th>
                <th className="px-3 py-3 text-right font-medium">Size</th>
                <th className="px-3 py-3 text-right font-medium">Entry</th>
                <th className="px-3 py-3 text-right font-medium">Mark</th>
                <th className="px-3 py-3 text-right font-medium">Liq.</th>
                <th className="px-3 py-3 text-right font-medium">P&L</th>
                <th className="px-5 py-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {positions.map((p) => {
                const q = quotes[p.symbol];
                const price = q ? q.price : p.entry;
                const pnl = positionPnL(p, price);
                const equity = positionEquity(p, price);
                const pnlPct = (pnl / p.margin) * 100;
                return (
                  <tr key={p.id} className="row-hover">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{p.symbol}</span>
                        <span
                          className={`pill ${p.dir === 'long' ? 'chip-gain' : 'chip-loss'}`}
                        >
                          {p.dir === 'long' ? 'LONG' : 'SHORT'} {p.leverage}×
                        </span>
                      </div>
                      <div className="mt-1 text-[13px] text-grey-500">Margin {formatUSD(p.margin, { cents: true })}</div>
                    </td>
                    <td className="num px-3 py-3.5 text-right text-grey-200">{positionUnits(p).toFixed(3)}</td>
                    <td className="num px-3 py-3.5 text-right text-grey-200">${fmtPrice(p.entry)}</td>
                    <td className="num px-3 py-3.5 text-right text-white">${fmtPrice(price)}</td>
                    <td className="num px-3 py-3.5 text-right text-grey-400">${fmtPrice(liquidationPrice(p))}</td>
                    <td className={`num px-3 py-3.5 text-right ${pnl >= 0 ? 'text-gain' : 'text-loss'}`}>
                      {fmtSigned(pnl)}
                      <div className="text-[13px]">{fmtSigned(pnlPct)}%</div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => closePosition(p.id, price)}
                        className="rounded-md border border-line px-3 py-1.5 text-[13px] text-grey-200 hover:border-white/40 hover:text-white"
                      >
                        Close
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, danger }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-grey-500">{label}</span>
      <span className={`num ${danger ? 'text-loss' : 'text-grey-100'}`}>{value}</span>
    </div>
  );
}
