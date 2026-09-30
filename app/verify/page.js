'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthGate from '@/components/AuthGate';
import { useAccount } from '@/lib/useAccount';
import { apiSubmitKyc } from '@/lib/api';
import { readFileAsDoc, prettySize } from '@/lib/upload';
import Button from '@/components/Button';
import { IconShieldCheck, IconVerified, IconClose } from '@/components/DeskIcons';

const DOC_TYPES = [
  { id: 'passport', label: 'Passport' },
  { id: 'drivers', label: 'Driver’s licence' },
  { id: 'national', label: 'National ID card' },
  { id: 'residence', label: 'Residence permit' },
];

export default function VerifyPage() {
  return (
    <AuthGate>
      <Verify />
    </AuthGate>
  );
}

function Verify() {
  const account = useAccount();
  const [docType, setDocType] = useState('passport');
  const [docs, setDocs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!account.ready || !account.signedIn || !account.profile) return null;
  const status = account.profile.kyc_status;

  async function pick(e, side) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      setBusy(true);
      const doc = await readFileAsDoc(file);
      setDocs((d) => [...d.filter((x) => x.side !== side), { ...doc, side, docType }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (docs.length === 0) return setError('Attach at least the front of your document.');
    setBusy(true);
    const res = await apiSubmitKyc(docs);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    account.refresh();
  }

  // Already-decided states
  if (status === 'verified' || status === 'pending') {
    const verified = status === 'verified';
    return (
      <div className="app-shell container-page flex min-h-[70vh] items-center justify-center pb-24 pt-28">
        <div className="tile tile-feature w-full max-w-md p-8 text-center">
          <div
            className={`mx-auto grid h-14 w-14 place-items-center rounded-full border ${
              verified ? 'border-gain/40 text-gain' : 'border-line text-grey-300'
            }`}
          >
            {verified ? <IconVerified className="h-6 w-6" /> : <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />}
          </div>
          <h1 className="mt-5 text-[20px] font-semibold text-white">
            {verified ? 'Identity verified' : 'Verification in review'}
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-grey-400">
            {verified
              ? 'Your account is fully verified. Withdrawals are enabled.'
              : 'We’re reviewing your documents. You’ll be notified as soon as this is complete.'}
          </p>
          {verified && (
            <span className="pill chip-gain mt-5 gap-1.5">
              <IconVerified className="h-3.5 w-3.5" /> Verified account
            </span>
          )}
          <Link href="/dashboard" className="btn-outline btn-sm mt-7 w-full">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const front = docs.find((d) => d.side === 'front');
  const back = docs.find((d) => d.side === 'back');

  return (
    <div className="app-shell container-page pb-24 pt-28">
      <div className="mx-auto max-w-xl">
        <p className="stat-label flex items-center gap-2"><IconShieldCheck className="h-4 w-4" /> Identity verification</p>
        <h1 className="mt-2 font-sans text-[24px] font-semibold tracking-tight text-white">Verify your identity</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-grey-400">
          A quick check to secure your account and enable withdrawals. Your documents are reviewed by our
          compliance team.
        </p>

        {status === 'rejected' && account.profile.kyc_note && (
          <p className="mt-5 rounded-lg border border-loss/40 bg-loss/10 px-4 py-3 text-[13px] text-loss">
            {account.profile.kyc_note}
          </p>
        )}

        <div className="tile mt-7 p-6">
          <p className="stat-label mb-3">Document type</p>
          <div className="grid grid-cols-2 gap-2">
            {DOC_TYPES.map((d) => (
              <button
                key={d.id}
                onClick={() => setDocType(d.id)}
                className={`rounded-lg border px-3 py-3 text-[13px] font-medium transition-colors ${
                  docType === d.id ? 'border-white/40 bg-white/[0.06] text-white' : 'border-line text-grey-300 hover:border-white/25'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <p className="stat-label mb-3 mt-6">Upload document</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Drop label="Front" doc={front} busy={busy} onPick={(e) => pick(e, 'front')} onClear={() => setDocs((d) => d.filter((x) => x.side !== 'front'))} />
            <Drop label="Back (if applicable)" doc={back} busy={busy} onPick={(e) => pick(e, 'back')} onClear={() => setDocs((d) => d.filter((x) => x.side !== 'back'))} />
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-loss/40 bg-loss/10 px-3 py-2 text-[12px] text-loss">{error}</p>
          )}

          <Button loading={busy} onClick={submit} disabled={docs.length === 0} className="btn-solid mt-6 w-full">
            Submit for verification
          </Button>
          <p className="mt-3 text-[11px] leading-relaxed text-grey-600">
            Make sure the whole document is visible, in focus, and not cropped. Accepted formats: JPG, PNG
            or PDF up to 6&nbsp;MB.
          </p>
        </div>
      </div>
    </div>
  );
}

function Drop({ label, doc, busy, onPick, onClear }) {
  return (
    <div>
      <p className="mb-2 text-[11px] text-grey-500">{label}</p>
      {doc ? (
        <div className="relative overflow-hidden rounded-lg border border-line">
          {doc.type.startsWith('image/') ? (
            <img src={doc.dataUrl} alt={label} className="h-32 w-full object-cover" />
          ) : (
            <div className="grid h-32 place-items-center text-[12px] text-grey-400">{doc.name}</div>
          )}
          <button
            onClick={onClear}
            className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-md border border-line bg-black/70 text-grey-300 hover:text-white"
            aria-label={`Remove ${label}`}
          >
            <IconClose className="h-3 w-3" />
          </button>
          <div className="border-t border-line px-3 py-2 text-[10px] text-grey-500">{prettySize(doc.size)}</div>
        </div>
      ) : (
        <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-line text-center transition-colors hover:border-white/30">
          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={onPick} />
          <span className="text-[12px] text-grey-300">{busy ? 'Processing…' : 'Tap to upload'}</span>
          <span className="mt-1 text-[10px] text-grey-600">JPG, PNG, PDF</span>
        </label>
      )}
    </div>
  );
}
