// Confirms every table from supabase/schema.sql actually exists and is
// queryable via the service-role client.
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(url, serviceKey, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});

const TABLES = [
  'profiles', 'holdings', 'positions', 'options_positions', 'copy_allocations',
  'ipo_reservations', 'transactions', 'funding_requests', 'kyc_docs',
  'messages', 'platform_settings',
];

let allOk = true;
for (const t of TABLES) {
  const { error, count } = await admin.from(t).select('*', { count: 'exact', head: true });
  if (error) {
    allOk = false;
    console.log(`✗ ${t}: ${error.message}`);
  } else {
    console.log(`✓ ${t} (${count} rows)`);
  }
}
process.exit(allOk ? 0 : 1);
