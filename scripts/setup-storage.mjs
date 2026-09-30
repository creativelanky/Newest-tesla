// One-off setup script: creates the private storage buckets used for
// deposit/withdrawal receipts and KYC documents. Safe to re-run.
//
// Usage:  node --env-file=.env.local scripts/setup-storage.mjs
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});

const BUCKETS = [
  { id: 'receipts', public: false, fileSizeLimit: '6MB' },
  { id: 'kyc-docs', public: false, fileSizeLimit: '6MB' },
];

for (const b of BUCKETS) {
  const { data: existing } = await admin.storage.getBucket(b.id);
  if (existing) {
    console.log(`✓ bucket "${b.id}" already exists`);
    continue;
  }
  const { error } = await admin.storage.createBucket(b.id, {
    public: b.public,
    fileSizeLimit: b.fileSizeLimit,
  });
  if (error) {
    console.error(`✗ failed to create "${b.id}":`, error.message);
  } else {
    console.log(`✓ created bucket "${b.id}"`);
  }
}
