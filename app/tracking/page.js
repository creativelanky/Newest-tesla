'use client';

import { useEffect, useMemo, useState } from 'react';
import DeskPage from '@/components/DeskPage';
import { IconPackage } from '@/components/DeskIcons';

const LABELS = {
  processing: 'Processing',
  dispatched: 'Dispatched',
  in_transit: 'In transit',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  on_hold: 'On hold',
  cancelled: 'Cancelled',
};

const STEPS = ['processing', 'dispatched', 'in_transit', 'out_for_delivery', 'delivered'];

function statusClass(status) {
  if (status === 'delivered') return 'chip-gain';
  if (status === 'on_hold' || status === 'cancelled') return 'chip-loss';
  return 'chip-warn';
}

function progressFor(status) {
  if (status === 'cancelled') return 0;
  if (status === 'on_hold') return 50;
  const index = Math.max(0, STEPS.indexOf(status));
  return Math.round((index / (STEPS.length - 1)) * 100);
}

function formatDate(value) {
  if (!value) return 'Pending';
  return new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function shortDate(value) {
  if (!value) return 'Pending';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TrackingPage() {
  return (
    <DeskPage eyebrow="Logistics desk" title="Parcel Tracking" intro="Track assigned delivery codes, shipment status, route details, and delivery progress from your account.">
      <TrackingDesk />
    </DeskPage>
  );
}

function TrackingDesk() {
  const [parcels, setParcels] = useState([]);
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(code = '') {
    setLoading(true);
    setError('');
    const res = await fetch(code ? `/api/parcels?code=${encodeURIComponent(code)}` : '/api/parcels');
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setParcels([]);
      setError(body.error || 'Unable to load tracking details.');
    } else {
      setParcels(body.data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const selected = useMemo(() => parcels[0], [parcels]);

  function submit(e) {
    e.preventDefault();
    const code = query.trim();
    setSearched(code);
    load(code);
  }

  return (
    <div className="space-y-7">
      <form onSubmit={submit} className="tile-feature overflow-hidden rounded-2xl border border-white/10 bg-card2">
        <div className="relative p-5 sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(620px_260px_at_18%_0%,rgba(79,139,255,0.22),transparent_62%),radial-gradient(520px_220px_at_92%_12%,rgba(37,214,230,0.16),transparent_58%)]" />
          <div className="relative grid gap-5 lg:grid-cols-[1fr_420px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-wider2 text-grey-300">
                <span className="live-dot" />
                Secure shipment lookup
              </div>
              <h2 className="mt-4 text-[clamp(1.5rem,3vw,2.35rem)] font-semibold leading-tight text-white">Locate your parcel in real time.</h2>
              <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-grey-400">
                Enter a tracking code or view the latest parcel assigned to your investment account.
              </p>
            </div>

            <div>
              <label className="stat-label">Tracking code</label>
              <div className="mt-2 flex overflow-hidden rounded-xl border border-white/10 bg-black/35 shadow-2xl shadow-black/25 focus-within:border-white/30">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="SPX-2026-XXXXXXXX"
                  className="min-h-12 flex-1 bg-transparent px-4 text-[13px] font-medium text-white placeholder:text-grey-600 focus:outline-none"
                />
                <button className="inline-flex min-h-12 items-center justify-center gap-2 bg-white px-4 text-[12px] font-semibold uppercase tracking-wider2 text-black transition-colors hover:bg-grey-300 sm:px-5">
                  <IconPackage className="h-4 w-4" />
                  Track
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {loading ? (
        <div className="tile p-12 text-center text-[13px] text-grey-400">Loading tracking details…</div>
      ) : error ? (
        <div className="tile border-loss/30 p-5 text-[13px] text-loss">{error}</div>
      ) : !selected ? (
        <div className="tile p-12 text-center">
          <IconPackage className="mx-auto h-8 w-8 text-grey-500" />
          <p className="mt-3 text-[14px] font-medium text-white">{searched ? 'No parcel found for that code.' : 'No parcels assigned yet.'}</p>
          <p className="mt-1 text-[12px] text-grey-500">Admin-generated tracking codes will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="tile-feature overflow-hidden rounded-2xl border border-white/10 bg-card2">
            <div className="relative p-5 sm:p-6">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(79,139,255,0.12),transparent_36%),radial-gradient(480px_260px_at_85%_0%,rgba(162,116,255,0.16),transparent_62%)]" />
              <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`pill ${statusClass(selected.status)}`}>{LABELS[selected.status]}</span>
                    <span className="pill border-white/10 bg-white/[0.03] text-grey-300">{selected.carrier || 'Internal logistics'}</span>
                  </div>
                  <h2 className="mt-4 text-[clamp(1.5rem,3vw,2.2rem)] font-semibold leading-tight text-white">{selected.title}</h2>
                  <p className="mono mt-2 text-[13px] text-grey-400">{selected.tracking_code}</p>
                </div>
                <div className="grid min-w-[220px] gap-1 rounded-xl border border-white/10 bg-black/25 p-4">
                  <span className="stat-label">Estimated delivery</span>
                  <span className="text-[22px] font-semibold text-white">{shortDate(selected.estimated_delivery)}</span>
                </div>
              </div>

              <ProgressBar status={selected.status} />
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <section className="tile overflow-hidden">
              <div className="tile-head">
                <h3 className="tile-title">Tracking Details</h3>
                <span className="stat-label">{(selected.history || []).length} update{(selected.history || []).length === 1 ? '' : 's'}</span>
              </div>
              <div className="p-5 sm:p-6">
                <div className="relative space-y-0">
                  {(selected.history || []).slice().reverse().map((event, i, arr) => (
                    <TimelineEvent key={`${event.created_at}-${i}`} event={event} isLatest={i === 0} isLast={i === arr.length - 1} />
                  ))}
                </div>
              </div>
            </section>

            <aside className="space-y-4">
              <div className="tile h-fit overflow-hidden">
                <div className="tile-head">
                  <h3 className="tile-title">Shipment Summary</h3>
                  <IconPackage className="h-4 w-4 text-grey-400" />
                </div>
                <div className="p-5">
                  <Detail label="Current location" value={selected.current_location || 'Pending'} highlight />
                  <Detail label="Origin" value={selected.origin || 'Origin pending'} />
                  <Detail label="Destination" value={selected.destination || 'Destination pending'} />
                  <Detail label="Carrier" value={selected.carrier || 'Internal logistics'} />
                  <Detail label="Estimated delivery" value={shortDate(selected.estimated_delivery)} />
                </div>
              </div>

              {selected.note && (
                <div className="tile border-warn/30 bg-warn/[0.06] p-5">
                  <p className="stat-label text-warn">Latest note</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-grey-300">{selected.note}</p>
                </div>
              )}
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}

function ProgressBar({ status }) {
  const progress = progressFor(status);
  return (
    <div className="relative mt-7">
      <div className="mb-3 flex items-center justify-between">
        <span className="stat-label">Delivery progress</span>
        <span className="mono text-[12px] text-grey-300">{progress}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-black/40 ring-1 ring-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-azure via-cyan to-gain transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {STEPS.map((step) => {
          const active = STEPS.indexOf(step) <= STEPS.indexOf(status) || status === 'delivered';
          return (
            <div key={step} className={`rounded-lg border px-3 py-2 ${active ? 'border-cyan/30 bg-cyan/10 text-white' : 'border-line bg-black/15 text-grey-500'}`}>
              <p className="text-[10px] font-semibold uppercase tracking-wider2">{LABELS[step]}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimelineEvent({ event, isLatest, isLast }) {
  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {!isLast && <div className="absolute left-[17px] top-9 h-[calc(100%-2rem)] w-px bg-line" />}
      <span className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border ${isLatest ? 'border-cyan/40 bg-cyan/15 text-cyan glow-azure' : 'border-line bg-card2 text-grey-300'}`}>
        <IconPackage className="h-4 w-4" />
      </span>
      <div className={`min-w-0 flex-1 rounded-xl border p-4 ${isLatest ? 'border-cyan/25 bg-cyan/[0.06]' : 'border-line bg-white/[0.02]'}`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[14px] font-semibold text-white">{LABELS[event.status] || event.status}</p>
            <p className="mt-1 text-[11px] text-grey-500">{formatDate(event.created_at)}</p>
          </div>
          {isLatest && <span className="pill border-cyan/30 bg-cyan/10 text-cyan">Latest</span>}
        </div>
        {event.location && <p className="mt-3 text-[13px] font-medium text-grey-200">{event.location}</p>}
        {event.note && <p className="mt-1 text-[13px] leading-relaxed text-grey-400">{event.note}</p>}
      </div>
    </div>
  );
}

function Detail({ label, value, highlight = false }) {
  return (
    <div className="border-b border-line py-4 first:pt-0 last:border-b-0 last:pb-0">
      <p className="stat-label">{label}</p>
      <p className={`mt-1 text-[14px] ${highlight ? 'font-semibold text-cyan' : 'text-white'}`}>{value}</p>
    </div>
  );
}
