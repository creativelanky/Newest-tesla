'use client';

import { useState } from 'react';
import Modal from '../Modal';
import { formatUSD, methodLabel } from '@/lib/store';
import { apiApproveRequest, apiRejectRequest } from '@/lib/api';

const FILTERS = ['pending', 'approved', 'rejected', 'all'];

// Shared queue view for deposits and withdrawals.
export default function AdminFunding({ users, requests, kind, onChanged }) {
  const [filter, setFilter] = useState('pending');
  const [viewing, setViewing] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const rows = requests
    .filter((r) => r.kind === kind)
    .filter((r) => filter === 'all' || r.status === filter)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const userById = (id) => users.find((u) => u.id === id);
  const isDeposit = kind === 'deposit';
  const isPdf = (path) => path?.toLowerCase().endsWith('.pdf');

  async function approve(id) {
    setBusy(true);
    const res = await apiApproveRequest(id, note);
    setBusy(false);
    if (res.ok) {
      setViewing(null);
      onChanged();
    }
  }

  async function reject(id) {
    setBusy(true);
    const res = await apiRejectRequest(id, note);
    setBusy(false);
    if (res.ok) {
      setViewing(null);
      onChanged();
    }
  }

  return (
    <div className="tile overflow-hidden">
      <div className="tile-head">
        <h3 className="tile-title">{isDeposit ? 'Deposit requests' : 'Withdrawal requests'}</h3>
        <div className="flex gap-1 rounded-lg border border-line p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`seg-btn ${filter === f ? 'bg-white text-black' : 'text-grey-400 hover:text-white'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="px-5 py-14 text-center text-[13px] text-grey-500">
          No {filter === 'all' ? '' : filter} {isDeposit ? 'deposits' : 'withdrawals'}.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead className="border-b border-line bg-white/[0.015]">
              <tr className="text-[10px] uppercase tracking-wider text-grey-500">
                <th className="px-5 py-3 text-left font-medium">User</th>
                <th className="px-3 py-3 text-left font-medium">Method</th>
                <th className="px-3 py-3 text-right font-medium">Amount</th>
                <th className="px-3 py-3 text-left font-medium">Submitted</th>
                <th className="px-3 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => {
                const user = userById(r.profile_id);
                return (
                  <tr key={r.id} className="row-hover">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-white">{user?.name || 'Deleted user'}</div>
                      <div className="text-[11px] text-grey-500">{user?.email}</div>
                    </td>
                    <td className="px-3 py-3.5 text-grey-300">{methodLabel(r.method)}</td>
                    <td className="px-3 py-3.5 text-right text-white">{formatUSD(r.amount, { cents: true })}</td>
                    <td className="px-3 py-3.5 text-[11px] text-grey-500">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="px-3 py-3.5">
                      <span
                        className={`pill ${
                          r.status === 'approved' ? 'chip-gain' : r.status === 'rejected' ? 'chip-loss' : 'border-line text-grey-300'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setViewing(r); setNote(r.note || ''); }}
                          className="rounded-md border border-line px-3 py-1.5 text-[11px] text-grey-200 hover:border-white/40 hover:text-white"
                        >
                          {isDeposit && r.receiptUrl ? 'View receipt' : 'Details'}
                        </button>
                        {r.status === 'pending' && (
                          <>
                            <button
                              onClick={() => approve(r.id)}
                              className="rounded-md border border-gain/40 px-3 py-1.5 text-[11px] text-gain hover:bg-gain/10"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => reject(r.id)}
                              className="rounded-md border border-loss/40 px-3 py-1.5 text-[11px] text-loss hover:bg-loss/10"
                            >
                              Decline
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={isDeposit ? 'Deposit details' : 'Withdrawal details'}
        subtitle={viewing ? `${userById(viewing.profile_id)?.name || 'Deleted user'} · ${formatUSD(viewing.amount, { cents: true })}` : ''}
        wide
      >
        {viewing && (
          <div className="space-y-4">
            <div className="grid gap-2 rounded-lg border border-line p-4 text-[12px]">
              <Row label="Method" value={methodLabel(viewing.method)} />
              <Row label="Amount" value={formatUSD(viewing.amount, { cents: true })} />
              <Row label="Submitted" value={new Date(viewing.created_at).toLocaleString()} />
              {viewing.reference && <Row label="Reference" value={viewing.reference} />}
              {viewing.destination &&
                Object.entries(viewing.destination).map(([k, v]) =>
                  v ? <Row key={k} label={k.replace(/([A-Z])/g, ' $1')} value={v} /> : null
                )}
            </div>

            {viewing.receiptUrl ? (
              <div>
                <p className="stat-label mb-2">Uploaded receipt</p>
                {isPdf(viewing.receipt_url) ? (
                  <a href={viewing.receiptUrl} target="_blank" rel="noreferrer" className="btn-outline btn-sm w-full">
                    Open receipt (PDF)
                  </a>
                ) : (
                  <a href={viewing.receiptUrl} target="_blank" rel="noreferrer">
                    <img
                      src={viewing.receiptUrl}
                      alt="Receipt"
                      className="max-h-[420px] w-full rounded-lg border border-line object-contain"
                    />
                  </a>
                )}
              </div>
            ) : (
              isDeposit && <p className="text-[12px] text-grey-500">No receipt was attached.</p>
            )}

            {viewing.status === 'pending' && (
              <>
                <div>
                  <p className="stat-label mb-2">Note (optional)</p>
                  <input
                    className="input py-2.5 text-[13px]"
                    placeholder="Shown in the audit trail"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => reject(viewing.id)}
                    disabled={busy}
                    className="btn-sm flex-1 rounded-lg border border-loss/40 py-2.5 text-[11px] font-semibold uppercase tracking-wider2 text-loss hover:bg-loss/10"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => approve(viewing.id)}
                    disabled={busy}
                    className="btn-solid btn-sm flex-1"
                  >
                    Approve
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="capitalize text-grey-500">{label}</span>
      <span className="break-all text-right text-grey-100">{value}</span>
    </div>
  );
}
