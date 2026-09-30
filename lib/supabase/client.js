'use client';

// Browser-side Supabase client — uses the public anon key, subject to RLS.
// Safe to import from any client component.
import { createBrowserClient } from '@supabase/ssr';

let browserClient;

export function supabaseBrowser() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return browserClient;
}
