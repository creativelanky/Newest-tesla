'use client';

// Client-side market simulation. A single module-level engine ticks a set of
// SpaceX-related instruments on a random walk, keeps rolling price history for
// charts/sparklines, and notifies React subscribers. Nothing here is real — it
// is a deterministic-ish toy market so the terminal feels live.
import { useEffect, useState } from 'react';

export const INSTRUMENTS = [
  { symbol: 'SPX', name: 'SpaceX Holdings', kind: 'Equity · Pre-IPO', base: 412.6, vol: 0.0016, primary: true },
  { symbol: 'STRLNK', name: 'Starlink', kind: 'Tracking stock', base: 208.9, vol: 0.0019 },
  { symbol: 'STRSHP', name: 'Starship Program', kind: 'Growth unit', base: 486.2, vol: 0.0032 },
  { symbol: 'FLCN', name: 'Falcon Launch Svcs', kind: 'Cash-flow unit', base: 146.4, vol: 0.0011 },
  { symbol: 'DRGN', name: 'Dragon Spaceflight', kind: 'Contract unit', base: 165.1, vol: 0.0013 },
  { symbol: 'RPTR', name: 'Raptor Propulsion', kind: 'Industrial unit', base: 121.7, vol: 0.0021 },
  { symbol: 'MARS', name: 'Mars Colonization', kind: 'Frontier venture', base: 61.3, vol: 0.0052 },
  { symbol: 'BTC', name: 'Bitcoin', kind: 'Funding rail', base: 68240, vol: 0.0024 },
];

const PRIMARY = 'SPX';
const HISTORY = 90; // points retained per symbol
const TICK_MS = 1100;

let engine = null;

function createEngine() {
  const quotes = {};
  const now = Date.now();

  for (const it of INSTRUMENTS) {
    // Seed a plausible intraday history with a gentle upward bias.
    const hist = [];
    let p = it.base * (0.972 + Math.random() * 0.01);
    for (let i = 0; i < HISTORY; i++) {
      p = p * (1 + (Math.random() - 0.47) * it.vol * 3.2);
      hist.push(p);
    }
    const open = hist[0];
    const price = hist[hist.length - 1];
    quotes[it.symbol] = {
      symbol: it.symbol,
      name: it.name,
      kind: it.kind,
      primary: !!it.primary,
      vol: it.vol,
      open,
      price,
      prevPrice: price,
      dayHigh: Math.max(...hist),
      dayLow: Math.min(...hist),
      history: hist,
      ts: now,
    };
  }

  const subscribers = new Set();
  let timer = null;
  let version = 0;

  function tick() {
    version++;
    for (const it of INSTRUMENTS) {
      const q = quotes[it.symbol];
      const drift = it.primary ? 0.00025 : 0.0001; // slight upward lean
      const shock = (Math.random() - 0.5) * it.vol * 4.4;
      const next = Math.max(0.01, q.price * (1 + drift + shock));
      q.prevPrice = q.price;
      q.price = next;
      q.dayHigh = Math.max(q.dayHigh, next);
      q.dayLow = Math.min(q.dayLow, next);
      q.history = [...q.history.slice(-(HISTORY - 1)), next];
      q.ts = Date.now();
    }
    subscribers.forEach((fn) => fn(version));
  }

  return {
    quotes,
    subscribe(fn) {
      subscribers.add(fn);
      if (!timer) timer = setInterval(tick, TICK_MS);
      return () => {
        subscribers.delete(fn);
        if (subscribers.size === 0 && timer) {
          clearInterval(timer);
          timer = null;
        }
      };
    },
    get version() {
      return version;
    },
  };
}

function getEngine() {
  if (!engine && typeof window !== 'undefined') engine = createEngine();
  return engine;
}

// ---- Derived helpers ---------------------------------------------------------

export function quoteStats(q) {
  if (!q) return { changeAbs: 0, changePct: 0, up: true };
  const changeAbs = q.price - q.open;
  const changePct = (changeAbs / q.open) * 100;
  return { changeAbs, changePct, up: changeAbs >= 0 };
}

export function primarySymbol() {
  return PRIMARY;
}

// Fictional share count → implied valuation headline.
const SHARE_COUNT = 850_000_000;
export function impliedValuation(price) {
  return (price * SHARE_COUNT) / 1e9; // USD billions
}

// ---- Hooks -------------------------------------------------------------------

// Subscribe to the whole market. Returns the live quotes map once mounted.
// Gated on `mounted` so the first client render matches the server (empty),
// avoiding a hydration mismatch — the engine only spins up after mount.
export function useMarket() {
  const [, setV] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const e = getEngine();
    if (!e) return;
    setMounted(true);
    return e.subscribe((v) => setV(v));
  }, []);

  const eng = mounted ? getEngine() : null;
  return { quotes: eng ? eng.quotes : {}, ready: !!eng };
}

export function useQuote(symbol) {
  const { quotes } = useMarket();
  return quotes[symbol] || null;
}

export function fmtPrice(n, dp = 2) {
  return Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

export function fmtSigned(n, dp = 2) {
  const s = n >= 0 ? '+' : '';
  return s + fmtPrice(n, dp);
}
