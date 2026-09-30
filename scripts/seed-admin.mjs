// Seeds (or updates) the admin console account from ADMIN_EMAIL / ADMIN_PASSWORD
// in .env.local: creates the Supabase Auth user if missing, forces the password,
// confirms the email, and sets profiles.role = 'admin'. Idempotent.
//
// Usage:  node --env-file=.env.local scripts/seed-admin.mjs
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!url || !key || !email || !password) {
  console.error('Missing one of NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / ADMIN_EMAIL / ADMIN_PASSWORD');
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false }, realtime: { transport: ws } });

// Find an existing auth user with this email (paginate through the list).
async function findAuthUser() {
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

let user = await findAuthUser();

if (user) {
  await admin.auth.admin.updateUserById(user.id, { password, email_confirm: true });
  console.log('✓ updated existing admin auth user');
} else {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: 'Administrator' },
  });
  if (error) {
    console.error('✗ createUser failed:', error.message);
    process.exit(1);
  }
  user = data.user;
  console.log('✓ created admin auth user');
}

// The handle_new_user trigger created the profile row; make sure role is admin.
const { error: roleErr } = await admin
  .from('profiles')
  .update({ role: 'admin', name: 'Administrator' })
  .eq('id', user.id);

if (roleErr) {
  console.error('✗ could not set admin role:', roleErr.message);
  process.exit(1);
}

console.log(`✓ ${email} is ready as an admin. Sign in at /admin/login`);
