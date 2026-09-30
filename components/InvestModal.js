'use client';

import { useState, useEffect } from 'react';
import { invest, formatUSD } from '@/lib/store';
import Button from './Button';

const QUICK = [500, 1000, 5000, 10000];

export default function InvestModal({ opp, balance, onClose }) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!opp) return null;

  const amt = Number(amount);
  const units = amt > 0 ? amt / opp.price : 0;

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    // Brief pause so the confirmation reads as a processed transaction rather
    // than an instant flip.
    await new Promise((r) => setTimeout(r, 550));
    const res = invest(opp.id, amt);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setDone(true);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative w-full max-w-md animate-fade-up border border-line bg-panel p-7 sm:p-8">
        {done ? (
          <div className="py-4 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-gain/40 text-gain">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l5 5 9-11" />
              </svg>
            </div>
            <h3 className="h3 mt-5 text-white">Investment confirmed</h3>
            <p className="body mt-3">
              You backed <span className="text-white">{opp.name}</span> with{' '}
              <span className="mono text-white">{formatUSD(amt, { cents: true })}</span>.
            </p>
            <div className="mt-7 flex gap-3">
              <button onClick={onClose} className="btn-outline w-full">Close</button>
              <a href="/dashboard" className="btn-solid w-full">View dashboard</a>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">Invest in</p>
                <h3 className="h3 mt-1.5 text-white">{opp.name}</h3>
                <p className="mono mt-1 text-[14px] text-grey-500">
                  {opp.ticker} — {opp.projected.toFixed(1)}% proj.
                </p>
              </div>
              <button onClick={onClose} className="p-1.5 text-grey-400 hover:text-white" aria-label="Close">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="mt-5 flex items-center justify-between border border-line px-4 py-3.5 text-[14px]">
              <span className="text-grey-400">Available balance</span>
              <span className="mono font-medium text-white">{formatUSD(balance, { cents: true })}</span>
            </div>

            <form onSubmit={submit} className="mt-5">
              <label className="label" htmlFor="amount">Amount to invest</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-grey-500">$</span>
                <input
                  id="amount"
                  inputMode="decimal"
                  className="input pl-7 text-[17px]"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value.replace(/[^0-9.]/g, ''));
                    setError('');
                  }}
                  autoFocus
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {QUICK.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setAmount(String(Math.min(q, balance)))}
                    className="border border-line px-3.5 py-1.5 text-[14px] text-grey-300 hover:border-white/40 hover:text-white"
                  >
                    {formatUSD(q)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAmount(String(Math.floor(balance * 100) / 100))}
                  className="border border-line px-3.5 py-1.5 text-[14px] text-grey-300 hover:border-white/40 hover:text-white"
                >
                  Max
                </button>
              </div>

              {amt > 0 && (
                <div className="mt-5 space-y-2.5 border border-line p-4 text-[15px]">
                  <Row label="Units acquired" value={`${units.toFixed(4)} ${opp.ticker}`} />
                  <Row label="Unit price" value={formatUSD(opp.price)} />
                  <Row label="Balance after" value={formatUSD(balance - amt, { cents: true })} />
                </div>
              )}

              {error && (
                <p className="mt-4 border border-loss/40 bg-loss/10 px-4 py-3 text-[15px] text-loss">
                  {error}
                </p>
              )}

              <Button type="submit" loading={busy} className="btn-solid mt-6 w-full" disabled={!(amt > 0)}>
                Confirm investment
              </Button>
              <p className="mt-4 text-center text-[14px] text-grey-500">
                {opp.risk} risk program. Capital is at risk.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-grey-400">{label}</span>
      <span className="mono text-grey-100">{value}</span>
    </div>
  );
}
