# SpaceX Invest (demo)

A fictional SpaceX-themed investment platform — a design/engineering prototype.
**Not affiliated with, endorsed by, or connected to SpaceX.** No real securities and
no real money change hands.

Account, cash, deposits/withdrawals, KYC and identity are **real**, stored in Supabase
Postgres. The simulated trading desk (live price drift, positions, options, copy trading,
IPO reservation) runs client-side and persists in `localStorage`.

## Stack
- Next.js 14 (App Router, JS) · React 18 · Tailwind CSS 3
- Supabase — Auth, Postgres (with RLS + `SECURITY DEFINER` RPCs), Storage (private buckets)
- Dev server on **port 3217**

## Run locally
```bash
npm install
cp .env.example .env.local   # then fill in your Supabase keys
npm run dev
# http://localhost:3217
```

Requires **Node 22+** (see `.nvmrc`). Node 20 and below are deprecated by `@supabase/supabase-js`.

## Environment variables
See `.env.example`. Three are required by the running app:

| Variable | Exposure | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Browser client (RLS-enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Admin client + API routes; bypasses RLS |

`ADMIN_EMAIL` / `ADMIN_PASSWORD` are only used by `scripts/seed-admin.mjs`, not the app.

## What's here
- **Landing** (`/`) — animated rocket-launch hero, telemetry ticker, programs, FAQ.
- **Auth** (`/login`, `/signup`) — Supabase email/password.
- **Dashboard** (`/dashboard`) — total balance, live SPX chart, watchlist, streaming
  activity feed, positions.
- **Invest / Trade / Options / Copy / IPO** — the simulated desk.
- **Wallet** (`/wallet`) — deposits & withdrawals with admin approval + receipt upload.
- **Verify** (`/verify`) — KYC document submission to a private Storage bucket.
- **Support** (`/support`) — user ↔ support messaging.
- **Admin console** (`/admin`) — separate login; approve/reject requests, decide KYC,
  set balances/profit, suspend accounts, message users.

## Supabase setup
Run these in the Supabase SQL Editor (in order), then the scripts:
1. `supabase/schema.sql` — tables, RLS policies, enums.
2. `supabase/functions.sql` — RPCs.
3. `supabase/migration-02.sql` — notifications, enum-cast fix, suspend guards.
4. `supabase/migration-03.sql` — `suspend_reason` column + `admin_set_status`.
5. `node scripts/setup-storage.mjs` — create the `receipts` / `kyc-docs` buckets.
6. `node scripts/seed-admin.mjs` — create the admin console user.

## Deploy to Vercel
See [DEPLOY.md](DEPLOY.md) for the full checklist. In short:
1. Push to GitHub, import the repo in Vercel (framework auto-detected as Next.js).
2. Add the three env vars above under **Settings → Environment Variables**.
3. In Supabase **Auth → URL Configuration**, set the Site URL and redirect URLs to your
   Vercel domain.
4. Deploy. The build command is `next build` (default); no extra config needed.
