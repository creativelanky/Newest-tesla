// Promotes an existing user to admin by email. There's deliberately no
// in-app way to do this (that would be a privilege-escalation hole) — it's
// a one-off, run by whoever holds the service-role key.
//
// Usage:  node --env-file=.env.local scripts/make-admin.mjs you@example.com
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const email = process.argv[2];
if (!email) {
  console.error('Usage: node --env-file=.env.local scripts/make-admin.mjs <email>');
  process.exit(1);
}

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});

const { data: profile, error: findErr } = await admin
  .from('profiles')
  .select('id, email, role')
  .eq('email', email)
  .single();

if (findErr || !profile) {
  console.error(`✗ No profile found for ${email}. They need to sign up first.`);
  process.exit(1);
}

const { error } = await admin.from('profiles').update({ role: 'admin' }).eq('id', profile.id);
if (error) {
  console.error('✗ Failed:', error.message);
  process.exit(1);
}

console.log(`✓ ${email} is now an admin.`);
