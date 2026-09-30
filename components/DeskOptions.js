'use client';

import { useState } from 'react';
import { useStore, formatUSD, buyOption, closeOption } from '@/lib/store';
import { useQuote, fmtPrice, fmtSigned } from '@/lib/market';
import { EXPIRIES, buildChain, optionPremium } from '@/lib/options';
import { IconCandles, IconLayers } from './DeskIcons';

// SPX options desk: pick an expiry, read the live chain, buy calls/puts.
export function OptionsPanel() {
  const spx = useQuote('SPX');
  const { state } = useStore();
  const [expIdx, setExpIdx] = useState(1);
  const [sel, setSel] = useState(null); // { kind, strike, premium }
  const [contracts, setContracts] = useState('1');
  const [msg, setMsg] = useState(null);

  if (!spx) return <div className="tile h-[360px] animate-pulse" />;
  const expiry = EXPIRIES[expIdx];
  const chain = buildChain(spx.price, expiry.days);
  const n = Math.max(1, Math.floor(Number(contracts) || 1));
  const cost = sel ? sel.premium * 100 * n : 0;

  function buy() {
    if (!sel) return;
    const res = buyOption({
      kind: sel.kind,
      strike: sel.strike,
      expiry: expiry.days,
      contracts: n,
      premium: sel.premium,
    });
    if (res.ok) {
      setMsg({ ok: true, text: `Bought ${n} SPX ${sel.strike} ${sel.kind.toUpperCase()}` });
      setSel(null);
    } else {
      setMsg({ ok: false, text: res.error });
    }
  }

  return (
    <div className="tile p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="tile-title flex items-center gap-2.5"><span className="icon-chip"><IconCandles className="h-3.5 w-3.5" /></span>SPX options</h3>
        <div className="flex gap-1 rounded-lg border border-line p-1">
          {EXPIRIES.map((e, i) => (
            <button
              key={e.id}
              onClick={() => { setExpIdx(i); setSel(null); }}
              className={`seg-btn ${expIdx === i ? 'bg-white text-black' : 'text-grey-400 hover:text-white'}`}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-line">
        <div className="grid grid-cols-3 bg-white/[0.03] px-4 py-2 text-[10px] uppercase tracking-wider text-grey-500">
          <span>Calls</span>
          <span className="text-center">Strike</span>
          <span className="text-right">Puts</span>
        </div>
        <div className="divide-y divide-line">
          {chain.map((row) => (
            <div key={row.strike} className={`grid grid-cols-3 items-center px-2 py-1.5 text-[13px] ${row.atm ? 'bg-white/[0.03]' : ''}`}>
              <button
                onClick={() => setSel({ kind: 'call', strike: row.strike, premium: row.call })}
                className={`num rounded-md py-1.5 text-left pl-2 transition-colors hover:bg-gain/10 ${
                  sel?.kind === 'call' && sel?.strike === row.strike ? 'bg-gain/15 text-gain' : 'text-gain/90'
                }`}
              >
                {fmtPrice(row.call)}
              </button>
              <span className={`num text-center text-[12px] ${row.atm ? 'text-white' : 'text-grey-400'}`}>
                {row.strike}
              </span>
              <button
                onClick={() => setSel({ kind: 'put', strike: row.strike, premium: row.put })}
                className={`num rounded-md py-1.5 text-right pr-2 transition-colors hover:bg-loss/10 ${
                  sel?.kind === 'put' && sel?.strike === row.strike ? 'bg-loss/15 text-loss' : 'text-loss/90'
                }`}
              >
                {fmtPrice(row.put)}
              </button>
            </div>
          ))}
        </div>
      </div>

      {sel ? (
        <div className="mt-4 rounded-lg border border-line p-4">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-semibold text-white">
              SPX {sel.strike} {sel.kind.toUpperCase()} · {expiry.label}
            </span>
            <span className="num text-grey-300">@ {fmtPrice(sel.premium)}</span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-line">
              <button onClick={() => setContracts(String(Math.max(1, n - 1)))} className="px-3 py-2 text-grey-300 hover:text-white">−</button>
              <input
                className="num w-12 bg-transparent text-center text-[14px] text-white focus:outline-none"
                value={contracts}
                onChange={(e) => setContracts(e.target.value.replace(/[^0-9]/g, ''))}
              />
              <button onClick={() => setContracts(String(n + 1))} className="px-3 py-2 text-grey-300 hover:text-white">+</button>
            </div>
            <span className="text-[11px] text-grey-500">×100 / contract</span>
            <span className="num ml-auto text-[14px] text-white">{formatUSD(cost, { cents: true })}</span>
          </div>
          {msg && !msg.ok && <p className="mt-3 text-[12px] text-loss">{msg.text}</p>}
          <button
            onClick={buy}
            disabled={cost > state.balance}
            className="btn-solid mt-3 w-full disabled:opacity-40"
          >
            Buy {n} {sel.kind}
          </button>
        </div>
      ) : (
        <p className="mt-4 text-center text-[12px] text-grey-500">Tap a call or put premium to build an order.</p>
      )}
      {msg?.ok && <p className="mt-3 text-center text-[12px] text-gain">{msg.text}</p>}
    </div>
  );
}

// Open option contracts, valued live off current spot.
export function OptionsPositions() {
  const { state } = useStore();
  const spx = useQuote('SPX');
  const opts = state.options || [];
  const spot = spx ? spx.price : 0;

  return (
    <div className="tile overflow-hidden">
      <div className="tile-head">
        <h3 className="tile-title flex items-center gap-2.5"><span className="icon-chip"><IconLayers className="h-3.5 w-3.5" /></span>Options positions</h3>
        <span className="num text-[12px] text-grey-500">{opts.length}</span>
      </div>
      {opts.length === 0 ? (
        <p className="px-5 py-10 text-center text-[13px] text-grey-500">No option contracts yet.</p>
      ) : (
        <div className="divide-y divide-line">
          {opts.map((o) => {
            const cur = optionPremium({ kind: o.kind, strike: o.strike, spot, days: o.expiry });
            const value = cur * 100 * o.contracts;
            const costBasis = o.entryPremium * 100 * o.contracts;
            const pnl = value - costBasis;
            return (
              <div key={o.id} className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-white">SPX {o.strike} {o.kind.toUpperCase()}</span>
                    <span className={`pill ${o.kind === 'call' ? 'chip-gain' : 'chip-loss'}`}>{o.expiry}D</span>
                  </div>
                  <div className="mt-1 text-[11px] text-grey-500">
                    {o.contracts} × @ {fmtPrice(o.entryPremium)} → {fmtPrice(cur)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="num text-[13px] text-white">{formatUSD(value, { cents: true })}</div>
                  <div className={`num text-[11px] ${pnl >= 0 ? 'text-gain' : 'text-loss'}`}>{fmtSigned(pnl)}</div>
                </div>
                <button
                  onClick={() => closeOption(o.id, cur)}
                  className="rounded-md border border-line px-3 py-1.5 text-[11px] text-grey-200 hover:border-white/40 hover:text-white"
                >
                  Close
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
