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
      <form onSubmit={submit} className="tile overflow-hidden rounded-2xl">
        <div className="border-b border-line bg-card2 px-5 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider2 text-grey-300">
              <span className="live-dot" />
              Secure shipment lookup
            </div>
            <span className="hidden text-[11px] uppercase tracking-wider text-grey-600 sm:block">SPX logistics</span>
          </div>
        </div>
        <div className="p-5 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_420px] lg:items-end">
            <div>
              <h2 className="text-[clamp(1.45rem,3vw,2.2rem)] font-semibold leading-tight text-white">Locate your parcel in real time.</h2>
              <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-grey-400">
                Enter a tracking code or view the latest parcel assigned to your investment account.
              </p>
            </div>

            <div>
              <label className="stat-label">Tracking code</label>
              <div className="mt-2 flex overflow-hidden rounded-xl border border-line bg-ink focus-within:border-white/30">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="SPX-2026-XXXXXXXX"
                  className="min-h-12 flex-1 bg-transparent px-4 text-[13px] font-medium text-white placeholder:text-grey-600 focus:outline-none"
                />
                <button className="inline-flex min-h-12 items-center justify-center gap-2 border-l border-line bg-card2 px-4 text-[12px] font-semibold uppercase tracking-wider2 text-white transition-colors hover:bg-white hover:text-black sm:px-5">
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
          <section className="tile overflow-hidden rounded-2xl">
            <div className="border-b border-line bg-card2 px-5 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="stat-label">Active shipment</span>
                <span className="mono text-[11px] text-grey-500">{selected.tracking_code}</span>
              </div>
            </div>
            <div className="p-5 sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`pill ${statusClass(selected.status)}`}>{LABELS[selected.status]}</span>
                    <span className="pill border-white/10 bg-white/[0.03] text-grey-300">{selected.carrier || 'Internal logistics'}</span>
                  </div>
                  <h2 className="mt-4 text-[clamp(1.5rem,3vw,2.2rem)] font-semibold leading-tight text-white">{selected.title}</h2>
                  <p className="mono mt-2 text-[13px] text-grey-400">{selected.tracking_code}</p>
                </div>
                <div className="grid min-w-[220px] gap-1 rounded-xl border border-line bg-ink p-4">
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
        <div className="h-full rounded-full bg-cyan transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {STEPS.map((step) => {
          const active = STEPS.indexOf(step) <= STEPS.indexOf(status) || status === 'delivered';
          return (
            <div key={step} className={`rounded-lg border px-3 py-2 ${active ? 'border-cyan/30 bg-card2 text-white' : 'border-line bg-black/15 text-grey-500'}`}>
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
      <span className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border ${isLatest ? 'border-cyan/40 bg-card2 text-cyan' : 'border-line bg-card2 text-grey-300'}`}>
        <IconPackage className="h-4 w-4" />
      </span>
      <div className={`min-w-0 flex-1 rounded-xl border p-4 ${isLatest ? 'border-cyan/25 bg-card2' : 'border-line bg-white/[0.02]'}`}>
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
