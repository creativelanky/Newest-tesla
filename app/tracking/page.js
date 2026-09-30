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

function statusClass(status) {
  if (status === 'delivered') return 'chip-gain';
  if (status === 'on_hold' || status === 'cancelled') return 'chip-loss';
  return 'chip-warn';
}

function formatDate(value) {
  if (!value) return 'Pending';
  return new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function TrackingPage() {
  return (
    <DeskPage eyebrow="Logistics desk" title="Parcel Tracking" intro="Track assigned delivery codes and shipment progress from your account.">
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
    <div className="space-y-6">
      <form onSubmit={submit} className="tile p-5">
        <label className="stat-label">Tracking code</label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter parcel code"
            className="min-h-11 flex-1 rounded-md border border-line bg-ink px-3 text-[13px] text-white placeholder:text-grey-600 focus:border-white/40 focus:outline-none"
          />
          <button className="btn-solid min-h-11 px-5">
            <IconPackage className="h-4 w-4" />
            Track parcel
          </button>
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
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="tile overflow-hidden">
            <div className="tile-head">
              <div>
                <h2 className="tile-title">{selected.title}</h2>
                <p className="mono mt-1 text-[12px] text-grey-500">{selected.tracking_code}</p>
              </div>
              <span className={`pill ${statusClass(selected.status)}`}>{LABELS[selected.status]}</span>
            </div>
            <div className="space-y-5 p-5">
              {(selected.history || []).slice().reverse().map((event, i) => (
                <div key={`${event.created_at}-${i}`} className="flex gap-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line bg-card2 text-grey-200">
                    <IconPackage className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-[14px] font-medium text-white">{LABELS[event.status] || event.status}</p>
                    <p className="mt-0.5 text-[11px] text-grey-500">{formatDate(event.created_at)}</p>
                    {event.location && <p className="mt-2 text-[12px] text-grey-300">{event.location}</p>}
                    {event.note && <p className="mt-1 text-[13px] text-grey-400">{event.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="tile h-fit p-5">
            <Detail label="Current location" value={selected.current_location || 'Pending'} />
            <Detail label="Route" value={`${selected.origin || 'Origin pending'} → ${selected.destination || 'Destination pending'}`} />
            <Detail label="Carrier" value={selected.carrier || 'Internal logistics'} />
            <Detail label="Estimated delivery" value={selected.estimated_delivery ? new Date(selected.estimated_delivery).toLocaleDateString() : 'Pending'} />
            {selected.note && <p className="mt-5 border-t border-line pt-5 text-[13px] text-grey-400">{selected.note}</p>}
          </aside>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="border-b border-line py-4 first:pt-0 last:border-b-0 last:pb-0">
      <p className="stat-label">{label}</p>
      <p className="mt-1 text-[14px] text-white">{value}</p>
    </div>
  );
}
