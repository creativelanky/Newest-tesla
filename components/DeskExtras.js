'use client';

import { useState, useEffect } from 'react';
import {
  useStore,
  formatUSD,
  allocateCopy,
  stopCopy,
  reserveIPO,
  cancelIPO,
  btcDeposit,
  btcWithdraw,
} from '@/lib/store';
import { useQuote, quoteStats, fmtPrice, fmtSigned } from '@/lib/market';
import { TRADERS, getTrader, copyValue } from '@/lib/traders';
import { IconUsers, IconSpark, IconBitcoin } from './DeskIcons';

// ---- Copy trading ------------------------------------------------------------

export function CopyTradingPanel() {
  const { state } = useStore();
  const spx = useQuote('SPX');
  const dayPct = spx ? quoteStats(spx).changePct : 0;

  return (
    <div className="tile p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="tile-title flex items-center gap-2.5"><span className="icon-chip"><IconUsers className="h-3.5 w-3.5" /></span>Copy trading · SpaceX desks</h3>
          <p className="mt-1 text-[12px] text-grey-500">Mirror a lead trader's SpaceX book. Allocations move with their performance.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {TRADERS.map((t) => (
          <TraderCard key={t.id} trader={t} allocated={state.copies?.[t.id] || 0} dayPct={dayPct} />
        ))}
      </div>
    </div>
  );
}

function TraderCard({ trader, allocated, dayPct }) {
  const [amount, setAmount] = useState('');
  const [msg, setMsg] = useState(null);
  const active = allocated > 0;
  const value = active ? copyValue(allocated, trader, dayPct) : 0;
  const pnl = value - allocated;

  function add() {
    const res = allocateCopy(trader.id, Number(amount));
    if (res.ok) { setAmount(''); setMsg(null); } else setMsg(res.error);
  }

  return (
    <div className="rounded-lg border border-line p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full border border-line text-[11px] font-semibold text-white">
              {trader.handle.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <div className="text-[13px] font-semibold text-white">{trader.handle}</div>
              <div className="text-[11px] text-grey-500">{trader.strategy}</div>
            </div>
          </div>
        </div>
        <span className="num text-[13px] text-gain">+{trader.ret.toFixed(1)}%</span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <MiniStat label="Win" value={`${trader.win}%`} />
        <MiniStat label="Copiers" value={(trader.followers / 1000).toFixed(1) + 'k'} />
        <MiniStat label="Risk" value={trader.risk} />
      </div>

      {active ? (
        <div className="mt-3 rounded-md border border-line p-3">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-grey-500">Copying</span>
            <span className="num text-white">{formatUSD(value, { cents: true })}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="text-grey-500">Allocated {formatUSD(allocated)}</span>
            <span className={`num ${pnl >= 0 ? 'text-gain' : 'text-loss'}`}>{fmtSigned(pnl)}</span>
          </div>
          <button
            onClick={() => stopCopy(trader.id, value)}
            className="mt-3 w-full rounded-md border border-line py-2 text-[11px] uppercase tracking-wider text-grey-200 hover:border-white/40 hover:text-white"
          >
            Stop copying
          </button>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-grey-500">$</span>
            <input
              inputMode="decimal"
              className="input py-2.5 pl-6 text-[13px]"
              placeholder="Amount"
              value={amount}
              onChange={(e) => { setAmount(e.target.value.replace(/[^0-9.]/g, '')); setMsg(null); }}
            />
          </div>
          <button onClick={add} className="btn-solid btn-sm shrink-0">Copy</button>
        </div>
      )}
      {msg && <p className="mt-2 text-[11px] text-loss">{msg}</p>}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-md border border-line py-2">
      <div className="text-[9px] uppercase tracking-wider text-grey-500">{label}</div>
      <div className="num mt-0.5 text-[12px] text-white">{value}</div>
    </div>
  );
}

// ---- SpaceX IPO --------------------------------------------------------------

const IPO_DATE = new Date('2027-11-15T13:30:00Z').getTime();

export function IpoPanel() {
  const { state } = useStore();
  const [amount, setAmount] = useState('');
  const [msg, setMsg] = useState(null);
  const [left, setLeft] = useState(IPO_DATE - Date.now());
  const reserved = state.ipo?.reserved || 0;

  useEffect(() => {
    const t = setInterval(() => setLeft(IPO_DATE - Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const d = Math.max(0, Math.floor(left / 86400000));
  const h = Math.max(0, Math.floor((left % 86400000) / 3600000));
  const mnt = Math.max(0, Math.floor((left % 3600000) / 60000));
  const sec = Math.max(0, Math.floor((left % 60000) / 1000));

  function reserve() {
    const res = reserveIPO(Number(amount));
    if (res.ok) { setAmount(''); setMsg(null); } else setMsg(res.error);
  }

  return (
    <div className="tile overflow-hidden">
      <div className="relative">
        <img src="/starship-ascent.jpg" alt="" className="h-28 w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-panel to-transparent" />
        <div className="absolute bottom-3 left-5">
          <span className="pill border-white/30 text-white"><span className="live-dot" /> Priority access</span>
        </div>
      </div>
      <div className="p-5 sm:p-6">
        <h3 className="tile-title flex items-center gap-2.5"><span className="icon-chip"><IconSpark className="h-3.5 w-3.5" /></span>SpaceX IPO</h3>
        <p className="mt-1 text-[12px] text-grey-500">Indicative listing. Reserve an allocation now and confirm at pricing.</p>

        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          {[['D', d], ['H', h], ['M', mnt], ['S', sec]].map(([l, v]) => (
            <div key={l} className="rounded-lg border border-line py-2.5">
              <div className="num text-[18px] font-medium text-white">{String(v).padStart(2, '0')}</div>
              <div className="text-[9px] uppercase tracking-wider text-grey-500">{l}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
          <div className="rounded-lg border border-line p-3">
            <div className="text-[10px] uppercase tracking-wider text-grey-500">Price band</div>
            <div className="num mt-1 text-white">$380 – $420</div>
          </div>
          <div className="rounded-lg border border-line p-3">
            <div className="text-[10px] uppercase tracking-wider text-grey-500">Your reservation</div>
            <div className="num mt-1 text-white">{formatUSD(reserved)}</div>
          </div>
        </div>

        {reserved > 0 ? (
          <button
            onClick={() => cancelIPO()}
            className="mt-4 w-full rounded-lg border border-line py-3 text-[11px] uppercase tracking-wider2 text-grey-200 hover:border-white/40 hover:text-white"
          >
            Release reservation · {formatUSD(reserved)}
          </button>
        ) : (
          <>
            <div className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-grey-500">$</span>
                <input
                  inputMode="decimal"
                  className="input py-3 pl-6 text-[14px]"
                  placeholder="Reserve amount"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value.replace(/[^0-9.]/g, '')); setMsg(null); }}
                />
              </div>
              <button onClick={reserve} className="btn-solid shrink-0">Reserve</button>
            </div>
            {msg && <p className="mt-2 text-[12px] text-loss">{msg}</p>}
          </>
        )}
      </div>
    </div>
  );
}

// ---- Bitcoin funding ---------------------------------------------------------

const BTC_ADDR = 'bc1qsx0demo9k3rj2v7launch5pad4orbit8mars2xk';

export function BitcoinPanel() {
  const { state } = useStore();
  const btc = useQuote('BTC');
  const [mode, setMode] = useState('deposit');
  const [usd, setUsd] = useState('');
  const [msg, setMsg] = useState(null);

  const price = btc ? btc.price : 68000;
  const usdNum = Number(usd) || 0;
  const btcAmt = usdNum / price;

  function submit() {
    const res = mode === 'deposit' ? btcDeposit(usdNum, btcAmt) : btcWithdraw(usdNum, btcAmt);
    if (res.ok) {
      setMsg({ ok: true, text: `${mode === 'deposit' ? 'Deposited' : 'Withdrew'} ${btcAmt.toFixed(5)} BTC` });
      setUsd('');
    } else setMsg({ ok: false, text: res.error });
  }

  return (
    <div className="tile p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h3 className="tile-title flex items-center gap-2.5"><span className="icon-chip"><IconBitcoin className="h-3.5 w-3.5" /></span>Bitcoin funding</h3>
        <span className="num text-[12px] text-grey-300">BTC ${btc ? fmtPrice(price, 0) : '—'}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 rounded-lg border border-line p-1">
        {['deposit', 'withdraw'].map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setMsg(null); }}
            className={`seg-btn ${mode === m ? 'bg-white text-black' : 'text-grey-400 hover:text-white'}`}
          >
            {m}
          </button>
        ))}
      </div>

      <label className="label mt-4">Amount (USD)</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-grey-500">$</span>
        <input
          inputMode="decimal"
          className="input pl-7 text-[16px]"
          placeholder="0.00"
          value={usd}
          onChange={(e) => { setUsd(e.target.value.replace(/[^0-9.]/g, '')); setMsg(null); }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[12px] text-grey-500">
        <span>≈ <span className="num text-grey-200">{btcAmt.toFixed(6)}</span> BTC</span>
        {mode === 'withdraw' && <span>Available {formatUSD(state.balance)}</span>}
      </div>

      {mode === 'deposit' && (
        <div className="mt-3 rounded-lg border border-dashed border-line p-3">
          <div className="text-[10px] uppercase tracking-wider text-grey-500">Deposit address</div>
          <div className="num mt-1 break-all text-[11px] text-grey-300">{BTC_ADDR}</div>
        </div>
      )}

      {msg && (
        <p className={`mt-3 rounded-lg border px-3 py-2 text-[12px] ${msg.ok ? 'border-gain/40 bg-gain/10 text-gain' : 'border-loss/40 bg-loss/10 text-loss'}`}>
          {msg.text}
        </p>
      )}

      <button
        onClick={submit}
        disabled={!(usdNum > 0) || (mode === 'withdraw' && usdNum > state.balance)}
        className="btn-solid mt-4 w-full disabled:opacity-40"
      >
        {mode === 'deposit' ? 'Confirm deposit' : 'Confirm withdrawal'}
      </button>
      <p className="mt-3 text-[11px] leading-relaxed text-grey-600">
        Simulated on-chain rail. No real bitcoin is sent or received; the address is a placeholder.
      </p>
    </div>
  );
}
