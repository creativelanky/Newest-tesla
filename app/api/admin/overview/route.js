import { getAdminUser, forbidden, ok } from '@/lib/supabase/guards';
import { supabaseAdmin } from '@/lib/supabase/server';
import { signedUrl } from '@/lib/supabase/upload-server';

// Full console dataset: every user, every funding request (with a signed
// receipt URL), every KYC doc set.
export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return forbidden();

  const db = supabaseAdmin();
  const [users, requests, kycDocs] = await Promise.all([
    db.from('profiles').select('*').order('created_at', { ascending: false }),
    db.from('funding_requests').select('*').order('created_at', { ascending: false }),
    db.from('kyc_docs').select('*'),
  ]);

  const requestsWithReceipts = await Promise.all(
    (requests.data || []).map(async (r) => ({
      ...r,
      receiptUrl: r.receipt_url ? await signedUrl('receipts', r.receipt_url) : null,
    }))
  );

  const docsByUser = {};
  for (const d of kycDocs.data || []) {
    (docsByUser[d.profile_id] ||= []).push(d);
  }
  for (const uid of Object.keys(docsByUser)) {
    docsByUser[uid] = await Promise.all(
      docsByUser[uid].map(async (d) => ({ ...d, url: await signedUrl('kyc-docs', d.file_url) }))
    );
  }

  return ok({
    users: users.data || [],
    requests: requestsWithReceipts,
    kycDocsByUser: docsByUser,
  });
}
