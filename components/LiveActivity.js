'use client';

import { useEffect, useRef, useState } from 'react';

// A simulated live order/trade feed. Purely cosmetic — it invents plausible
// desk activity on a timer to make the platform feel populated.
const NAMES = ['OrbitalAce', 'Delta-V', 'ApogeeCapital', 'PerigeeQuant', 'IonDrift', 'ManeNode', 'K. Reyes', 'A. Sato', 'L. Nordin', 'BoosterBull'];
const SYMS = ['SPX', 'STRLNK', 'STRSHP', 'FLCN', 'DRGN', 'RPTR', 'MARS'];

function rnd(a) {
  return a[Math.floor(Math.random() * a.length)];
}
function money(min, max) {
  return Math.round((min + Math.random() * (max - min)) / 50) * 50;
}

function make() {
  const kind = Math.random();
  const name = rnd(NAMES);
  const sym = rnd(SYMS);
  if (kind < 0.3) {
    const dir = Math.random() > 0.5 ? 'LONG' : 'SHORT';
    const lev = rnd([2, 3, 5, 10]);
    return { tone: dir === 'LONG' ? 'gain' : 'loss', text: `${name} opened ${dir} ${sym} ${lev}×`, amt: `$${money(2000, 40000).toLocaleString()}` };
  }
  if (kind < 0.5) {
    const pnl = money(400, 12000);
    return { tone: 'gain', text: `${name} closed ${sym} ${rnd([400, 420, 440])} CALL`, amt: `+$${pnl.toLocaleString()}` };
  }
  if (kind < 0.68) {
    return { tone: 'neutral', text: `Bitcoin deposit settled`, amt: `$${money(5000, 60000).toLocaleString()}` };
  }
  if (kind < 0.82) {
    return { tone: 'neutral', text: `${name} started copying ApogeeCapital`, amt: `$${money(1000, 25000).toLocaleString()}` };
  }
  if (kind < 0.93) {
    return { tone: 'neutral', text: `SpaceX IPO allocation reserved`, amt: `$${money(1000, 50000).toLocaleString()}` };
  }
  const dir = Math.random() > 0.5;
  return { tone: dir ? 'gain' : 'loss', text: `${sym} ${dir ? '▲' : '▼'} crossed $${money(120, 500)}`, amt: '' };
}

export default function LiveActivity({ rows = 7 }) {
  const [items, setItems] = useState([]);
  const idRef = useRef(0);

  useEffect(() => {
    // Seed
    const seed = Array.from({ length: rows }, () => ({ id: idRef.current++, ...make() }));
    setItems(seed);
    const t = setInterval(() => {
      setItems((prev) => [{ id: idRef.current++, ...make() }, ...prev].slice(0, rows));
    }, 2200);
    return () => clearInterval(t);
  }, [rows]);

  return (
    <div className="tile overflow-hidden">
      <div className="tile-head">
        <span className="tile-title">Live desk activity</span>
        <span className="flex items-center gap-2 text-[13px] text-grey-400">
          <span className="live-dot" /> Live
        </span>
      </div>
      <ul className="divide-y divide-line">
        {items.map((it, i) => (
          <li
            key={it.id}
            className="flex items-center justify-between gap-3 px-5 py-3"
            style={i === 0 ? { animation: 'fade-up 0.5s ease both' } : undefined}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  it.tone === 'gain' ? 'bg-gain' : it.tone === 'loss' ? 'bg-loss' : 'bg-grey-500'
                }`}
              />
              <span className="truncate text-[15px] text-grey-200">{it.text}</span>
            </div>
            {it.amt && (
              <span className={`num shrink-0 text-[14px] ${it.tone === 'gain' ? 'text-gain' : it.tone === 'loss' ? 'text-loss' : 'text-grey-300'}`}>
                {it.amt}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
