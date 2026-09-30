// Server-side Supabase clients. Two flavours:
//  - supabaseServer(): request-scoped, cookie-authenticated, subject to RLS —
//    use this to read/write "as the signed-in user".
//  - supabaseAdmin(): service-role client, bypasses RLS entirely — use this
//    ONLY inside server code (Route Handlers) that has already verified the
//    caller is an admin. Never import this from a client component.
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component render — middleware refreshes
            // the session instead, so this is safe to ignore.
          }
        },
      },
    }
  );
}

let adminClient;

export function supabaseAdmin() {
  if (!adminClient) {
    adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return adminClient;
}
