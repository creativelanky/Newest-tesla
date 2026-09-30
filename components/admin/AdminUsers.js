'use client';

import { useState } from 'react';
import Modal from '../Modal';
import { formatUSD } from '@/lib/store';
import {
  apiSetStatus,
  apiDeleteUser,
} from '@/lib/api';
import { IconTrash, IconVerified } from '../DeskIcons';
import AccountFiguresForm from './AccountFiguresForm';

export default function AdminUsers({ users, onChanged }) {
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [q, setQ] = useState('');

  const filtered = users
    .filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Keep the "editing" row fresh across refreshes (e.g. after an edit).
  const editingLive = editing ? users.find((u) => u.id === editing.id) || editing : null;

  return (
    <div className="tile overflow-hidden">
      <div className="tile-head">
        <h3 className="tile-title">Users</h3>
        <input
          className="w-52 rounded-md border border-line bg-black px-3 py-1.5 text-[12px] text-white placeholder:text-grey-600 focus:border-white/40 focus:outline-none"
          placeholder="Search name or email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="px-5 py-14 text-center text-[13px] text-grey-500">No users yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead className="border-b border-line bg-white/[0.015]">
              <tr className="text-[10px] uppercase tracking-wider text-grey-500">
                <th className="px-5 py-3 text-left font-medium">User</th>
                <th className="px-3 py-3 text-left font-medium">Status</th>
                <th className="px-3 py-3 text-right font-medium">Balance</th>
                <th className="px-3 py-3 text-right font-medium">Profit</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((u) => (
                <tr key={u.id} className="row-hover">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{u.name}</span>
                      {u.kyc_status === 'verified' && (
                        <span className="pill chip-gain gap-1 px-1.5 py-0.5">
                          <IconVerified className="h-3 w-3" />
                        </span>
                      )}
                      {u.role === 'admin' && <span className="pill border-line text-grey-300">Admin</span>}
                    </div>
                    <div className="mt-0.5 text-[11px] text-grey-500">{u.email}</div>
                  </td>
                  <td className="px-3 py-3.5">
                    <span className={`pill ${u.status === 'active' ? 'border-line text-grey-300' : 'chip-loss'}`}>
                      {u.status === 'active' ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-right text-white">{formatUSD(u.balance, { cents: true })}</td>
                  <td className={`px-3 py-3.5 text-right ${Number(u.profit || 0) >= 0 ? 'text-gain' : 'text-loss'}`}>
                    {formatUSD(u.profit || 0, { cents: true })}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditing(u)} className="rounded-md border border-line px-3 py-1.5 text-[11px] text-grey-200 hover:border-white/40 hover:text-white">
                        Manage
                      </button>
                      <button
                        onClick={() => setConfirmDelete(u)}
                        className="rounded-md border border-line px-2 py-1.5 text-grey-400 hover:border-loss/50 hover:text-loss"
                        aria-label={`Delete ${u.name}`}
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.name} subtitle={editing?.email} wide>
        {editingLive && <ManageUser user={editingLive} onClose={() => setEditing(null)} onChanged={onChanged} />}
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete user">
        {confirmDelete && (
          <div>
            <p className="text-[13px] leading-relaxed text-grey-300">
              Permanently delete <span className="text-white">{confirmDelete.name}</span> ({confirmDelete.email})?
              Their balance, positions, documents and funding history will be removed. This cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-outline btn-sm flex-1">Cancel</button>
              <button
                onClick={async () => {
                  const res = await apiDeleteUser(confirmDelete.id);
                  setConfirmDelete(null);
                  if (res.ok) onChanged();
                }}
                className="btn-sm flex-1 rounded-lg bg-loss py-2.5 text-[11px] font-semibold uppercase tracking-wider2 text-white hover:bg-loss/85"
              >
                Delete user
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ManageUser({ user, onClose, onChanged }) {
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  function flash(t) {
    setMsg(t);
    setTimeout(() => setMsg(''), 2000);
  }

  async function run(action) {
    setBusy(true);
    const res = await action();
    setBusy(false);
    if (res.ok) onChanged();
    return res;
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-4">
        <Mini label="Total balance" value={formatUSD(user.balance, { cents: true })} />
        <Mini label="Deposits" value={formatUSD(user.deposit_total || 0, { cents: true })} />
        <Mini label="Profit" value={formatUSD(user.profit || 0, { cents: true })} tone={Number(user.profit || 0) >= 0 ? 'gain' : 'loss'} />
        <Mini label="Verification" value={user.kyc_status} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Mini label="Phone" value={user.phone || '—'} />
        <Mini label="Country" value={user.country || '—'} />
        <Mini label="City" value={user.city || '—'} />
      </div>

      <Section title="Account figures" hint="Set deposits and profit directly. Total balance is calculated automatically.">
        <AccountFiguresForm user={user} onChanged={onChanged} />
      </Section>

      <Section title="Account status">
        <div className="flex gap-2">
          <button
            disabled={busy}
            onClick={() => run(() => apiSetStatus(user.id, user.status === 'active' ? 'suspended' : 'active')).then(() => flash('Status updated.'))}
            className="btn-outline btn-sm"
          >
            {user.status === 'active' ? 'Suspend account' : 'Reactivate account'}
          </button>
        </div>
      </Section>

      {msg && <p className="rounded-lg border border-gain/40 bg-gain/10 px-3 py-2 text-[12px] text-gain">{msg}</p>}

      <button onClick={onClose} className="btn-outline btn-sm w-full">Done</button>
    </div>
  );
}

function Section({ title, hint, children }) {
  return (
    <div className="rounded-lg border border-line p-4">
      <div className="mb-2.5">
        <div className="text-[12px] font-semibold text-white">{title}</div>
        {hint && <div className="mt-0.5 text-[11px] text-grey-500">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function Mini({ label, value, tone }) {
  return (
    <div className="rounded-lg border border-line p-3">
      <div className="stat-label">{label}</div>
      <div className={`figure-sm mt-1.5 capitalize ${tone === 'gain' ? 'text-gain' : tone === 'loss' ? 'text-loss' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}
