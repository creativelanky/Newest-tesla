'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatUSD } from '@/lib/store';
import { apiWithdraw } from '@/lib/api';
import Button from './Button';
import FlowScreen, { FlowSteps } from './FlowScreen';
import { IconBitcoin, IconWalletLine, IconLayers, IconArrowUpRight, IconVerified } from './DeskIcons';

const METHODS = [
  { id: 'bank', label: 'Bank transfer', icon: IconLayers, blurb: 'Straight to your bank account' },
  { id: 'bitcoin', label: 'Bitcoin', icon: IconBitcoin, blurb: 'To your BTC wallet address' },
  { id: 'paypal', label: 'PayPal', icon: IconWalletLine, blurb: 'To your PayPal account' },
];

const STEP_LABELS = ['Amount & method', 'Destination'];

// `profile` is the real Postgres profile row (balance, kyc_status) passed
// down from whichever page already fetched it via useAccount().
export default function WithdrawFlow({ open, onClose, profile, onSubmitted }) {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState(null);
  const [amount, setAmount] = useState('');
  const [dest, setDest] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const balance = Number(profile?.balance || 0);
  const amt = Number(amount) || 0;
  const verified = profile?.kyc_status === 'verified';
  const methodLabel = METHODS.find((m) => m.id === method)?.label;

  useEffect(() => {
    if (open) {
      setStep(1); setMethod(null); setAmount(''); setDest({});
      setError(''); setBusy(false); setDone(false);
    }
  }, [open]);

  function set(k, v) {
    setDest((d) => ({ ...d, [k]: v }));
    setError('');
  }

  async function submit() {
    const required =
      method === 'bank'
        ? ['bankName', 'accountName', 'accountNumber']
        : method === 'bitcoin'
        ? ['walletAddress']
        : ['paypalEmail'];
    for (const f of required) {
      if (!String(dest[f] || '').trim()) return setError('Fill in all destination fields.');
    }
    setBusy(true);
    const res = await apiWithdraw({ method, amount: amt, destination: dest });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    onSubmitted?.();
    setDone(true);
  }

  const showChrome = verified && !done;
  const aside = !showChrome ? null : (
    <div>
      <FlowSteps steps={STEP_LABELS} current={step} tone="azure" />
      <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-grey-400">Available</span>
          <span className="font-semibold text-white">{formatUSD(balance, { cents: true })}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[13px]">
          <span className="text-grey-400">Withdrawing</span>
          <span className="font-semibold text-white">{amt > 0 ? formatUSD(amt, { cents: true }) : '—'}</span>
        </div>
      </div>
    </div>
  );

  return (
    <FlowScreen
      open={open}
      onClose={onClose}
      tone="azure"
      eyebrow="Cash out"
      title="Withdraw your funds"
      lede="Move available cash to your bank, wallet or PayPal. Withdrawals are reviewed before they’re sent."
      aside={aside}
    >
      {!verified ? (
        <div className="py-6 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-warn/40 bg-warn/10 text-warn">
            <IconVerified className="h-7 w-7" />
          </div>
          <h3 className="mt-6 text-[22px] font-bold tracking-tight text-white">Verification required</h3>
          <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-grey-400">
            Verify your identity before your first withdrawal. It usually takes just a few minutes.
          </p>
          <Link href="/verify" className="btn-solid mt-8 w-full">Verify identity</Link>
          <button onClick={onClose} className="btn-outline btn-sm mt-3 w-full">Not now</button>
        </div>
      ) : done ? (
        <div className="py-6 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-azure/40 bg-azure/10 text-azure">
            <IconArrowUpRight className="h-7 w-7" />
          </div>
          <h3 className="mt-6 text-[22px] font-bold tracking-tight text-white">Withdrawal processing</h3>
          <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-grey-400">
            Your {formatUSD(amt)} withdrawal is being processed. Funds are on hold and you’ll be notified
            once it’s sent.
          </p>
          <span className="pill mt-5 border-line text-grey-300">Status · Processing</span>
          <button onClick={onClose} className="btn-solid mt-8 w-full">Done</button>
        </div>
      ) : step === 1 ? (
        <div className="space-y-7">
          <div>
            <h3 className="text-[18px] font-semibold text-white">Where should we send it?</h3>
            <div className="mt-4 grid gap-3">
              {METHODS.map((m) => {
                const on = method === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
                      on ? 'bg-azure/[0.08]' : 'border-line bg-card2 hover:border-white/25'
                    }`}
                    style={on ? { borderColor: 'rgba(79,139,255,0.7)' } : undefined}
                  >
                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
                      style={on
                        ? { color: '#a7c2ff', background: 'rgba(79,139,255,0.16)', border: '1px solid rgba(79,139,255,0.4)' }
                        : { color: '#a7a9ac', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <m.icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-[15px] font-semibold text-white">{m.label}</span>
                      <span className="block text-[13px] text-grey-500">{m.blurb}</span>
                    </span>
                    <span
                      className="grid h-5 w-5 place-items-center rounded-full border"
                      style={on ? { borderColor: '#a7c2ff' } : { borderColor: 'rgba(255,255,255,0.2)' }}
                    >
                      {on && <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#a7c2ff' }} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label">Amount</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-grey-500">$</span>
              <input
                inputMode="decimal"
                className="input py-4 pl-9 text-[24px] font-semibold"
                placeholder="0.00"
                value={amount}
                onChange={(e) => { setAmount(e.target.value.replace(/[^0-9.]/g, '')); setError(''); }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-[13px] text-grey-500">
              <span>Available {formatUSD(balance, { cents: true })}</span>
              <button onClick={() => setAmount(String(Math.floor(balance * 100) / 100))} className="text-grey-300 hover:text-white">
                Withdraw all
              </button>
            </div>
          </div>

          {error && <p className="rounded-lg border border-loss/40 bg-loss/10 px-4 py-3 text-[14px] text-loss">{error}</p>}

          <button disabled={!method || !(amt > 0) || amt > balance} onClick={() => setStep(2)} className="btn-solid w-full">
            Continue
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <h3 className="text-[18px] font-semibold text-white">Destination details</h3>
          <div className="grid gap-4">
            {method === 'bank' && (
              <>
                <Field label="Bank name" value={dest.bankName} onChange={(v) => set('bankName', v)} />
                <Field label="Account holder" value={dest.accountName} onChange={(v) => set('accountName', v)} />
                <Field label="Account number / IBAN" value={dest.accountNumber} onChange={(v) => set('accountNumber', v)} />
                <Field label="SWIFT / routing (optional)" value={dest.swift} onChange={(v) => set('swift', v)} />
              </>
            )}
            {method === 'bitcoin' && (
              <Field label="BTC wallet address" value={dest.walletAddress} onChange={(v) => set('walletAddress', v)} />
            )}
            {method === 'paypal' && (
              <Field label="PayPal email" value={dest.paypalEmail} onChange={(v) => set('paypalEmail', v)} />
            )}
          </div>

          <div className="space-y-2.5 rounded-xl border border-line bg-card2 p-4 text-[14px]">
            <Row label="Amount" value={formatUSD(amt, { cents: true })} />
            <Row label="Method" value={methodLabel} />
            <Row label="Fee" value="$0.00" />
          </div>

          {error && <p className="rounded-lg border border-loss/40 bg-loss/10 px-4 py-3 text-[14px] text-loss">{error}</p>}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-outline flex-1">Back</button>
            <Button loading={busy} onClick={submit} className="btn-solid flex-1">Request withdrawal</Button>
          </div>
        </div>
      )}
    </FlowScreen>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={value || ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-grey-500">{label}</span>
      <span className="text-grey-100">{value}</span>
    </div>
  );
}
