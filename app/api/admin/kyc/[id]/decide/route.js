import { getAdminUser, forbidden, badRequest, ok } from '@/lib/supabase/guards';
import { supabaseServer } from '@/lib/supabase/server';

// [id] is the user's profile id here (KYC status lives on profiles).
export async function POST(req, { params }) {
  const admin = await getAdminUser();
  if (!admin) return forbidden();

  const { status, note } = await req.json();
  const { error } = await supabaseServer().rpc('admin_decide_kyc', {
    p_user_id: params.id,
    p_status: status,
    p_note: note || '',
  });

  if (error) return badRequest(error.message);
  return ok({ updated: true });
}
