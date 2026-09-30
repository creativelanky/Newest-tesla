# Deploying SpaceX Invest to Vercel

A step-by-step checklist for going live. Order matters: get Supabase ready first, then
Vercel, then wire the two together.

## 0. Prerequisites
- A Supabase project (free tier is fine).
- A GitHub repo containing this code.
- A Vercel account connected to that GitHub account.
- Node 22+ locally (see `.nvmrc`) if you run the setup scripts from your machine.

## 1. Prepare Supabase
Run in the Supabase **SQL Editor**, in this order:
1. `supabase/schema.sql`
2. `supabase/functions.sql`
3. `supabase/migration-02.sql`
4. `supabase/migration-03.sql`

Then, with `.env.local` filled in locally, run the scripts:
```bash
node scripts/setup-storage.mjs   # creates private `receipts` and `kyc-docs` buckets
node scripts/seed-admin.mjs      # creates the admin console user from ADMIN_EMAIL/PASSWORD
node scripts/verify-schema.mjs   # optional: sanity-check tables/RPCs exist
```

> The admin role is **never** grantable in-app (privilege-escalation guard). Promote a
> user only via `scripts/make-admin.mjs` or `UPDATE profiles SET role='admin' WHERE ...`.

## 2. Push to GitHub
```bash
git add -A
git commit -m "Prep for hosting"
git push
```
Confirm `.env.local` is **not** in the repo — it's gitignored, and no env file should
ever be committed. `git ls-files | grep env` must return nothing.

## 3. Import into Vercel
1. Vercel → **Add New → Project** → import the GitHub repo.
2. Framework preset auto-detects as **Next.js**. Leave build/output settings default
   (`next build`). No `vercel.json` needed.
3. Before the first deploy, add environment variables (next step).

## 4. Environment variables (Vercel → Settings → Environment Variables)
Add for **Production** (and Preview, if you want preview deploys to work):

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | your service-role key (server-only — do not prefix NEXT_PUBLIC) |

You do **not** need `ADMIN_EMAIL` / `ADMIN_PASSWORD` in Vercel unless you run the seed
script from CI. Keep the service-role key secret — anyone with it bypasses RLS.

## 5. Point Supabase Auth at the Vercel domain
Supabase → **Authentication → URL Configuration**:
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: add `https://your-app.vercel.app/**` (and any custom domain).

Without this, email confirmation / password-reset links point at localhost.

## 6. Deploy & smoke-test
After the deploy finishes, verify:
- [ ] `/` landing page loads.
- [ ] Sign up a throwaway account → lands on `/dashboard` with balances.
- [ ] `/verify` — KYC upload succeeds (Storage bucket + policy working).
- [ ] `/wallet` — submit a deposit; it appears in `/admin` as pending.
- [ ] `/admin` — log in with the seeded admin; approve the deposit; balance updates.
- [ ] `/support` — send a message; it shows in the admin user view.

## Notes & gotchas
- **Node version**: `engines.node` is `>=22`; Vercel honors it. If a build warns about
  Node 20, bump the project's Node version in Vercel → Settings → General.
- **Middleware**: `middleware.js` refreshes the Supabase session on every request —
  works on Vercel's edge/runtime with no extra config.
- **Images**: `next.config.mjs` allows remote images from `images.unsplash.com` only.
  Add any new remote hosts there before referencing them.
- **Custom domain**: add it in Vercel → Domains, then repeat step 5 with the new domain.
