'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchNotifications, markNotificationsRead } from '@/lib/api';
import { IconBell } from './DeskIcons';

function ago(ts) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function NotificationBell() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const load = useCallback(async () => {
    const res = await fetchNotifications();
    if (res.ok) {
      setItems(res.data.items);
      setUnread(res.data.unread);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 20000); // poll for new notifications
    return () => clearInterval(t);
  }, [load]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      await markNotificationsRead();
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="relative grid h-9 w-9 place-items-center rounded-md text-grey-300 transition-colors hover:text-white"
      >
        <IconBell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-[15px] min-w-[15px] place-items-center rounded-full bg-warn px-1 text-[9px] font-bold text-black">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-line bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-[12px] font-semibold uppercase tracking-wider2 text-white">Notifications</span>
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-10 text-center text-[12px] text-grey-500">You’re all caught up.</p>
          ) : (
            <div className="max-h-[24rem] divide-y divide-line overflow-y-auto">
              {items.map((n) => (
                <div key={n.id} className="px-4 py-3">
                  <div className="flex items-start gap-2.5">
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.read ? 'bg-grey-600' : 'bg-warn'}`} />
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-white">{n.title}</div>
                      {n.body && <div className="mt-0.5 text-[12px] leading-relaxed text-grey-400">{n.body}</div>}
                      <div className="mt-1 text-[10px] uppercase tracking-wider text-grey-600">{ago(n.created_at)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
