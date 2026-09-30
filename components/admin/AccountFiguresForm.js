'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiCreateAdminDeposit, apiSetAccountFigures } from '@/lib/api';
import { formatUSD } from '@/lib/store';

function cleanAmount(value, allowNegative = false) {
  return value.replace(allowNegative ? /[^0-9.-]/g : /[^0-9.]/g, '');
}

function amount(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

// One editor for the figures shown to the user. Saving it always makes
// balance equal deposits plus profit, rather than applying piecemeal deltas.
export default function AccountFiguresForm({ user, onChanged }) {
  const [deposits, setDeposits] = useState(String(user.deposit_total ?? 0));
  const [profit, setProfit] = useState(String(user.profit ?? 0));
  const [busy, setBusy] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState('bank');
  const [depositReference, setDepositReference] = useState('');
  const [depositBusy, setDepositBusy] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setDeposits(String(user.deposit_total ?? 0));
    setProfit(String(user.profit ?? 0));
  }, [user.id, user.deposit_total, user.profit]);

  const total = useMemo(() => amount(deposits) + amount(profit), [deposits, profit]);
  const invalid = total < 0;

  async function save() {
    if (invalid) {
      setMessage({ ok: false, text: 'Total balance cannot be below $0.' });
      return;
    }
    setBusy(true);
    setMessage(null);
    const res = await apiSetAccountFigures(user.id, amount(deposits), amount(profit));
    setBusy(false);
    if (!res.ok) {
      setMessage({ ok: false, text: res.error });
      return;
    }
    setMessage({ ok: true, text: 'Account figures saved.' });
    onChanged?.();
  }

  async function recordDeposit() {
    const value = Number(depositAmount);
    if (!Number.isFinite(value) || value <= 0) {
      setMessage({ ok: false, text: 'Enter a deposit amount greater than $0.' });
      return;
    }
    setDepositBusy(true);
    setMessage(null);
    const res = await apiCreateAdminDeposit(user.id, value, depositMethod, depositReference);
    setDepositBusy(false);
    if (!res.ok) {
      setMessage({ ok: false, text: res.error });
      return;
    }
    setDepositAmount('');
    setDepositReference('');
    setMessage({ ok: true, text: 'Deposit recorded and approved.' });
    onChanged?.();
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Figure label="Deposits" value={formatUSD(amount(deposits), { cents: true })} />
        <Figure label="Profit" value={formatUSD(amount(profit), { cents: true })} tone={amount(profit) >= 0 ? 'gain' : 'loss'} />
        <Figure label="Total balance" value={formatUSD(total, { cents: true })} emphasis />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <MoneyField
          id={`deposits-${user.id}`}
          label="Total deposits"
          hint="Net deposits after withdrawals."
          value={deposits}
          onChange={(value) => setDeposits(cleanAmount(value, true))}
        />
        <MoneyField
          id={`profit-${user.id}`}
          label="Total profit"
          hint="Use a negative figure for a loss."
          value={profit}
          onChange={(value) => setProfit(cleanAmount(value, true))}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-[12px] text-grey-500">Total balance is calculated as deposits + profit.</p>
        <button disabled={busy || invalid} onClick={save} className="btn-solid btn-sm min-w-28">
          {busy ? 'Saving...' : 'Save figures'}
        </button>
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <div className="text-[12px] font-semibold text-white">Record approved deposit</div>
        <p className="mt-1 text-[11px] text-grey-500">Adds an approved deposit to the user’s deposit and transaction history.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <MoneyField
            id={`admin-deposit-${user.id}`}
            label="Deposit amount"
            hint=""
            value={depositAmount}
            onChange={(value) => setDepositAmount(cleanAmount(value))}
          />
          <div>
            <label htmlFor={`deposit-method-${user.id}`} className="text-[12px] font-medium text-white">Payment method</label>
            <select
              id={`deposit-method-${user.id}`}
              value={depositMethod}
              onChange={(event) => setDepositMethod(event.target.value)}
              className="input mt-2 h-[42px] w-full text-[13px]"
            >
              <option value="bank">Bank transfer</option>
              <option value="paypal">PayPal</option>
              <option value="bitcoin">Bitcoin</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          <input
            className="input min-w-0 flex-1 py-2.5 text-[13px]"
            placeholder="Reference (optional)"
            value={depositReference}
            onChange={(event) => setDepositReference(event.target.value)}
          />
          <button disabled={depositBusy} onClick={recordDeposit} className="btn-outline btn-sm shrink-0">
            {depositBusy ? 'Recording...' : 'Record deposit'}
          </button>
        </div>
      </div>
      {message && <p className={`mt-3 text-[12px] ${message.ok ? 'text-gain' : 'text-loss'}`}>{message.text}</p>}
    </div>
  );
}

function MoneyField({ id, label, hint, value, onChange }) {
  return (
    <div>
      <label htmlFor={id} className="text-[12px] font-medium text-white">{label}</label>
      <div className="relative mt-2">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-grey-500">$</span>
        <input id={id} inputMode="decimal" className="input py-2.5 pl-6 text-[14px]" value={value} onChange={(event) => onChange(event.target.value)} />
      </div>
      <p className="mt-1.5 text-[11px] text-grey-500">{hint}</p>
    </div>
  );
}

function Figure({ label, value, tone, emphasis }) {
  return (
    <div className={`rounded-lg border p-3 ${emphasis ? 'border-scarlet/40 bg-scarlet/[0.07]' : 'border-line'}`}>
      <div className="stat-label">{label}</div>
      <div className={`figure-sm mt-1.5 ${tone === 'gain' ? 'text-gain' : tone === 'loss' ? 'text-loss' : 'text-white'}`}>{value}</div>
    </div>
  );
}
