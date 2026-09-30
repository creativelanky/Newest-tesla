import { getSessionUser, unauthorized, ok } from '@/lib/supabase/guards';
import { supabaseAdmin } from '@/lib/supabase/server';
import { signedUrl } from '@/lib/supabase/upload-server';

// Everything the signed-in user needs to render the desk: profile, holdings,
// positions, options, copies, IPO reservation, transactions, funding
// requests, KYC docs (as signed URLs) and messages.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const admin = supabaseAdmin();
  const id = user.id;

  const [profile, holdings, positions, options, copies, ipo, transactions, requests, kycDocs, messages] =
    await Promise.all([
      admin.from('profiles').select('*').eq('id', id).single(),
      admin.from('holdings').select('*').eq('profile_id', id),
      admin.from('positions').select('*').eq('profile_id', id).order('opened_at', { ascending: false }),
      admin.from('options_positions').select('*').eq('profile_id', id).order('opened_at', { ascending: false }),
      admin.from('copy_allocations').select('*').eq('profile_id', id),
      admin.from('ipo_reservations').select('*').eq('profile_id', id).maybeSingle(),
      admin.from('transactions').select('*').eq('profile_id', id).order('created_at', { ascending: false }).limit(200),
      admin.from('funding_requests').select('*').eq('profile_id', id).order('created_at', { ascending: false }),
      admin.from('kyc_docs').select('*').eq('profile_id', id),
      admin.from('messages').select('*').eq('profile_id', id).order('created_at', { ascending: true }),
    ]);

  if (profile.error) return unauthorized('Profile not found.');

  const docsWithUrls = await Promise.all(
    (kycDocs.data || []).map(async (d) => ({ ...d, url: await signedUrl('kyc-docs', d.file_url) }))
  );

  return ok({
    profile: profile.data,
    holdings: holdings.data || [],
    positions: positions.data || [],
    options: options.data || [],
    copies: copies.data || [],
    ipo: ipo.data || { reserved: 0 },
    transactions: transactions.data || [],
    requests: requests.data || [],
    kycDocs: docsWithUrls,
    messages: messages.data || [],
  });
}
