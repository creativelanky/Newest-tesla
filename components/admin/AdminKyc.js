'use client';

import { useState } from 'react';
import Modal from '../Modal';
import { apiDecideKyc } from '@/lib/api';
import { IconVerified } from '../DeskIcons';

const FILTERS = ['pending', 'verified', 'rejected', 'all'];

export default function AdminKyc({ users, kycDocsByUser, onChanged }) {
  const [filter, setFilter] = useState('pending');
  const [viewing, setViewing] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const rows = users
    .filter((u) => (filter === 'all' ? u.kyc_status !== 'none' : u.kyc_status === filter))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const isPdf = (path) => path?.toLowerCase().endsWith('.pdf');

  async function decide(userId, status, defaultNote = '') {
    setBusy(true);
    const res = await apiDecideKyc(userId, status, note || defaultNote);
    setBusy(false);
    if (res.ok) {
      setViewing(null);
      onChanged();
    }
  }

  return (
    <div className="tile overflow-hidden">
      <div className="tile-head">
        <h3 className="tile-title">Identity verification</h3>
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
        <p className="px-5 py-14 text-center text-[13px] text-grey-500">Nothing {filter === 'all' ? 'submitted' : filter}.</p>
      ) : (
        <div className="divide-y divide-line">
          {rows.map((u) => {
            const docs = kycDocsByUser[u.id] || [];
            return (
              <div key={u.id} className="row-hover flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-white">{u.name}</span>
                    {u.kyc_status === 'verified' && (
                      <span className="pill chip-gain gap-1"><IconVerified className="h-3 w-3" /> Verified</span>
                    )}
                    {u.kyc_status === 'pending' && <span className="pill border-line text-grey-300">Pending</span>}
                    {u.kyc_status === 'rejected' && <span className="pill chip-loss">Rejected</span>}
                  </div>
                  <div className="mt-0.5 text-[11px] text-grey-500">
                    {u.email} · {docs.length} document{docs.length === 1 ? '' : 's'}
                    {docs[0]?.doc_type ? ` · ${docs[0].doc_type}` : ''}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setViewing(u); setNote(u.kyc_note || ''); }}
                    className="rounded-md border border-line px-3 py-1.5 text-[11px] text-grey-200 hover:border-white/40 hover:text-white"
                  >
                    Review documents
                  </button>
                  {u.kyc_status === 'pending' && (
                    <>
                      <button
                        onClick={() => decide(u.id, 'verified')}
                        className="rounded-md border border-gain/40 px-3 py-1.5 text-[11px] text-gain hover:bg-gain/10"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => decide(u.id, 'rejected', 'Your documents could not be verified. Please submit a clearer photo.')}
                        className="rounded-md border border-loss/40 px-3 py-1.5 text-[11px] text-loss hover:bg-loss/10"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="Identity documents"
        subtitle={viewing ? `${viewing.name} · ${viewing.email}` : ''}
        wide
      >
        {viewing && (
          <div className="space-y-4">
            {(kycDocsByUser[viewing.id] || []).length === 0 ? (
              <p className="text-[13px] text-grey-500">No documents submitted.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {kycDocsByUser[viewing.id].map((d) => (
                  <figure key={d.id} className="overflow-hidden rounded-lg border border-line">
                    {isPdf(d.file_url) ? (
                      <a href={d.url} target="_blank" rel="noreferrer" className="grid h-52 place-items-center text-[12px] text-grey-300">
                        Open PDF
                      </a>
                    ) : (
                      <a href={d.url} target="_blank" rel="noreferrer">
                        <img src={d.url} alt={d.side} className="h-52 w-full object-cover" />
                      </a>
                    )}
                    <figcaption className="border-t border-line px-3 py-2 text-[11px] capitalize text-grey-400">
                      {d.side} · {d.doc_type}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}

            <div>
              <p className="stat-label mb-2">Note to user (shown if rejected)</p>
              <input
                className="input py-2.5 text-[13px]"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Reason for rejection"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => decide(viewing.id, 'rejected', 'Your documents could not be verified.')}
                disabled={busy}
                className="btn-sm flex-1 rounded-lg border border-loss/40 py-2.5 text-[11px] font-semibold uppercase tracking-wider2 text-loss hover:bg-loss/10"
              >
                Reject
              </button>
              <button
                onClick={() => decide(viewing.id, 'verified')}
                disabled={busy}
                className="btn-solid btn-sm flex-1"
              >
                Approve & verify
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
