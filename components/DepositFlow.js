'use client';

import { useEffect, useState } from 'react';
import { formatUSD } from '@/lib/store';
import { apiDeposit, fetchSettings } from '@/lib/api';
import { readFileAsDoc, prettySize } from '@/lib/upload';
import Button from './Button';
import FlowScreen, { FlowSteps } from './FlowScreen';
import { IconBitcoin, IconWalletLine, IconLayers, IconArrowDownLeft } from './DeskIcons';

const METHODS = [
  { id: 'bitcoin', label: 'Bitcoin', icon: IconBitcoin, blurb: 'Send BTC to the address below' },
  { id: 'paypal', label: 'PayPal', icon: IconWalletLine, blurb: 'Send to our PayPal account' },
  { id: 'bank', label: 'Bank transfer', icon: IconLayers, blurb: 'Wire or ACH to our account' },
];

const QUICK = [500, 1000, 5000, 25000];
const STEP_LABELS = ['Method & amount', 'Send payment', 'Upload receipt'];

// Full-screen three-step funding: choose a method, pay to the shown details,
// attach the receipt.
export default function DepositFlow({ open, onClose, onSubmitted }) {
  const [settings, setSettings] = useState(null);
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState(null);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const amt = Number(amount) || 0;
  const methodLabel = METHODS.find((m) => m.id === method)?.label;

  useEffect(() => {
    if (!open) return;
    fetchSettings().then((res) => res.ok && setSettings(res.data));
  }, [open]);

  // Reset to a clean slate whenever the screen is reopened.
  useEffect(() => {
    if (open) {
      setStep(1); setMethod(null); setAmount(''); setReference('');
      setReceipt(null); setBusy(false); setError(''); setDone(false);
    }
  }, [open]);

  async function pickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      setBusy(true);
      const doc = await readFileAsDoc(file);
      setReceipt(doc);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!receipt) return setError('Attach your payment receipt so we can confirm it.');
    setBusy(true);
    const res = await apiDeposit({
      method,
      amount: amt,
      reference,
      receipt: { dataUrl: receipt.dataUrl, type: receipt.type },
    });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    onSubmitted?.();
    setDone(true);
  }

  const aside = done ? null : (
    <div>
      <FlowSteps steps={STEP_LABELS} current={step} tone="scarlet" />
      {(amt > 0 || method) && (
        <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-grey-400">Amount</span>
            <span className="font-semibold text-white">{amt > 0 ? formatUSD(amt, { cents: true }) : '—'}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[13px]">
            <span className="text-grey-400">Method</span>
            <span className="font-semibold text-white">{methodLabel || '—'}</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <FlowScreen
      open={open}
      onClose={onClose}
      tone="scarlet"
      eyebrow="Add funds"
      title="Deposit to your balance"
      lede="Fund your account in a few steps. Deposits are credited once we confirm your payment."
      aside={aside}
    >
      {!settings ? (
        <div className="py-16 text-center text-[15px] text-grey-500">Loading…</div>
      ) : done ? (
        <div className="py-6 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-gain/40 bg-gain/10 text-gain">
            <IconArrowDownLeft className="h-7 w-7" />
          </div>
          <h3 className="mt-6 text-[22px] font-bold tracking-tight text-white">Deposit submitted</h3>
          <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-grey-400">
            We’ve received your {formatUSD(amt)} {methodLabel} deposit and your receipt. It’ll be credited
            once the payment is confirmed.
          </p>
          <span className="pill mt-5 border-line text-grey-300">Status · Pending review</span>
          <button onClick={onClose} className="btn-solid mt-8 w-full">Done</button>
        </div>
      ) : (
        <>
          {step === 1 && (
            <div className="space-y-7">
              <div>
                <h3 className="text-[18px] font-semibold text-white">How would you like to pay?</h3>
                <div className="mt-4 grid gap-3">
                  {METHODS.map((m) => {
                    const on = method === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setMethod(m.id)}
                        className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
                          on ? 'border-scarlet/70 bg-loss/[0.08]' : 'border-line bg-card2 hover:border-white/25'
                        }`}
                        style={on ? { borderColor: 'rgba(229,72,77,0.7)' } : undefined}
                      >
                        <span
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
                          style={on
                            ? { color: '#ff9d9a', background: 'rgba(229,72,77,0.16)', border: '1px solid rgba(229,72,77,0.4)' }
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
                          style={on ? { borderColor: '#ff9d9a' } : { borderColor: 'rgba(255,255,255,0.2)' }}
                        >
                          {on && <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#ff9d9a' }} />}
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
                <div className="mt-3 flex flex-wrap gap-2">
                  {QUICK.map((q) => (
                    <button
                      key={q}
                      onClick={() => setAmount(String(q))}
                      className="rounded-lg border border-line bg-card2 px-3.5 py-2 text-[14px] text-grey-300 hover:border-white/40 hover:text-white"
                    >
                      {formatUSD(q)}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-[13px] text-grey-500">Minimum deposit {formatUSD(settings.minDeposit)}</p>
              </div>

              {error && <p className="rounded-lg border border-loss/40 bg-loss/10 px-4 py-3 text-[14px] text-loss">{error}</p>}

              <button disabled={!method || !(amt >= settings.minDeposit)} onClick={() => setStep(2)} className="btn-solid w-full">
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-[18px] font-semibold text-white">Send exactly {formatUSD(amt, { cents: true })}</h3>
                <p className="mt-1 text-[14px] text-grey-500">to the {methodLabel} details below.</p>
              </div>
              <div className="rounded-xl border border-line bg-card2 p-5">
                {method === 'bitcoin' && (
                  <>
                    <Detail label="Network" value={settings.btcNetwork} />
                    <Detail label="BTC address" value={settings.btcAddress} copy mono />
                  </>
                )}
                {method === 'paypal' && <Detail label="PayPal account" value={settings.paypalEmail} copy />}
                {method === 'bank' && (
                  <>
                    <Detail label="Bank" value={settings.bankName} />
                    <Detail label="Account name" value={settings.bankAccountName} />
                    <Detail label="Account number" value={settings.bankAccountNumber} copy mono />
                    <Detail label="Routing" value={settings.bankRouting} copy mono />
                    <Detail label="SWIFT" value={settings.bankSwift} mono />
                  </>
                )}
              </div>
              <p className="text-[13px] leading-relaxed text-grey-500">
                Send the exact amount, then continue to upload your receipt. Deposits are credited after the
                payment is confirmed.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-outline flex-1">Back</button>
                <button onClick={() => setStep(3)} className="btn-solid flex-1">I’ve sent it</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-[18px] font-semibold text-white">Upload your payment receipt</h3>
                <p className="mt-1 text-[14px] text-grey-500">So we can match and confirm your payment.</p>
              </div>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-line bg-card2 px-4 py-10 text-center transition-colors hover:border-white/30">
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={pickFile} />
                {receipt ? (
                  <>
                    {receipt.type.startsWith('image/') ? (
                      <img src={receipt.dataUrl} alt="Receipt preview" className="max-h-44 rounded-md border border-line" />
                    ) : (
                      <span className="grid h-12 w-12 place-items-center rounded-lg border border-line bg-card"><IconLayers className="h-5 w-5 text-grey-300" /></span>
                    )}
                    <span className="mt-4 text-[15px] text-white">{receipt.name}</span>
                    <span className="text-[13px] text-grey-500">{prettySize(receipt.size)} · tap to replace</span>
                  </>
                ) : (
                  <>
                    <span className="grid h-12 w-12 place-items-center rounded-lg border border-line bg-card text-grey-300"><IconArrowDownLeft className="h-5 w-5" /></span>
                    <span className="mt-4 text-[15px] font-medium text-white">{busy ? 'Processing…' : 'Choose a screenshot or PDF'}</span>
                    <span className="text-[13px] text-grey-500">JPG, PNG or PDF up to 6 MB</span>
                  </>
                )}
              </label>

              <div>
                <label className="label">Reference / transaction ID (optional)</label>
                <input
                  className="input"
                  placeholder="e.g. transaction hash or payment ref"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>

              {error && <p className="rounded-lg border border-loss/40 bg-loss/10 px-4 py-3 text-[14px] text-loss">{error}</p>}

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="btn-outline flex-1">Back</button>
                <Button loading={busy} onClick={submit} className="btn-solid flex-1">Submit deposit</Button>
              </div>
            </div>
          )}
        </>
      )}
    </FlowScreen>
  );
}

function Detail({ label, value, copy, mono }) {
  const [copied, setCopied] = useState(false);
  const empty = !value || !String(value).trim();
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line py-3 last:border-0">
      <span className="text-[13px] uppercase tracking-wider text-grey-500">{label}</span>
      <span className="flex items-center gap-2 text-right">
        {empty ? (
          <span className="text-[13px] italic text-grey-500">Not available — contact support</span>
        ) : (
          <span className={`text-[14px] text-white ${mono ? 'break-all font-mono' : ''}`}>{value}</span>
        )}
        {copy && !empty && (
          <button
            onClick={() => {
              navigator.clipboard?.writeText(value);
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            }}
            className="shrink-0 rounded border border-line px-2 py-0.5 text-[12px] text-grey-400 hover:text-white"
          >
            {copied ? '✓' : 'Copy'}
          </button>
        )}
      </span>
    </div>
  );
}
