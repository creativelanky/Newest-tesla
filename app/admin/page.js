'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminOverview } from '@/lib/useAccount';
import { supabaseBrowser } from '@/lib/supabase/client';
import AdminGate from '@/components/admin/AdminGate';
import AdminUserDetail, { NotifyComposer } from '@/components/admin/AdminUserDetail';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminParcels from '@/components/admin/AdminParcels';
import Modal from '@/components/Modal';
import { formatUSD } from '@/lib/store';
import { IconUsers, IconSettings, IconVerified, IconArrowUpRight, IconBell, IconPackage } from '@/components/DeskIcons';

export default function AdminPage() {
  return (
    <AdminGate>
      <Console />
    </AdminGate>
  );
}

function Console() {
  const router = useRouter();
  const overview = useAdminOverview();
  const [selectedId, setSelectedId] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [parcelsOpen, setParcelsOpen] = useState(false);
  const [q, setQ] = useState('');
  if (!overview.ready) return null;

  const { users, requests, kycDocsByUser, refresh } = overview;

  // Per-user pending indicators.
  const flagsFor = (id) => ({
    deposits: requests.filter((r) => r.profile_id === id && r.kind === 'deposit' && r.status === 'pending').length,
    withdrawals: requests.filter((r) => r.profile_id === id && r.kind === 'withdrawal' && r.status === 'pending').length,
  });

  const totalPending = requests.filter((r) => r.status === 'pending').length;
  const totalKyc = users.filter((u) => u.kyc_status === 'pending').length;

  const selected = selectedId ? users.find((u) => u.id === selectedId) : null;

  const filtered = users
    .filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  async function signOut() {
    await supabaseBrowser().auth.signOut();
    router.replace('/admin/login');
  }

  return (
    <div className="admin min-h-screen bg-ink font-sans">
      {/* Console top bar */}
      <div className="border-b border-line bg-black/70 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="live-dot" />
            <span className="text-[13px] font-semibold uppercase tracking-wider2 text-white">Admin console</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setBroadcastOpen(true)} className="flex items-center gap-2 rounded-md border border-line bg-card2 px-3.5 py-2 text-[12px] text-grey-100 hover:text-white">
              <IconBell className="h-3.5 w-3.5" /> Broadcast
            </button>
            <button onClick={() => setParcelsOpen(true)} className="flex items-center gap-2 rounded-md border border-line bg-card2 px-3.5 py-2 text-[12px] text-grey-100 hover:text-white">
              <IconPackage className="h-3.5 w-3.5" /> Parcels
            </button>
            <button onClick={() => setSettingsOpen(true)} className="flex items-center gap-2 rounded-md border border-line bg-card2 px-3.5 py-2 text-[12px] text-grey-100 hover:text-white">
              <IconSettings className="h-3.5 w-3.5" /> Payment settings
            </button>
            <button onClick={signOut} className="flex items-center gap-2 rounded-md border border-line px-3.5 py-2 text-[12px] text-grey-300 hover:text-white">
              <IconArrowUpRight className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="container-page py-8">
        {selected ? (
          <AdminUserDetail
            user={selected}
            requests={requests}
            kycDocs={kycDocsByUser[selected.id] || []}
            onBack={() => setSelectedId(null)}
            onChanged={refresh}
          />
        ) : (
          <>
            {/* Summary */}
            <div className="grid gap-3 sm:grid-cols-3">
              <Summary label="Users" value={users.length} />
              <Summary label="Pending requests" value={totalPending} warn={totalPending > 0} />
              <Summary label="Awaiting verification" value={totalKyc} warn={totalKyc > 0} />
            </div>

            {/* Users list */}
            <div className="mt-6 tile overflow-hidden">
              <div className="tile-head">
                <h3 className="tile-title flex items-center gap-2.5"><span className="icon-chip"><IconUsers className="h-3.5 w-3.5" /></span>Users</h3>
                <input
                  className="w-56 rounded-md border border-line bg-ink px-3 py-1.5 text-[12px] text-white placeholder:text-grey-600 focus:border-white/40 focus:outline-none"
                  placeholder="Search name or email"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>

              {filtered.length === 0 ? (
                <p className="px-5 py-16 text-center text-[13px] text-grey-500">No users found.</p>
              ) : (
                <div className="divide-y divide-line">
                  {filtered.map((u) => {
                    const f = flagsFor(u.id);
                    const needs = f.deposits + f.withdrawals + (u.kyc_status === 'pending' ? 1 : 0);
                    return (
                      <button
                        key={u.id}
                        onClick={() => setSelectedId(u.id)}
                        className="row-hover flex w-full items-center gap-4 px-5 py-4 text-left"
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-card2 text-[11px] font-semibold text-grey-200">
                          {u.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-[14px] font-medium text-white">{u.name}</span>
                            {u.kyc_status === 'verified' && <IconVerified className="h-3.5 w-3.5 text-gain" />}
                            {u.status === 'suspended' && <span className="pill chip-loss">Suspended</span>}
                            {u.role === 'admin' && <span className="pill border-line text-grey-400">Admin</span>}
                          </div>
                          <div className="truncate text-[11px] text-grey-500">{u.email}</div>
                        </div>

                        {/* Attention flags */}
                        <div className="hidden items-center gap-1.5 sm:flex">
                          {f.deposits > 0 && <Flag label={`${f.deposits} deposit`} />}
                          {f.withdrawals > 0 && <Flag label={`${f.withdrawals} withdrawal`} />}
                          {u.kyc_status === 'pending' && <Flag label="KYC" />}
                        </div>

                        <div className="w-28 text-right">
                          <div className="text-[14px] text-white">{formatUSD(u.balance, { cents: true })}</div>
                          <div className="text-[11px] text-grey-500">balance</div>
                        </div>
                        <span className={`text-[16px] ${needs > 0 ? 'text-warn' : 'text-grey-600'}`}>›</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Payment settings" subtitle="Shown to users inside the deposit flow" wide>
        <AdminSettings onChanged={refresh} />
      </Modal>

      <Modal open={broadcastOpen} onClose={() => setBroadcastOpen(false)} title="Broadcast notification" subtitle="Sends to every user">
        <NotifyComposer broadcast onSent={refresh} />
      </Modal>

      <Modal open={parcelsOpen} onClose={() => setParcelsOpen(false)} title="Parcel tracking" subtitle="Generate tracking codes and update parcel progress" wide>
        <AdminParcels users={users} />
      </Modal>
    </div>
  );
}

function Summary({ label, value, warn }) {
  return (
    <div className={`tile p-5 ${warn ? 'ring-1 ring-warn/40' : ''}`}>
      <div className="stat-label">{label}</div>
      <div className={`figure-md mt-1.5 ${warn ? 'text-warn' : 'text-white'}`}>{value}</div>
    </div>
  );
}

function Flag({ label }) {
  return <span className="pill chip-warn whitespace-nowrap">{label}</span>;
}
