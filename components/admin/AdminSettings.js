'use client';

import { useEffect, useState } from 'react';
import { fetchSettings, apiSaveSettings } from '@/lib/api';
import { IconBitcoin, IconWalletLine, IconLayers, IconSettings } from '../DeskIcons';

// Payment destinations shown to users inside the deposit flow.
export default function AdminSettings({ onChanged }) {
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchSettings().then((res) => {
      if (res.ok) setForm(res.data);
    });
  }, []);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
  }

  async function save() {
    setBusy(true);
    const res = await apiSaveSettings({
      btc_address: form.btcAddress,
      btc_network: form.btcNetwork,
      paypal_email: form.paypalEmail,
      bank_name: form.bankName,
      bank_account_name: form.bankAccountName,
      bank_account_number: form.bankAccountNumber,
      bank_routing: form.bankRouting,
      bank_swift: form.bankSwift,
      min_deposit: Number(form.minDeposit) || 0,
      support_name: form.supportName,
    });
    setBusy(false);
    if (res.ok) {
      setSaved(true);
      onChanged?.();
      setTimeout(() => setSaved(false), 2200);
    }
  }

  if (!form) return <div className="tile p-14 text-center text-[13px] text-grey-500">Loading…</div>;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card icon={IconBitcoin} title="Bitcoin">
        <Field label="BTC address" value={form.btcAddress} onChange={(v) => set('btcAddress', v)} mono />
        <Field label="Network label" value={form.btcNetwork} onChange={(v) => set('btcNetwork', v)} />
      </Card>

      <Card icon={IconWalletLine} title="PayPal">
        <Field label="PayPal email / handle" value={form.paypalEmail} onChange={(v) => set('paypalEmail', v)} />
      </Card>

      <Card icon={IconLayers} title="Bank transfer">
        <Field label="Bank name" value={form.bankName} onChange={(v) => set('bankName', v)} />
        <Field label="Account name" value={form.bankAccountName} onChange={(v) => set('bankAccountName', v)} />
        <Field label="Account number / IBAN" value={form.bankAccountNumber} onChange={(v) => set('bankAccountNumber', v)} mono />
        <Field label="Routing / sort code" value={form.bankRouting} onChange={(v) => set('bankRouting', v)} mono />
        <Field label="SWIFT / BIC" value={form.bankSwift} onChange={(v) => set('bankSwift', v)} mono />
      </Card>

      <Card icon={IconSettings} title="Platform">
        <Field label="Minimum deposit (USD)" value={form.minDeposit} onChange={(v) => set('minDeposit', v.replace(/[^0-9.]/g, ''))} />
        <Field label="Support display name" value={form.supportName} onChange={(v) => set('supportName', v)} />
        <p className="mt-1 text-[11px] leading-relaxed text-grey-600">
          Admin access is granted per-account (profiles.role = 'admin'), not by a shared passcode.
        </p>
      </Card>

      <div className="lg:col-span-2">
        <div className="flex items-center gap-3">
          <button onClick={save} disabled={busy} className="btn-solid">
            {busy ? 'Saving…' : 'Save payment details'}
          </button>
          {saved && <span className="text-[12px] text-gain">Saved — users now see these details.</span>}
        </div>
      </div>
    </div>
  );
}

function Card({ icon: Icon, title, children }) {
  return (
    <div className="rounded-xl border border-line bg-card2 p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-line bg-card text-grey-400"><Icon className="h-3.5 w-3.5" /></span>
        <h3 className="tile-title">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, mono }) {
  return (
    <div>
      <label className="stat-label mb-1.5 block">{label}</label>
      <input
        className={`input py-2.5 text-[13px] ${mono ? 'font-mono' : ''}`}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
