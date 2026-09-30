'use client';

import { useEffect, useState } from 'react';
import { IconPackage } from '@/components/DeskIcons';

const STATUSES = [
  ['processing', 'Processing'],
  ['dispatched', 'Dispatched'],
  ['in_transit', 'In transit'],
  ['out_for_delivery', 'Out for delivery'],
  ['delivered', 'Delivered'],
  ['on_hold', 'On hold'],
  ['cancelled', 'Cancelled'],
];

const LABELS = Object.fromEntries(STATUSES);

const initialForm = {
  profileId: '',
  title: 'Investment parcel',
  origin: '',
  destination: '',
  carrier: '',
  status: 'processing',
  currentLocation: '',
  estimatedDelivery: '',
  note: '',
};

function statusClass(status) {
  if (status === 'delivered') return 'chip-gain';
  if (status === 'on_hold' || status === 'cancelled') return 'chip-loss';
  return 'chip-warn';
}

export default function AdminParcels({ users }) {
  const [parcels, setParcels] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [updates, setUpdates] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/parcels');
    const body = await res.json().catch(() => ({}));
    if (res.ok) setParcels(body.data || []);
    else setError(body.error || 'Unable to load parcel tracking.');
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function createParcel(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    const res = await fetch('/api/admin/parcels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) setError(body.error || 'Unable to create tracking code.');
    else {
      setMessage(`Generated ${body.data.tracking_code}`);
      setForm(initialForm);
      await load();
    }
    setSaving(false);
  }

  async function saveParcel(parcel) {
    const update = updates[parcel.id] || {
      status: parcel.status,
      currentLocation: parcel.current_location || '',
      estimatedDelivery: parcel.estimated_delivery || '',
      note: parcel.note || '',
    };
    setSaving(true);
    setError('');
    setMessage('');
    const res = await fetch(`/api/admin/parcels/${parcel.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) setError(body.error || 'Unable to update parcel.');
    else {
      setMessage(`Updated ${body.data.tracking_code}`);
      await load();
    }
    setSaving(false);
  }

  function patchUpdate(parcel, key, value) {
    setUpdates((all) => ({
      ...all,
      [parcel.id]: {
        status: all[parcel.id]?.status || parcel.status,
        currentLocation: all[parcel.id]?.currentLocation || parcel.current_location || '',
        estimatedDelivery: all[parcel.id]?.estimatedDelivery || parcel.estimated_delivery || '',
        note: all[parcel.id]?.note || parcel.note || '',
        [key]: value,
      },
    }));
  }

  return (
    <div className="space-y-6">
      {(message || error) && (
        <div className={`rounded-md border px-4 py-3 text-[13px] ${error ? 'border-loss/30 text-loss' : 'border-gain/30 text-gain'}`}>
          {error || message}
        </div>
      )}

      <form onSubmit={createParcel} className="tile p-5">
        <h3 className="tile-title flex items-center gap-2.5"><span className="icon-chip"><IconPackage className="h-3.5 w-3.5" /></span>Create tracking code</h3>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <label>
            <span className="stat-label">User</span>
            <select required value={form.profileId} onChange={(e) => setField('profileId', e.target.value)} className="mt-1.5 min-h-10 w-full rounded-md border border-line bg-ink px-3 text-[13px] text-white">
              <option value="">Select user</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
            </select>
          </label>
          <Input label="Title" value={form.title} onChange={(v) => setField('title', v)} />
          <Input label="Carrier" value={form.carrier} onChange={(v) => setField('carrier', v)} />
          <Input label="Origin" value={form.origin} onChange={(v) => setField('origin', v)} />
          <Input label="Destination" value={form.destination} onChange={(v) => setField('destination', v)} />
          <Input label="Current location" value={form.currentLocation} onChange={(v) => setField('currentLocation', v)} />
          <label>
            <span className="stat-label">Status</span>
            <select value={form.status} onChange={(e) => setField('status', e.target.value)} className="mt-1.5 min-h-10 w-full rounded-md border border-line bg-ink px-3 text-[13px] text-white">
              {STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <Input label="Estimated delivery" type="date" value={form.estimatedDelivery} onChange={(v) => setField('estimatedDelivery', v)} />
          <Input label="Note" value={form.note} onChange={(v) => setField('note', v)} />
        </div>
        <button disabled={saving} className="btn-solid mt-5 min-h-10 px-5" type="submit">Generate tracking code</button>
      </form>

      <div className="tile overflow-hidden">
        <div className="tile-head">
          <h3 className="tile-title">Parcel records</h3>
          <span className="stat-label">{parcels.length} total</span>
        </div>
        {loading ? (
          <p className="p-8 text-center text-[13px] text-grey-500">Loading parcels…</p>
        ) : parcels.length === 0 ? (
          <p className="p-8 text-center text-[13px] text-grey-500">No parcels yet.</p>
        ) : (
          <div className="divide-y divide-line">
            {parcels.map((parcel) => {
              const update = updates[parcel.id] || {
                status: parcel.status,
                currentLocation: parcel.current_location || '',
                estimatedDelivery: parcel.estimated_delivery || '',
                note: parcel.note || '',
              };
              return (
                <div key={parcel.id} className="p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[14px] font-medium text-white">{parcel.title}</span>
                        <span className={`pill ${statusClass(parcel.status)}`}>{LABELS[parcel.status]}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-grey-500">{parcel.profiles?.name || parcel.profiles?.email || 'Unknown user'}</p>
                      <code className="mt-2 inline-block rounded border border-line bg-ink px-2 py-1 text-[12px] text-grey-200">{parcel.tracking_code}</code>
                      <p className="mt-2 text-[12px] text-grey-500">{parcel.origin || 'Origin pending'} → {parcel.destination || 'Destination pending'}</p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[150px_170px_150px_200px_auto]">
                      <select value={update.status} onChange={(e) => patchUpdate(parcel, 'status', e.target.value)} className="min-h-10 rounded-md border border-line bg-ink px-3 text-[12px] text-white">
                        {STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                      <input value={update.currentLocation} onChange={(e) => patchUpdate(parcel, 'currentLocation', e.target.value)} placeholder="Location" className="min-h-10 rounded-md border border-line bg-ink px-3 text-[12px] text-white placeholder:text-grey-600" />
                      <input type="date" value={update.estimatedDelivery || ''} onChange={(e) => patchUpdate(parcel, 'estimatedDelivery', e.target.value)} className="min-h-10 rounded-md border border-line bg-ink px-3 text-[12px] text-white" />
                      <input value={update.note} onChange={(e) => patchUpdate(parcel, 'note', e.target.value)} placeholder="Update note" className="min-h-10 rounded-md border border-line bg-ink px-3 text-[12px] text-white placeholder:text-grey-600" />
                      <button disabled={saving} onClick={() => saveParcel(parcel)} className="btn-outline min-h-10 px-4">Save</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }) {
  return (
    <label>
      <span className="stat-label">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 min-h-10 w-full rounded-md border border-line bg-ink px-3 text-[13px] text-white placeholder:text-grey-600" />
    </label>
  );
}
