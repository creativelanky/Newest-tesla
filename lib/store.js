'use client';

// Client-side datastore. A single localStorage document holds every user record,
// the funding requests queue, KYC submissions, support threads and platform
// settings, so the admin console can operate on all of them.
import { useEffect, useState, useCallback } from 'react';
import { getOpportunity } from './opportunities';
import { supabaseBrowser } from './supabase/client';

const KEY = 'sxi.db.v3';
const EVENT = 'sxi:change';

export const DEFAULT_SETTINGS = {
  btcAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  btcNetwork: 'Bitcoin (BTC) · Native SegWit',
  paypalEmail: 'payments@spacexinvest.co',
  bankName: 'First Meridian Bank',
  bankAccountName: 'SpaceX Invest Holdings LLC',
  bankAccountNumber: '000123456789',
  bankRouting: '021000021',
  bankSwift: 'FMBKUS33',
  minDeposit: 100,
  adminPass: 'spacex-admin',
  supportName: 'Support',
};

const DEFAULT_DB = {
  users: {},
  sessionUserId: null,
  requests: [], // funding queue
  settings: { ...DEFAULT_SETTINGS },
};

function blankUser({ id, name, email, phone, country, city }) {
  return {
    id,
    name,
    email,
    // Passwords are handled entirely by Supabase Auth now — never stored here.
    phone: phone || '',
    country: country || '',
    city: city || '',
    createdAt: Date.now(),
    role: 'user',
    status: 'active', // active | suspended
    kycStatus: 'none', // none | pending | verified | rejected
    kycDocs: [],
    kycNote: '',
    balance: 0,
    profit: 0, // admin-adjustable realised profit component
    holdings: {},
    positions: [],
    options: [],
    copies: {},
    ipo: { reserved: 0 },
    transactions: [],
    messages: [],
    unreadForUser: 0,
    unreadForAdmin: 0,
  };
}

function read() {
  if (typeof window === 'undefined') return DEFAULT_DB;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_DB;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_DB,
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
    };
  } catch {
    return DEFAULT_DB;
  }
}

function write(next) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch (e) {
    // Most likely the quota was hit by uploaded images.
    console.error('Could not save — storage is full.', e);
    throw new Error('Storage is full. Remove some uploaded documents and try again.');
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function getDB() {
  return read();
}

export function saveDB(next) {
  write(next);
}

function currentUser(db) {
  return db.sessionUserId ? db.users[db.sessionUserId] || null : null;
}

function withUser(db, userId, updater) {
  const u = db.users[userId];
  if (!u) return db;
  return { ...db, users: { ...db.users, [userId]: updater(u) } };
}

function pushTx(user, tx) {
  return {
    ...user,
    transactions: [{ id: uid(), ts: Date.now(), ...tx }, ...user.transactions].slice(0, 200),
  };
}

// ---- Auth ----------------------------------------------------------------
// Real authentication — Supabase Auth (hashed passwords, real sessions,
// works across browser restarts via cookies). `sessionUserId` in the local
// business-data blob stays in sync with the Supabase session so every
// existing business function below (mutateCurrent, currentUser, …) keeps
// working unchanged while that data itself is migrated to Postgres.

// Ensures a local business-data row exists for a real Supabase auth user,
// and points the local session at it. Called on sign-up, sign-in, and on
// every auth-state change (tab restore, token refresh).
function ensureLocalUser(supabaseUser) {
  const db = read();
  const id = supabaseUser.id;
  const meta = supabaseUser.user_metadata || {};
  let users = db.users;
  if (!users[id]) {
    users = {
      ...users,
      [id]: blankUser({
        id,
        name: meta.name || supabaseUser.email,
        email: supabaseUser.email,
        phone: meta.phone,
        country: meta.country,
        city: meta.city,
      }),
    };
  }
  write({ ...db, users, sessionUserId: id });
}

function clearLocalSession() {
  const db = read();
  if (db.sessionUserId !== null) write({ ...db, sessionUserId: null });
}

export async function signUp({ name, email, password, phone, country, city }) {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, phone, country, city } },
  });
  if (error) return { ok: false, error: error.message };

  // Projects with "Confirm email" on don't issue a session until the user
  // clicks the link in their inbox.
  if (data.user && !data.session) {
    return { ok: true, needsEmailConfirm: true };
  }
  if (data.user) ensureLocalUser(data.user);
  return { ok: true };
}

export async function logIn({ email, password }) {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };

  // Block suspended accounts — sign them straight back out.
  const { data: profile } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', data.user.id)
    .single();
  if (profile?.status === 'suspended') {
    await supabase.auth.signOut();
    return { ok: false, error: 'This account has been suspended. Please contact support.' };
  }

  if (data.user) ensureLocalUser(data.user);
  return { ok: true };
}

export async function logOut() {
  const supabase = supabaseBrowser();
  await supabase.auth.signOut();
  clearLocalSession();
}

// ---- Funding requests (deposit / withdrawal) ---------------------------------

export function createDeposit({ method, amount, receipt, reference }) {
  const amt = Math.round(Number(amount) * 100) / 100;
  const db = read();
  const user = currentUser(db);
  if (!user) return { ok: false, error: 'You must be signed in.' };
  if (!(amt > 0)) return { ok: false, error: 'Enter an amount greater than $0.' };
  if (amt < db.settings.minDeposit) {
    return { ok: false, error: `Minimum deposit is $${db.settings.minDeposit}.` };
  }

  const req = {
    id: uid(),
    userId: user.id,
    kind: 'deposit',
    method,
    amount: amt,
    reference: reference || '',
    receipt: receipt || null, // { name, dataUrl }
    status: 'pending',
    ts: Date.now(),
    decidedTs: null,
    note: '',
  };
  write({ ...db, requests: [req, ...db.requests] });
  return { ok: true, id: req.id };
}

export function createWithdrawal({ method, amount, destination }) {
  const amt = Math.round(Number(amount) * 100) / 100;
  const db = read();
  const user = currentUser(db);
  if (!user) return { ok: false, error: 'You must be signed in.' };
  if (!(amt > 0)) return { ok: false, error: 'Enter an amount greater than $0.' };
  if (amt > user.balance) return { ok: false, error: 'Amount exceeds your available balance.' };
  if (user.kycStatus !== 'verified') {
    return { ok: false, error: 'Identity verification is required before withdrawing.' };
  }

  // Funds are held while the request is reviewed.
  let next = withUser(db, user.id, (u) =>
    pushTx({ ...u, balance: u.balance - amt }, {
      type: 'debit',
      label: `Withdrawal requested · ${methodLabel(method)}`,
      amount: amt,
    })
  );
  const req = {
    id: uid(),
    userId: user.id,
    kind: 'withdrawal',
    method,
    amount: amt,
    destination: destination || {},
    receipt: null,
    status: 'pending',
    ts: Date.now(),
    decidedTs: null,
    note: '',
  };
  next = { ...next, requests: [req, ...next.requests] };
  write(next);
  return { ok: true, id: req.id };
}

export function methodLabel(m) {
  return { bitcoin: 'Bitcoin', paypal: 'PayPal', bank: 'Bank transfer' }[m] || m;
}

// ---- Admin: request decisions ------------------------------------------------

export function approveRequest(id, note = '') {
  const db = read();
  const req = db.requests.find((r) => r.id === id);
  if (!req || req.status !== 'pending') return { ok: false, error: 'Request is not pending.' };

  let next = db;
  if (req.kind === 'deposit') {
    next = withUser(next, req.userId, (u) =>
      pushTx({ ...u, balance: u.balance + req.amount }, {
        type: 'credit',
        label: `Deposit approved · ${methodLabel(req.method)}`,
        amount: req.amount,
      })
    );
  } else {
    // Withdrawal funds were already held on request; just log completion.
    next = withUser(next, req.userId, (u) =>
      pushTx(u, {
        type: 'debit',
        label: `Withdrawal completed · ${methodLabel(req.method)}`,
        amount: 0,
      })
    );
  }
  next = {
    ...next,
    requests: next.requests.map((r) =>
      r.id === id ? { ...r, status: 'approved', decidedTs: Date.now(), note } : r
    ),
  };
  write(next);
  return { ok: true };
}

export function rejectRequest(id, note = '') {
  const db = read();
  const req = db.requests.find((r) => r.id === id);
  if (!req || req.status !== 'pending') return { ok: false, error: 'Request is not pending.' };

  let next = db;
  if (req.kind === 'withdrawal') {
    // Return the held funds.
    next = withUser(next, req.userId, (u) =>
      pushTx({ ...u, balance: u.balance + req.amount }, {
        type: 'credit',
        label: 'Withdrawal declined · funds returned',
        amount: req.amount,
      })
    );
  }
  next = {
    ...next,
    requests: next.requests.map((r) =>
      r.id === id ? { ...r, status: 'rejected', decidedTs: Date.now(), note } : r
    ),
  };
  write(next);
  return { ok: true };
}

// ---- KYC ---------------------------------------------------------------------

export function submitKyc(docs) {
  const db = read();
  const user = currentUser(db);
  if (!user) return { ok: false, error: 'You must be signed in.' };
  if (!docs || docs.length === 0) return { ok: false, error: 'Attach at least one document.' };
  const next = withUser(db, user.id, (u) => ({
    ...u,
    kycStatus: 'pending',
    kycDocs: [...docs.map((d) => ({ id: uid(), ts: Date.now(), ...d }))],
    kycNote: '',
  }));
  write(next);
  return { ok: true };
}

export function decideKyc(userId, status, note = '') {
  const db = read();
  write(withUser(db, userId, (u) => ({ ...u, kycStatus: status, kycNote: note })));
  return { ok: true };
}

// ---- Admin: balances ---------------------------------------------------------

export function adminSetBalance(userId, amount, label = 'Balance adjusted') {
  const db = read();
  const amt = Math.round(Number(amount) * 100) / 100;
  const u = db.users[userId];
  if (!u) return { ok: false, error: 'User not found.' };
  const delta = amt - u.balance;
  const next = withUser(db, userId, (x) =>
    pushTx({ ...x, balance: amt }, {
      type: delta >= 0 ? 'credit' : 'debit',
      label,
      amount: Math.abs(delta),
    })
  );
  write(next);
  return { ok: true };
}

export function adminAdjustBalance(userId, delta, label) {
  const db = read();
  const d = Math.round(Number(delta) * 100) / 100;
  const u = db.users[userId];
  if (!u) return { ok: false, error: 'User not found.' };
  const next = withUser(db, userId, (x) =>
    pushTx({ ...x, balance: Math.max(0, x.balance + d) }, {
      type: d >= 0 ? 'credit' : 'debit',
      label: label || (d >= 0 ? 'Credit applied' : 'Debit applied'),
      amount: Math.abs(d),
    })
  );
  write(next);
  return { ok: true };
}

export function adminSetProfit(userId, amount) {
  const db = read();
  const next = withUser(db, userId, (u) => ({ ...u, profit: Math.round(Number(amount) * 100) / 100 }));
  write(next);
  return { ok: true };
}

export function adminAddProfit(userId, amount, label = 'Investment profit') {
  const db = read();
  const amt = Math.round(Number(amount) * 100) / 100;
  const next = withUser(db, userId, (u) =>
    pushTx({ ...u, profit: (u.profit || 0) + amt, balance: u.balance + amt }, {
      type: amt >= 0 ? 'credit' : 'debit',
      label,
      amount: Math.abs(amt),
    })
  );
  write(next);
  return { ok: true };
}

export function adminDeleteUser(userId) {
  const db = read();
  const users = { ...db.users };
  delete users[userId];
  write({
    ...db,
    users,
    requests: db.requests.filter((r) => r.userId !== userId),
    sessionUserId: db.sessionUserId === userId ? null : db.sessionUserId,
  });
  return { ok: true };
}

export function adminSetStatus(userId, status) {
  const db = read();
  write(withUser(db, userId, (u) => ({ ...u, status })));
  return { ok: true };
}

export function adminSaveSettings(patch) {
  const db = read();
  write({ ...db, settings: { ...db.settings, ...patch } });
  return { ok: true };
}

// ---- Messaging ---------------------------------------------------------------

export function sendMessage(userId, from, text) {
  const body = String(text || '').trim();
  if (!body) return { ok: false, error: 'Write a message first.' };
  const db = read();
  const next = withUser(db, userId, (u) => ({
    ...u,
    messages: [...(u.messages || []), { id: uid(), from, text: body, ts: Date.now() }],
    unreadForUser: from === 'support' ? (u.unreadForUser || 0) + 1 : u.unreadForUser || 0,
    unreadForAdmin: from === 'user' ? (u.unreadForAdmin || 0) + 1 : u.unreadForAdmin || 0,
  }));
  write(next);
  return { ok: true };
}

export function markRead(userId, side) {
  const db = read();
  const next = withUser(db, userId, (u) => ({
    ...u,
    ...(side === 'user' ? { unreadForUser: 0 } : { unreadForAdmin: 0 }),
  }));
  write(next);
  return { ok: true };
}

// ---- Trading (operates on the signed-in user) --------------------------------

function mutateCurrent(fn) {
  const db = read();
  const user = currentUser(db);
  if (!user) return { ok: false, error: 'You must be signed in.' };
  const result = fn(user, db);
  if (result.error) return { ok: false, error: result.error };
  write({ ...db, users: { ...db.users, [user.id]: result.user } });
  return { ok: true };
}

export function invest(opportunityId, amount) {
  const amt = Math.round(Number(amount) * 100) / 100;
  const opp = getOpportunity(opportunityId);
  if (!opp) return { ok: false, error: 'Unknown opportunity.' };
  if (!(amt > 0)) return { ok: false, error: 'Enter an amount greater than $0.' };
  return mutateCurrent((u) => {
    if (amt > u.balance) return { error: 'Not enough available balance.' };
    const prev = u.holdings[opportunityId] || { units: 0, invested: 0 };
    return {
      user: pushTx(
        {
          ...u,
          balance: u.balance - amt,
          holdings: {
            ...u.holdings,
            [opportunityId]: {
              units: prev.units + amt / opp.price,
              invested: prev.invested + amt,
            },
          },
        },
        { type: 'invest', label: `Invested in ${opp.name}`, amount: amt, opportunityId }
      ),
    };
  });
}

export function sellHolding(opportunityId) {
  const opp = getOpportunity(opportunityId);
  return mutateCurrent((u) => {
    const h = u.holdings[opportunityId];
    if (!opp || !h) return { error: 'Nothing to sell.' };
    const value = holdingValue(opp, h);
    const holdings = { ...u.holdings };
    delete holdings[opportunityId];
    return {
      user: pushTx({ ...u, balance: u.balance + value, holdings }, {
        type: 'sell',
        label: `Sold ${opp.name}`,
        amount: value,
        opportunityId,
      }),
    };
  });
}

export function openPosition({ symbol, dir, margin, leverage, entry }) {
  const m = Math.round(Number(margin) * 100) / 100;
  if (!(m > 0)) return { ok: false, error: 'Enter a margin amount greater than $0.' };
  if (!['long', 'short'].includes(dir)) return { ok: false, error: 'Invalid direction.' };
  return mutateCurrent((u) => {
    if (m > u.balance) return { error: 'Margin exceeds available balance.' };
    const pos = {
      id: uid(),
      symbol,
      dir,
      margin: m,
      leverage: Number(leverage) || 1,
      entry: Number(entry),
      ts: Date.now(),
    };
    return {
      user: pushTx({ ...u, balance: u.balance - m, positions: [pos, ...u.positions] }, {
        type: 'debit',
        label: `Open ${dir.toUpperCase()} ${symbol} ${pos.leverage}×`,
        amount: m,
      }),
    };
  });
}

export function closePosition(id, exitPrice) {
  return mutateCurrent((u) => {
    const pos = u.positions.find((p) => p.id === id);
    if (!pos) return { error: 'Position not found.' };
    const equity = positionEquity(pos, exitPrice);
    const pnl = equity - pos.margin;
    return {
      user: pushTx(
        { ...u, balance: u.balance + equity, positions: u.positions.filter((p) => p.id !== id) },
        {
          type: pnl >= 0 ? 'credit' : 'debit',
          label: `Close ${pos.dir.toUpperCase()} ${pos.symbol} · ${pnl >= 0 ? 'profit' : 'loss'}`,
          amount: Math.abs(equity),
        }
      ),
    };
  });
}

export function positionUnits(pos) {
  return (pos.margin * pos.leverage) / pos.entry;
}
export function positionPnL(pos, price) {
  const raw = (price - pos.entry) * positionUnits(pos);
  return pos.dir === 'long' ? raw : -raw;
}
export function positionEquity(pos, price) {
  return Math.max(0, pos.margin + positionPnL(pos, price));
}
export function liquidationPrice(pos) {
  const move = pos.entry / pos.leverage;
  return pos.dir === 'long' ? pos.entry - move : pos.entry + move;
}

export function buyOption({ kind, strike, expiry, contracts, premium }) {
  const n = Math.max(1, Math.floor(Number(contracts) || 1));
  const cost = Math.round(premium * 100 * n * 100) / 100;
  return mutateCurrent((u) => {
    if (cost > u.balance) return { error: 'Premium exceeds available balance.' };
    const opt = { id: uid(), kind, strike, expiry, contracts: n, entryPremium: premium, ts: Date.now() };
    return {
      user: pushTx({ ...u, balance: u.balance - cost, options: [opt, ...u.options] }, {
        type: 'debit',
        label: `Buy ${n} SPX ${strike} ${kind.toUpperCase()}`,
        amount: cost,
      }),
    };
  });
}

export function closeOption(id, currentPremium) {
  return mutateCurrent((u) => {
    const opt = u.options.find((o) => o.id === id);
    if (!opt) return { error: 'Contract not found.' };
    const proceeds = Math.round(currentPremium * 100 * opt.contracts * 100) / 100;
    return {
      user: pushTx({ ...u, balance: u.balance + proceeds, options: u.options.filter((o) => o.id !== id) }, {
        type: 'credit',
        label: `Close ${opt.contracts} SPX ${opt.strike} ${opt.kind.toUpperCase()}`,
        amount: proceeds,
      }),
    };
  });
}

export function allocateCopy(traderId, amount) {
  const amt = Math.round(Number(amount) * 100) / 100;
  if (!(amt > 0)) return { ok: false, error: 'Enter an amount greater than $0.' };
  return mutateCurrent((u) => {
    if (amt > u.balance) return { error: 'Amount exceeds available balance.' };
    return {
      user: pushTx(
        { ...u, balance: u.balance - amt, copies: { ...u.copies, [traderId]: (u.copies[traderId] || 0) + amt } },
        { type: 'debit', label: `Copy allocation · ${traderId}`, amount: amt }
      ),
    };
  });
}

export function stopCopy(traderId, currentValue) {
  return mutateCurrent((u) => {
    if (!u.copies[traderId]) return { error: 'No allocation.' };
    const copies = { ...u.copies };
    delete copies[traderId];
    return {
      user: pushTx({ ...u, balance: u.balance + currentValue, copies }, {
        type: 'credit',
        label: `Stop copy · ${traderId}`,
        amount: currentValue,
      }),
    };
  });
}

export function reserveIPO(amount) {
  const amt = Math.round(Number(amount) * 100) / 100;
  if (!(amt > 0)) return { ok: false, error: 'Enter an amount greater than $0.' };
  return mutateCurrent((u) => {
    if (amt > u.balance) return { error: 'Amount exceeds available balance.' };
    return {
      user: pushTx({ ...u, balance: u.balance - amt, ipo: { reserved: (u.ipo?.reserved || 0) + amt } }, {
        type: 'debit',
        label: 'IPO allocation reserved',
        amount: amt,
      }),
    };
  });
}

export function cancelIPO() {
  return mutateCurrent((u) => {
    const reserved = u.ipo?.reserved || 0;
    if (reserved <= 0) return { error: 'Nothing reserved.' };
    return {
      user: pushTx({ ...u, balance: u.balance + reserved, ipo: { reserved: 0 } }, {
        type: 'credit',
        label: 'IPO reservation released',
        amount: reserved,
      }),
    };
  });
}

// ---- Derived helpers ---------------------------------------------------------

export function holdingValue(opp, holding) {
  const drift = 1 + (opp.projected / 100) * 0.18;
  return Math.round(holding.invested * drift * 100) / 100;
}

export function portfolioValue(state) {
  return Object.entries(state.holdings || {}).reduce((sum, [id, h]) => {
    const opp = getOpportunity(id);
    return opp ? sum + holdingValue(opp, h) : sum;
  }, 0);
}

export function investedTotal(state) {
  return Object.values(state.holdings || {}).reduce((s, h) => s + h.invested, 0);
}

// Net money funded in (approved deposits − withdrawals), used for profit maths.
export function netFunded(state) {
  let net = 0;
  for (const tx of state.transactions || []) {
    if (tx.type === 'credit' && /Deposit approved|Welcome|Credit applied|Balance adjusted/i.test(tx.label)) net += tx.amount;
    if (tx.type === 'debit' && /Withdrawal requested/i.test(tx.label)) net -= tx.amount;
  }
  return net;
}

export function userRequests(db, userId) {
  return db.requests.filter((r) => r.userId === userId);
}

// ---- React hooks -------------------------------------------------------------

// The signed-in user's record, shaped like the old single-user state so the
// existing desk components keep working unchanged.
export function useStore() {
  const [db, setDb] = useState(DEFAULT_DB);
  const [dbReady, setDbReady] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  const sync = useCallback(() => setDb(read()), []);

  // Local business-data blob (still localStorage — tasks 13/14 move this to
  // Postgres). Kept in sync with itself across tabs as before.
  useEffect(() => {
    sync();
    setDbReady(true);
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [sync]);

  // Real auth state — Supabase is the source of truth for "who is signed
  // in"; ensureLocalUser mirrors that into sessionUserId so the business
  // logic below (unchanged) keeps working.
  useEffect(() => {
    const supabase = supabaseBrowser();
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session?.user) ensureLocalUser(data.session.user);
      else clearLocalSession();
      setAuthReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) ensureLocalUser(session.user);
      else clearLocalSession();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const ready = dbReady && authReady;
  const user = db.sessionUserId ? db.users[db.sessionUserId] : null;
  const state = user
    ? { ...user, user: { name: user.name, email: user.email } }
    : { user: null, balance: 0, holdings: {}, positions: [], options: [], copies: {}, ipo: { reserved: 0 }, transactions: [], messages: [] };

  return { state, db, ready, settings: db.settings, requests: db.requests };
}

// Whole-database hook for the admin console.
export function useDB() {
  const [db, setDb] = useState(DEFAULT_DB);
  const [ready, setReady] = useState(false);
  const sync = useCallback(() => setDb(read()), []);

  useEffect(() => {
    sync();
    setReady(true);
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [sync]);

  return { db, ready };
}

export function formatUSD(n, opts = {}) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: opts.cents ? 2 : 0,
    minimumFractionDigits: opts.cents ? 2 : 0,
  }).format(Number.isFinite(n) ? n : 0);
}
