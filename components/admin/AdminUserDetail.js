'use client';

import { useState } from 'react';
import Modal from '../Modal';
import Button from '../Button';
import { formatUSD, methodLabel } from '@/lib/store';
import {
  apiApproveRequest,
  apiRejectRequest,
  apiRevertRequest,
  apiDecideKyc,
  apiSetBalance,
  apiAdjustBalance,
  apiSetProfit,
  apiAddProfit,
  apiSetStatus,
  apiDeleteUser,
  apiSendNotification,
} from '@/lib/api';
import {
  IconArrowDownLeft,
  IconArrowUpRight,
  IconShieldCheck,
  IconVerified,
  IconWalletLine,
  IconTrash,
  IconPulse,
  IconBell,
} from '../DeskIcons';

// Everything about one user on a single screen: profile, money controls,
// KYC, their deposits/withdrawals, and their support thread.
export default function AdminUserDetail({ user, requests, kycDocs, onBack, onChanged }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmKyc, setConfirmKyc] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [pending, setPending] = useState(null); // key of the action currently running

  const deposits = requests.filter((r) => r.profile_id === user.id && r.kind === 'deposit');
  const withdrawals = requests.filter((r) => r.profile_id === user.id && r.kind === 'withdrawal');

  // Runs an async action; when `key` is given, exposes which action is in
  // flight so its button can show a spinner.
  async function act(fn, key) {
    if (key) setPending(key);
    const res = await fn();
    if (res?.ok) onChanged();
    if (key) setPending((p) => (p === key ? null : p));
    return res;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={onBack} className="mt-0.5 rounded-md border border-line bg-card2 px-3 py-2 text-[12px] text-grey-200 hover:text-white">
            ← Users
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-sans text-[22px] font-semibold tracking-tight text-white">{user.name}</h1>
              {user.kyc_status === 'verified' && (
                <span className="pill chip-gain gap-1"><IconVerified className="h-3 w-3" /> Verified</span>
              )}
              {user.kyc_status === 'pending' && (
                <span className="pill chip-warn gap-1"><IconShieldCheck className="h-3 w-3" /> KYC pending</span>
              )}
              <span className={`pill ${user.status === 'active' ? 'border-line text-grey-300' : 'chip-loss'}`}>
                {user.status === 'active' ? 'Active' : 'Suspended'}
              </span>
              {user.role === 'admin' && <span className="pill border-line text-grey-300">Admin</span>}
            </div>
            <p className="mt-1 text-[12px] text-grey-500">{user.email}</p>
            {user.status === 'suspended' && user.suspend_reason && (
              <p className="mt-2 max-w-md text-[12px] leading-relaxed text-loss/90">
                <span className="font-semibold uppercase tracking-wider">Reason:</span> {user.suspend_reason}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {user.status === 'active' ? (
            <button
              onClick={() => { setSuspendReason(''); setSuspendOpen(true); }}
              className="rounded-md border border-line bg-card2 px-3.5 py-2 text-[12px] text-grey-100 hover:text-white"
            >
              Suspend
            </button>
          ) : (
            <Button
              loading={pending === 'status'}
              onClick={() => act(() => apiSetStatus(user.id, 'active'), 'status')}
              className="inline-flex items-center gap-2 rounded-md border border-line bg-card2 px-3.5 py-2 text-[12px] text-grey-100 hover:text-white"
              spinnerClassName="h-3.5 w-3.5"
            >
              Reinstate
            </Button>
          )}
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-2 rounded-md border border-loss/40 px-3.5 py-2 text-[12px] text-loss hover:bg-loss/10"
          >
            <IconTrash className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </div>

      {/* Snapshot */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Balance" value={formatUSD(user.balance, { cents: true })} />
        <Stat label="Profit" value={formatUSD(user.profit || 0, { cents: true })} tone={Number(user.profit || 0) >= 0 ? 'gain' : 'loss'} />
        <Stat label="Country" value={user.country || '—'} plain />
        <Stat label="Phone" value={user.phone || '—'} plain />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Money controls */}
        <div className="tile p-6">
          <SectionTitle icon={IconWalletLine} title="Balance & profit" />
          <div className="mt-4 space-y-4">
            <MoneyAction label="Set balance" hint="Overwrites the available balance." cta="Set"
              onSubmit={(v) => act(() => apiSetBalance(user.id, v))} initial={String(user.balance)} />
            <MoneyAction label="Credit / debit" hint="Add (+) to or deduct (−) from the balance." cta="Apply" signed
              onSubmit={(v) => act(() => apiAdjustBalance(user.id, v))} placeholder="e.g. 250" clearOnSubmit />
            <MoneyAction label="Add / reduce profit" hint="Adjusts balance and reported profit by ± this amount." cta="Apply" signed
              onSubmit={(v) => act(() => apiAddProfit(user.id, v))} clearOnSubmit />
            <MoneyAction label="Set profit figure" hint="Overwrites the profit shown to the user." cta="Set" signed
              onSubmit={(v) => act(() => apiSetProfit(user.id, v))} initial={String(user.profit || 0)} />
          </div>
        </div>

        {/* KYC */}
        <div className={`tile p-6 ${user.kyc_status === 'pending' ? 'ring-1 ring-warn/40' : ''}`}>
          <div className="flex items-center justify-between">
            <SectionTitle icon={IconShieldCheck} title="Identity verification" />
            {user.kyc_status === 'pending' && <span className="pill chip-warn">Needs review</span>}
          </div>

          {kycDocs.length === 0 ? (
            <p className="mt-4 text-[13px] text-grey-500">No documents submitted{user.kyc_status === 'rejected' ? ' since rejection.' : '.'}</p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {kycDocs.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setReceipt({ url: d.url, label: `${d.side} · ${d.doc_type}`, pdf: d.file_url?.endsWith('.pdf') })}
                  className="overflow-hidden rounded-lg border border-line text-left"
                >
                  {d.file_url?.endsWith('.pdf') ? (
                    <div className="grid h-28 place-items-center bg-card2 text-[12px] text-grey-300">PDF</div>
                  ) : (
                    <img src={d.url} alt={d.side} className="h-28 w-full object-cover" />
                  )}
                  <div className="border-t border-line px-2.5 py-1.5 text-[10px] capitalize text-grey-400">{d.side} · {d.doc_type}</div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center gap-2">
            <span className="text-[12px] text-grey-500">Current:</span>
            <span className={`pill capitalize ${
              user.kyc_status === 'verified' ? 'chip-gain' : user.kyc_status === 'rejected' ? 'chip-loss' : user.kyc_status === 'pending' ? 'chip-warn' : 'border-line text-grey-300'
            }`}>
              {user.kyc_status}
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            {user.kyc_status === 'verified' ? (
              // Already verified — no re-approve; allow reset so a mistake is undoable.
              <Button
                loading={pending === 'kyc-revoke'}
                onClick={() => act(() => apiDecideKyc(user.id, 'none', ''), 'kyc-revoke')}
                className="inline-flex items-center justify-center gap-2 flex-1 rounded-md border border-line py-2 text-[12px] text-grey-300 hover:text-white"
                spinnerClassName="h-3.5 w-3.5"
              >
                Revoke verification
              </Button>
            ) : (
              <>
                <button
                  onClick={() => setConfirmKyc(true)}
                  className="flex-1 rounded-md border border-gain/40 py-2 text-[12px] text-gain hover:bg-gain/10"
                >
                  Approve
                </button>
                {user.kyc_status !== 'rejected' && (
                  <Button
                    loading={pending === 'kyc-reject'}
                    onClick={() => act(() => apiDecideKyc(user.id, 'rejected', 'Your documents could not be verified. Please submit a clearer photo.'), 'kyc-reject')}
                    className="inline-flex items-center justify-center gap-2 flex-1 rounded-md border border-loss/40 py-2 text-[12px] text-loss hover:bg-loss/10"
                    spinnerClassName="h-3.5 w-3.5"
                  >
                    Reject
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Deposits */}
        <FundingList
          title="Deposits" icon={IconArrowDownLeft} rows={deposits}
          onApprove={(id) => act(() => apiApproveRequest(id))}
          onReject={(id) => act(() => apiRejectRequest(id))}
          onRevert={(id) => act(() => apiRevertRequest(id))}
          onReceipt={(r) => setReceipt({ url: r.receiptUrl, label: 'Receipt', pdf: r.receipt_url?.endsWith('.pdf') })}
        />

        {/* Withdrawals */}
        <FundingList
          title="Withdrawals" icon={IconArrowUpRight} rows={withdrawals}
          onApprove={(id) => act(() => apiApproveRequest(id))}
          onReject={(id) => act(() => apiRejectRequest(id))}
          onRevert={(id) => act(() => apiRevertRequest(id))}
        />
      </div>

      {/* Send notification */}
      <div className="mt-6 tile p-6">
        <SectionTitle icon={IconBell} title="Send notification" />
        <NotifyComposer userId={user.id} onSent={onChanged} />
      </div>

      {/* Receipt / doc lightbox */}
      <Modal open={!!receipt} onClose={() => setReceipt(null)} title={receipt?.label || 'Document'} wide>
        {receipt && (
          receipt.pdf ? (
            <a href={receipt.url} target="_blank" rel="noreferrer" className="btn-outline btn-sm w-full">Open PDF</a>
          ) : (
            <img src={receipt.url} alt={receipt.label} className="max-h-[70vh] w-full rounded-lg border border-line object-contain" />
          )
        )}
      </Modal>

      {/* Suspend with reason */}
      <Modal open={suspendOpen} onClose={() => setSuspendOpen(false)} title="Suspend account"
        subtitle="The user is locked out of everything except support, and shown this reason.">
        <label className="label" htmlFor="suspend-reason">Reason shown to the user</label>
        <textarea
          id="suspend-reason"
          className="input min-h-[104px] resize-y"
          placeholder="e.g. We need to re-verify your identity before you can continue."
          value={suspendReason}
          onChange={(e) => setSuspendReason(e.target.value)}
        />
        <p className="mt-2 text-[12px] text-grey-500">Optional — leave blank to suspend without a specific reason.</p>
        <div className="mt-6 flex gap-3">
          <button onClick={() => setSuspendOpen(false)} className="btn-outline btn-sm flex-1">Cancel</button>
          <Button
            loading={pending === 'status'}
            onClick={async () => {
              const res = await act(() => apiSetStatus(user.id, 'suspended', suspendReason.trim()), 'status');
              if (res?.ok) setSuspendOpen(false);
            }}
            className="btn-scarlet btn-sm flex-1"
          >
            Suspend account
          </Button>
        </div>
      </Modal>

      {/* KYC approve confirm */}
      <Modal open={confirmKyc} onClose={() => setConfirmKyc(false)} title="Approve verification">
        <p className="text-[13px] leading-relaxed text-grey-300">
          Confirm that <span className="text-white">{user.name}</span>’s identity documents are valid.
          They’ll be marked <span className="text-gain">verified</span> and withdrawals will be enabled.
        </p>
        <div className="mt-6 flex gap-3">
          <button onClick={() => setConfirmKyc(false)} className="btn-outline btn-sm flex-1">Cancel</button>
          <Button
            loading={pending === 'kyc'}
            onClick={async () => {
              const res = await act(() => apiDecideKyc(user.id, 'verified', ''), 'kyc');
              if (res?.ok) setConfirmKyc(false);
            }}
            className="btn-solid btn-sm flex-1"
          >
            Confirm & verify
          </Button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete user">
        <p className="text-[13px] leading-relaxed text-grey-300">
          Permanently delete <span className="text-white">{user.name}</span> ({user.email})? Their balance,
          positions, documents, funding history and messages will be removed. This cannot be undone.
        </p>
        <div className="mt-6 flex gap-3">
          <button onClick={() => setConfirmDelete(false)} className="btn-outline btn-sm flex-1">Cancel</button>
          <Button
            loading={pending === 'delete'}
            onClick={async () => {
              setPending('delete');
              const res = await apiDeleteUser(user.id);
              if (res.ok) { setConfirmDelete(false); onChanged(); onBack(); }
              else setPending((p) => (p === 'delete' ? null : p));
            }}
            className="btn-sm inline-flex items-center justify-center gap-2 flex-1 rounded-lg bg-loss py-2.5 text-[11px] font-semibold uppercase tracking-wider2 text-white hover:bg-loss/85"
          >
            Delete user
          </Button>
        </div>
      </Modal>
    </div>
  );
}


function FundingList({ title, icon: Icon, rows, onApprove, onReject, onRevert, onReceipt }) {
  const sorted = [...rows].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return (
    <div className="tile overflow-hidden">
      <div className="tile-head">
        <h3 className="tile-title flex items-center gap-2.5"><span className="icon-chip"><Icon className="h-3.5 w-3.5" /></span>{title}</h3>
        <span className="text-[12px] text-grey-500">{rows.length}</span>
      </div>
      {sorted.length === 0 ? (
        <p className="px-5 py-10 text-center text-[13px] text-grey-500">No {title.toLowerCase()} yet.</p>
      ) : (
        <div className="max-h-[22rem] divide-y divide-line overflow-y-auto">
          {sorted.map((r) => (
            <FundingRow key={r.id} r={r} onApprove={onApprove} onReject={onReject} onRevert={onRevert} onReceipt={onReceipt} />
          ))}
        </div>
      )}
    </div>
  );
}

function FundingRow({ r, onApprove, onReject, onRevert, onReceipt }) {
  const [busy, setBusy] = useState(null); // 'approve' | 'reject' | 'revert' | null
  async function run(kind, fn) {
    setBusy(kind);
    await fn(r.id);
    setBusy(null);
  }
  return (
    <div className="px-5 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[13px] text-white">{formatUSD(r.amount, { cents: true })} · {methodLabel(r.method)}</div>
          <div className="text-[11px] text-grey-600">{new Date(r.created_at).toLocaleString()}</div>
        </div>
        <span className={`pill ${r.status === 'approved' ? 'chip-gain' : r.status === 'rejected' ? 'chip-loss' : 'chip-warn'}`}>
          {r.status}
        </span>
      </div>
      {r.destination && Object.values(r.destination).some(Boolean) && (
        <div className="mt-1.5 text-[11px] text-grey-500">
          {Object.entries(r.destination).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' · ')}
        </div>
      )}
      <div className="mt-2.5 flex gap-2">
        {onReceipt && r.receiptUrl && (
          <button onClick={() => onReceipt(r)} className="rounded-md border border-line bg-card2 px-3 py-1.5 text-[11px] text-grey-200 hover:text-white">
            Receipt
          </button>
        )}
        {r.status === 'pending' ? (
          <>
            <Button loading={busy === 'approve'} disabled={!!busy} onClick={() => run('approve', onApprove)}
              className="inline-flex items-center gap-1.5 rounded-md border border-gain/40 px-3 py-1.5 text-[11px] text-gain hover:bg-gain/10" spinnerClassName="h-3 w-3">
              Approve
            </Button>
            <Button loading={busy === 'reject'} disabled={!!busy} onClick={() => run('reject', onReject)}
              className="inline-flex items-center gap-1.5 rounded-md border border-loss/40 px-3 py-1.5 text-[11px] text-loss hover:bg-loss/10" spinnerClassName="h-3 w-3">
              Decline
            </Button>
          </>
        ) : (
          onRevert && (
            <Button loading={busy === 'revert'} disabled={!!busy} onClick={() => run('revert', onRevert)}
              className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[11px] text-grey-300 hover:text-white" spinnerClassName="h-3 w-3">
              Revert to pending
            </Button>
          )
        )}
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <h3 className="tile-title flex items-center gap-2.5"><span className="icon-chip"><Icon className="h-3.5 w-3.5" /></span>{title}</h3>
  );
}

// Reusable notification composer. Omit userId to broadcast to everyone.
export function NotifyComposer({ userId = null, onSent, broadcast }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function send() {
    if (!title.trim()) return setMsg({ ok: false, text: 'Add a title.' });
    setBusy(true);
    const res = await apiSendNotification({ userId, title, body });
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: res.error });
    setMsg({ ok: true, text: broadcast ? `Sent to ${res.data?.sent ?? 'all'} users.` : 'Notification sent.' });
    setTitle('');
    setBody('');
    onSent?.();
    setTimeout(() => setMsg(null), 2500);
  }

  return (
    <div className="mt-4">
      <input
        className="input py-2.5 text-[14px]"
        placeholder="Title (e.g. Account update)"
        value={title}
        onChange={(e) => { setTitle(e.target.value); setMsg(null); }}
      />
      <textarea
        rows={3}
        className="input mt-3 resize-y py-2.5 text-[14px]"
        placeholder="Message (optional)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      {msg && (
        <p className={`mt-3 text-[12px] ${msg.ok ? 'text-gain' : 'text-loss'}`}>{msg.text}</p>
      )}
      <Button loading={busy} onClick={send} className="btn-solid btn-sm mt-3 gap-2">
        {broadcast ? 'Broadcast to all users' : 'Send notification'}
      </Button>
    </div>
  );
}

function Stat({ label, value, tone, plain }) {
  return (
    <div className="tile p-4">
      <div className="stat-label">{label}</div>
      <div className={`mt-1.5 ${plain ? 'text-[14px] text-grey-100' : 'figure-md'} ${tone === 'gain' ? 'text-gain' : tone === 'loss' ? 'text-loss' : ''}`}>
        {value}
      </div>
    </div>
  );
}

function MoneyAction({ label, hint, cta, onSubmit, initial = '', placeholder = '0.00', signed, clearOnSubmit }) {
  const [value, setValue] = useState(String(initial).replace(/-/g, ''));
  const [sign, setSign] = useState(String(initial).trim().startsWith('-') ? -1 : 1);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[12px] font-medium text-white">{label}</span>
        {ok && <span className="text-[11px] text-gain">Saved</span>}
      </div>
      <div className="flex gap-2">
        {signed && (
          // Sign toggle — so a minus never has to be typed (mobile numeric
          // keypads don't have one). Pick − to deduct / reduce.
          <div className="flex shrink-0 overflow-hidden rounded-lg border border-line">
            <button
              type="button"
              onClick={() => setSign(1)}
              className={`w-9 text-[16px] font-semibold ${sign === 1 ? 'bg-gain/20 text-gain' : 'text-grey-500 hover:text-white'}`}
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setSign(-1)}
              className={`w-9 border-l border-line text-[16px] font-semibold ${sign === -1 ? 'bg-loss/20 text-loss' : 'text-grey-500 hover:text-white'}`}
            >
              −
            </button>
          </div>
        )}
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-grey-500">$</span>
          <input
            inputMode="decimal"
            className="input py-2.5 pl-6 text-[14px]"
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^0-9.]/g, ''))}
          />
        </div>
        <Button
          loading={busy}
          onClick={async () => {
            setBusy(true);
            await onSubmit((signed ? sign : 1) * Number(value));
            setBusy(false);
            if (clearOnSubmit) setValue('');
            setOk(true);
            setTimeout(() => setOk(false), 1500);
          }}
          className="btn-solid btn-sm shrink-0"
        >
          {cta}
        </Button>
      </div>
      {hint && <p className="mt-1 text-[11px] text-grey-500">{hint}</p>}
    </div>
  );
}
